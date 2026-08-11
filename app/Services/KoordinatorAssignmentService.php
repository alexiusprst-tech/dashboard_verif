<?php

namespace App\Services;

use App\Repositories\Contracts\KoordinatorAssignmentRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Repositories\Contracts\UserRepositoryContract;
use App\Models\KoordinatorAssignment;
use App\Models\User;
use App\Exceptions\BusinessException;
use Illuminate\Support\Facades\DB;

/**
 * KoordinatorAssignmentService — Business logic untuk penugasan Koordinator.
 *
 * BR-02: Koordinator dapat berubah setiap semester.
 * BR-03: Super Admin dapat menunjuk Koordinator.
 * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
 */
class KoordinatorAssignmentService
{
    protected KoordinatorAssignmentRepositoryContract $repository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected UserRepositoryContract $userRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        KoordinatorAssignmentRepositoryContract $repository,
        PeriodeRepositoryContract $periodeRepository,
        UserRepositoryContract $userRepository,
        ActivityLogService $activityLogService
    ) {
        $this->repository = $repository;
        $this->periodeRepository = $periodeRepository;
        $this->userRepository = $userRepository;
        $this->activityLogService = $activityLogService;
    }

    /**
     * Assign seorang dosen sebagai Koordinator pada periode tertentu.
     * BR-03: Super Admin dapat menunjuk Koordinator.
     */
    public function assign(array $data, User $assignedBy): KoordinatorAssignment
    {
        $userId = (int) $data['user_id'];
        $periodeId = (int) $data['periode_id'];

        // Validasi user target
        $targetUser = $this->userRepository->findById($userId);
        if (!$targetUser) {
            throw new BusinessException('Dosen tidak ditemukan.', 404);
        }

        if (!$targetUser->status_aktif) {
            throw new BusinessException('Dosen tidak aktif.', 422);
        }

        // Validasi periode
        $periode = $this->periodeRepository->findById($periodeId);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
        }

        // Cek apakah sudah ada assignment untuk user ini di periode ini
        $existing = $this->repository->findByUserAndPeriode($userId, $periodeId);
        if ($existing) {
            throw new BusinessException(
                'Dosen ini sudah ditugaskan sebagai Koordinator pada periode ini.',
                422
            );
        }

        $assignment = DB::transaction(function () use ($userId, $periodeId, $assignedBy) {
            return $this->repository->create([
                'user_id' => $userId,
                'periode_id' => $periodeId,
                'assigned_by' => $assignedBy->id,
                'assigned_at' => now(),
            ]);
        });

        $this->activityLogService->log(
            "Menugaskan {$targetUser->nama_lengkap} sebagai Koordinator pada periode ID {$periodeId}",
            'Koordinator Assignment',
            $assignedBy->id
        );

        return $this->repository->findById($assignment->id);
    }

    /**
     * Ganti Koordinator: update assignment yang ada dengan user baru.
     * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
     */
    public function replace(int $assignmentId, array $data, User $assignedBy): KoordinatorAssignment
    {
        $assignment = $this->repository->findById($assignmentId);
        if (!$assignment) {
            throw new BusinessException('Assignment Koordinator tidak ditemukan.', 404);
        }

        $newUserId = (int) $data['user_id'];

        // Validasi user baru
        $newUser = $this->userRepository->findById($newUserId);
        if (!$newUser) {
            throw new BusinessException('Dosen pengganti tidak ditemukan.', 404);
        }

        if (!$newUser->status_aktif) {
            throw new BusinessException('Dosen pengganti tidak aktif.', 422);
        }

        // Cek apakah user baru sudah ada assignment di periode yang sama
        $existing = $this->repository->findByUserAndPeriode($newUserId, $assignment->periode_id);
        if ($existing && $existing->id !== $assignment->id) {
            throw new BusinessException(
                'Dosen pengganti sudah ditugaskan sebagai Koordinator pada periode ini.',
                422
            );
        }

        $oldUserName = $assignment->user->nama_lengkap;

        $assignment = DB::transaction(function () use ($assignment, $newUserId, $assignedBy) {
            return $this->repository->update($assignment, [
                'user_id' => $newUserId,
                'assigned_by' => $assignedBy->id,
                'assigned_at' => now(),
            ]);
        });

        $this->activityLogService->log(
            "Mengganti Koordinator dari {$oldUserName} menjadi {$newUser->nama_lengkap} pada periode ID {$assignment->periode_id}",
            'Koordinator Assignment',
            $assignedBy->id
        );

        return $this->repository->findById($assignment->id);
    }

    /**
     * Hapus assignment Koordinator.
     */
    public function remove(int $assignmentId, User $removedBy): void
    {
        $assignment = $this->repository->findById($assignmentId);
        if (!$assignment) {
            throw new BusinessException('Assignment Koordinator tidak ditemukan.', 404);
        }

        $userName = $assignment->user->nama_lengkap;
        $periodeId = $assignment->periode_id;

        $this->repository->delete($assignment);

        $this->activityLogService->log(
            "Menghapus penugasan Koordinator {$userName} dari periode ID {$periodeId}",
            'Koordinator Assignment',
            $removedBy->id
        );
    }
}
