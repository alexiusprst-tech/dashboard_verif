<?php

namespace App\Services;

use App\Repositories\Contracts\PenugasanRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Models\Penugasan;
use App\Models\User;
use App\Exceptions\BusinessException;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\UniqueConstraintViolationException;

class PenugasanPicService
{
    protected PenugasanRepositoryContract $penugasanRepository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        PenugasanRepositoryContract $penugasanRepository,
        PeriodeRepositoryContract $periodeRepository,
        ActivityLogService $activityLogService
    ) {
        $this->penugasanRepository = $penugasanRepository;
        $this->periodeRepository = $periodeRepository;
        $this->activityLogService = $activityLogService;
    }

    public function assign(array $data, User $assignedBy): array
    {
        $periodeId = $data['periode_id'];
        $verifierId = $data['pic_dosen_id'];
        $targetDosenIds = $data['target_dosen_id']; // Array of target dosen IDs

        $periode = $this->periodeRepository->findById($periodeId);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
        }

        $assignments = [];
        
        DB::transaction(function () use ($periodeId, $verifierId, $targetDosenIds, $assignedBy, &$assignments) {
            foreach ($targetDosenIds as $targetDosenId) {
                if ((int)$verifierId === (int)$targetDosenId) {
                    throw new BusinessException('PIC tidak boleh ditugaskan untuk memverifikasi soalnya sendiri.', 422);
                }

                // Cek apakah target dosen sudah ditugaskan ke PIC lain di periode yang sama
                if ($this->penugasanRepository->isTargetAssignedToOtherVerifier($targetDosenId, $periodeId, $verifierId)) {
                    throw new BusinessException('Salah satu target dosen sudah ditugaskan ke PIC lain pada periode ini.', 422);
                }

                try {
                    $assignments[] = $this->penugasanRepository->create([
                        'periode_id' => $periodeId,
                        'verifier_id' => $verifierId,
                        'target_dosen_id' => $targetDosenId,
                        'assigned_by' => $assignedBy->id,
                        'assigned_at' => now(),
                    ]);
                } catch (\Exception $e) {
                    // Tangkap duplicate unique key constraint dari database
                    if (str_contains($e->getMessage(), 'penugasan_unique_assignment') || $e instanceof UniqueConstraintViolationException) {
                        throw new BusinessException('Penugasan ini sudah ada sebelumnya.', 422);
                    }
                    throw $e;
                }
            }
        });

        // Hitung total PIC unik di periode ini
        $uniqueVerifierCount = $this->penugasanRepository->countUniqueVerifierInPeriode($periodeId);

        $warning = null;
        if ($uniqueVerifierCount < 4 || $uniqueVerifierCount > 5) {
            $warning = "Perhatian: Jumlah PIC yang ditugaskan pada periode ini saat ini adalah {$uniqueVerifierCount} dosen. (Rekomendasi institusi: 4–5 PIC per periode).";
        }

        $this->activityLogService->log(
            "Menugaskan PIC dosen ID {$verifierId} untuk " . count($targetDosenIds) . " dosen target.",
            'Penugasan PIC',
            $assignedBy->id
        );

        return [
            'assignments' => $assignments,
            'unique_pic_count' => $uniqueVerifierCount,
            'warning' => $warning
        ];
    }

    public function cabut(int $id, User $user): void
    {
        $penugasan = $this->penugasanRepository->findById($id);
        if (!$penugasan) {
            throw new BusinessException('Penugasan tidak ditemukan.', 404);
        }

        $this->penugasanRepository->delete($penugasan);

        $this->activityLogService->log(
            "Mencabut penugasan PIC ID {$penugasan->verifier_id} untuk dosen ID {$penugasan->target_dosen_id}",
            'Penugasan PIC',
            $user->id
        );
    }
}
