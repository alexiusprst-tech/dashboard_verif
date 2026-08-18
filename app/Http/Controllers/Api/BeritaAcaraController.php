<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BeritaAcara\GenerateBeritaAcaraRequest;
use App\Http\Resources\BeritaAcaraResource;
use App\Repositories\Contracts\BeritaAcaraRepositoryContract;
use App\Services\BeritaAcaraService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BeritaAcaraController extends Controller
{
    protected BeritaAcaraService $beritaAcaraService;
    protected BeritaAcaraRepositoryContract $beritaAcaraRepository;

    public function __construct(
        BeritaAcaraService $beritaAcaraService,
        BeritaAcaraRepositoryContract $beritaAcaraRepository
    ) {
        $this->beritaAcaraService = $beritaAcaraService;
        $this->beritaAcaraRepository = $beritaAcaraRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['periode_id', 'verifier_id']);
        $perPage = $request->query('per_page', 15);

        if ($user->isSuperAdmin()) {
            // Super Admin bisa melihat seluruh Berita Acara
        } elseif ($user->isKoordinatorMk()) {
            // Koordinator MK bisa melihat Berita Acara miliknya sendiri
            // DAN Berita Acara para verifikator soal untuk mata kuliah yang dikoordinasikannya
            $filters['koordinator_user'] = $user;
        } else {
            // Dosen & Verifikator biasa melihat BA di mana mereka adalah verifikator atau pembuat soal
            $filters['dosen_id'] = $user->id;
        }

        $paginator = $this->beritaAcaraRepository->paginate($filters, $perPage);

        return BeritaAcaraResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data Berita Acara berhasil diambil.'
        ])->response();
    }

    public function generate(GenerateBeritaAcaraRequest $request): JsonResponse
    {
        $data      = $request->validated();
        $authUser  = $request->user();

        // Super Admin menentukan PIC (verifier) yang BA-nya digenerate via verifier_id.
        // PIC generate Berita Acara miliknya sendiri — verifier otomatis = diri sendiri.
        if ($authUser->isSuperAdmin()) {
            $verifier = \App\Models\User::findOrFail((int) $data['verifier_id']);
        } else {
            $verifier = $authUser;
        }

        // Cek jika sudah ada BA untuk PIC ini di periode ini.
        $existing = $this->beritaAcaraRepository->findByVerifierAndPeriode($verifier->id, (int)$data['periode_id']);

        if ($existing && $request->has('regenerate')) {
            $ba = $this->beritaAcaraService->regenerate($existing->id, $authUser);
            $message = 'Berita Acara berhasil diregenerasi dengan data verifikasi terbaru.';
        } else {
            $ba = $this->beritaAcaraService->generate((int)$data['periode_id'], $verifier);
            $message = 'Berita Acara berhasil dibangun (generate).';
        }

        return (new BeritaAcaraResource($ba))->additional([
            'success' => true,
            'message' => $message
        ])->response();
    }

    public function print(Request $request, int $id): BinaryFileResponse
    {
        $type = $request->query('type', 'ba'); // 'ba', 'soal', atau 'both'
        $filePath = $this->beritaAcaraService->print($id, $type, $request->user());

        return response()->download($filePath);
    }

    public function download(Request $request, int $id): BinaryFileResponse
    {
        $ba = $this->beritaAcaraRepository->findById($id);
        if (!$ba) {
            abort(404, 'Berita Acara tidak ditemukan.');
        }

        $user = $request->user();
        $isOwnerOrVerifier = $user->isSuperAdmin()
            || $ba->verifier_id === $user->id
            || ($ba->soal && $ba->soal->dosen_id === $user->id)
            || $ba->items()->whereHas('soal', function ($q) use ($user) {
                $q->where('dosen_id', $user->id);
            })->exists();

        // Cek jika user adalah Koordinator MK untuk mata kuliah di Berita Acara ini
        if (!$isOwnerOrVerifier && $user->isKoordinatorMk()) {
            $courseIds = [];
            if ($ba->soal && $ba->soal->mata_kuliah_id) {
                $courseIds[] = $ba->soal->mata_kuliah_id;
            }
            $itemCourseIds = $ba->items()->with('soal')->get()->pluck('soal.mata_kuliah_id')->filter()->toArray();
            $courseIds = array_unique(array_merge($courseIds, $itemCourseIds));

            if (!empty($courseIds)) {
                $isOwnerOrVerifier = \App\Models\PenugasanKoordinator::where('dosen_id', $user->id)
                    ->whereIn('course_id', $courseIds)
                    ->exists();
            }
        }

        if (!$isOwnerOrVerifier) {
            abort(403, 'Anda tidak memiliki wewenang untuk mengunduh Berita Acara ini.');
        }

        if (!$ba->file_docx) {
            abort(404, 'File DOCX belum di-generate.');
        }

        $disk = \Illuminate\Support\Facades\Storage::disk('public')->exists($ba->file_docx)
            ? 'public'
            : 'local';

        if (!\Illuminate\Support\Facades\Storage::disk($disk)->exists($ba->file_docx)) {
            abort(404, 'File tidak ditemukan di server.');
        }

        $path = \Illuminate\Support\Facades\Storage::disk($disk)->path($ba->file_docx);

        return response()->download($path, basename($ba->file_docx));
    }
}
