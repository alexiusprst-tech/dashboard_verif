<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Penugasan\StorePenugasanDosenRequest;
use App\Services\PenugasanDosenService;
use App\Repositories\Contracts\PenugasanRepositoryContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PenugasanDosenController extends Controller
{
    protected PenugasanDosenService $penugasanDosenService;
    protected PenugasanRepositoryContract $penugasanRepository;

    public function __construct(
        PenugasanDosenService $penugasanDosenService,
        PenugasanRepositoryContract $penugasanRepository
    ) {
        $this->penugasanDosenService = $penugasanDosenService;
        $this->penugasanRepository = $penugasanRepository;
    }

    /**
     * List pemetaan dosen target per PIC.
     */
    public function index(Request $request): JsonResponse
    {
        $periodeId  = $request->query('periode_id');
        $verifierId = $request->query('verifier_id');

        if (!$periodeId) {
            return response()->json([
                'success' => false,
                'message' => 'Periode ID wajib ditentukan.'
            ], 422);
        }

        if ($verifierId) {
            // Ambil dosen target khusus untuk verifier ini
            $assignments = $this->penugasanRepository->findByVerifierAndPeriode((int) $verifierId, (int) $periodeId);
            $data = $assignments->map(function ($p) {
                return [
                    'id'              => $p->id,
                    'periode_id'      => $p->periode_id,
                    'verifier_id'     => $p->verifier_id,
                    'target_dosen_id' => $p->target_dosen_id,
                    'assigned_at'     => $p->assigned_at?->toIso8601String(),
                    'dosen'           => $p->targetDosen ? [
                        'id'           => $p->targetDosen->id,
                        'nama_lengkap' => $p->targetDosen->nama_lengkap,
                        'kode_dosen'   => $p->targetDosen->kode_dosen,
                        'email'        => $p->targetDosen->email,
                    ] : null,
                ];
            });
        } else {
            // Ambil semua pemetaan untuk periode ini (paginated)
            $perPage = (int) $request->query('per_page', 50);
            $paginator = $this->penugasanRepository->paginate((int) $periodeId, $perPage);
            $items = $paginator->items();
            $data = collect($items)->map(function ($p) {
                return [
                    'id'              => $p->id,
                    'periode_id'      => $p->periode_id,
                    'verifier_id'     => $p->verifier_id,
                    'target_dosen_id' => $p->target_dosen_id,
                    'assigned_at'     => $p->assigned_at?->toIso8601String(),
                    'dosen'           => $p->targetDosen ? [
                        'id'           => $p->targetDosen->id,
                        'nama_lengkap' => $p->targetDosen->nama_lengkap,
                        'kode_dosen'   => $p->targetDosen->kode_dosen,
                        'email'        => $p->targetDosen->email,
                    ] : null,
                    'verifier'        => $p->verifier ? [
                        'id'           => $p->verifier->id,
                        'nama_lengkap' => $p->verifier->nama_lengkap,
                        'kode_dosen'   => $p->verifier->kode_dosen,
                    ] : null,
                ];
            });
        }

        return response()->json([
            'success' => true,
            'message' => 'Data pemetaan dosen target berhasil diambil.',
            'data'    => $data,
        ]);
    }

    /**
     * Petakan dosen target ke PIC.
     */
    public function store(StorePenugasanDosenRequest $request): JsonResponse
    {
        $user = $request->user();
        $periodeId = (int) $request->input('periode_id');
        $verifierId = (int) $request->input('verifier_id');

        $isCoordinator = $user->isSuperAdmin() || $user->is_coordinator || $user->is_koordinator_mk;

        if (!$isCoordinator) {
            $isPic = app(\App\Repositories\Contracts\UserRoleRepositoryContract::class)->isActivePic($user->id, $periodeId);
            $isVerifikator = $user->isVerifikatorPadaPeriode($periodeId);

            if (!$isPic && !$isVerifikator) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki penugasan PIC/Verifikator pada periode ini.'
                ], 403);
            }
            if ($verifierId !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sebagai PIC/Verifikator, Anda hanya dapat menetapkan dosen target untuk diri Anda sendiri.'
                ], 403);
            }
        }

        $result = $this->penugasanDosenService->assign($request->validated(), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Dosen target berhasil ditugaskan.',
            'data'    => $result,
        ]);
    }

    /**
     * Cabut pemetaan dosen target dari PIC.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $penugasan = $this->penugasanRepository->findById($id);
        if (!$penugasan) {
            return response()->json([
                'success' => false,
                'message' => 'Penugasan tidak ditemukan.'
            ], 404);
        }

        $isCoordinator = $user->isSuperAdmin() || $user->is_coordinator;
        if (!$isCoordinator) {
            if ($penugasan->verifier_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sebagai PIC, Anda hanya dapat menghapus dosen target Anda sendiri.'
                ], 403);
            }
        }

        $this->penugasanDosenService->cabut($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Pemetaan dosen target berhasil dicabut.'
        ]);
    }
}
