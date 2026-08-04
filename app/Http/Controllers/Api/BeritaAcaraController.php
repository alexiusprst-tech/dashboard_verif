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

        if ($user->isSuperAdmin() || $user->isCoordinator()) {
            // Super Admin & Coordinator bisa melihat seluruh BA
        } else {
            // Dosen & PIC melihat BA di mana mereka adalah verifikator atau soal milik mereka ada di BA tersebut
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
            || $user->isCoordinator()
            || $ba->verifier_id === $user->id
            || $ba->items()->whereHas('soal', function ($q) use ($user) {
                $q->where('dosen_id', $user->id);
            })->exists();

        if (!$isOwnerOrVerifier) {
            abort(403, 'Anda tidak memiliki wewenang untuk mengunduh Berita Acara ini.');
        }

        if (!$ba->file_docx) {
            abort(404, 'File DOCX belum di-generate.');
        }

        $path = \Illuminate\Support\Facades\Storage::disk('local')->path($ba->file_docx);
        if (!\Illuminate\Support\Facades\Storage::disk('local')->exists($ba->file_docx)) {
            abort(404, 'File tidak ditemukan di server.');
        }

        return response()->download($path, basename($ba->file_docx));
    }
}
