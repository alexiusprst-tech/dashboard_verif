<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Soal\StoreSoalRequest;
use App\Http\Requests\Soal\UpdateSoalRequest;
use App\Http\Resources\SoalResource;
use App\Http\Resources\SoalDetailResource;
use App\Repositories\Contracts\SoalRepositoryContract;
use App\Repositories\Contracts\PenugasanRepositoryContract;
use App\Services\SoalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SoalController extends Controller
{
    protected SoalService $soalService;
    protected SoalRepositoryContract $soalRepository;
    protected PenugasanRepositoryContract $penugasanRepository;

    public function __construct(
        SoalService $soalService,
        SoalRepositoryContract $soalRepository,
        PenugasanRepositoryContract $penugasanRepository
    ) {
        $this->soalService = $soalService;
        $this->soalRepository = $soalRepository;
        $this->penugasanRepository = $penugasanRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['periode_id', 'status', 'dosen_id', 'mata_kuliah_id']);
        $perPage = $request->query('per_page', 15);

        // Otorisasi list: Dosen hanya boleh melihat soal miliknya sendiri
        if (!$user->isSuperAdmin()) {
            $filters['dosen_id'] = $user->id;
        }

        $paginator = $this->soalRepository->paginate($filters, $perPage);

        return SoalResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data soal berhasil diambil.'
        ])->response();
    }

    public function store(StoreSoalRequest $request): JsonResponse
    {
        $soal = $this->soalService->upload(
            $request->validated(),
            $request->file('file_soal'),
            $request->user()
        );

        return (new SoalResource($soal))->additional([
            'success' => true,
            'message' => 'Soal berhasil diunggah.'
        ])->response();
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $soal = $this->soalRepository->findById($id);

        if (!$soal) {
            return response()->json([
                'success' => false,
                'message' => 'Soal tidak ditemukan.'
            ], 404);
        }

        // Otorisasi detail: Dosen sendiri, PIC penugasan, atau Coordinator (Super Admin)
        $hasAccess = false;
        if ($user->isSuperAdmin()) {
            $hasAccess = true;
        } elseif ($soal->isOwnedBy($user->id)) {
            $hasAccess = true;
        } else {
            // Cek apakah user adalah PIC untuk dosen pemilik soal ini pada periode aktif
            $assignment = $this->penugasanRepository->findByTargetAndPeriode($soal->dosen_id, $soal->periode_id);
            if ($assignment && $assignment->verifier_id === $user->id) {
                $hasAccess = true;
            }
        }

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melihat soal ini.'
            ], 403);
        }

        return (new SoalDetailResource($soal))->additional([
            'success' => true,
            'message' => 'Detail soal berhasil diambil.'
        ])->response();
    }

    public function update(UpdateSoalRequest $request, int $id): JsonResponse
    {
        $soal = $this->soalService->update(
            $id,
            $request->validated(),
            $request->file('file_soal'),
            $request->user()
        );

        return (new SoalResource($soal))->additional([
            'success' => true,
            'message' => 'Soal berhasil diperbarui.'
        ])->response();
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->soalService->delete($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Soal berhasil dihapus.'
        ]);
    }
}
