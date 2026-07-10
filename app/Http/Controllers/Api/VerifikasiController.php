<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Verifikasi\StoreVerifikasiRequest;
use App\Http\Resources\SoalResource;
use App\Http\Resources\VerificationResource;
use App\Repositories\Contracts\SoalRepositoryContract;
use App\Repositories\Contracts\VerificationRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Services\VerifikasiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VerifikasiController extends Controller
{
    protected VerifikasiService $verifikasiService;
    protected SoalRepositoryContract $soalRepository;
    protected VerificationRepositoryContract $verificationRepository;
    protected PeriodeRepositoryContract $periodeRepository;

    public function __construct(
        VerifikasiService $verifikasiService,
        SoalRepositoryContract $soalRepository,
        VerificationRepositoryContract $verificationRepository,
        PeriodeRepositoryContract $periodeRepository
    ) {
        $this->verifikasiService = $verifikasiService;
        $this->soalRepository = $soalRepository;
        $this->verificationRepository = $verificationRepository;
        $this->periodeRepository = $periodeRepository;
    }

    public function tugasSaya(Request $request): JsonResponse
    {
        $user = $request->user();
        $periodeId = $request->query('periode_id');
        $perPage = $request->query('per_page', 15);

        if (!$periodeId) {
            $activePeriode = $this->periodeRepository->findActive();
            if ($activePeriode) {
                $periodeId = $activePeriode->id;
            }
        }

        if (!$periodeId) {
            return response()->json([
                'success' => false,
                'message' => 'Periode ID wajib ditentukan.'
            ], 422);
        }

        $paginator = $this->soalRepository->findForVerifier($user->id, (int)$periodeId, $perPage);

        return SoalResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Daftar tugas verifikasi berhasil diambil.'
        ])->response();
    }

    public function submit(StoreVerifikasiRequest $request, int $soalId): JsonResponse
    {
        $verification = $this->verifikasiService->submit($soalId, $request->validated(), $request->user());

        return (new VerificationResource($verification))->additional([
            'success' => true,
            'message' => 'Verifikasi berhasil disimpan.'
        ])->response();
    }

    public function history(Request $request, int $soalId): JsonResponse
    {
        $verifications = $this->verificationRepository->findAllBySoal($soalId);

        return VerificationResource::collection($verifications)->additional([
            'success' => true,
            'message' => 'Riwayat verifikasi berhasil diambil.'
        ])->response();
    }
}
