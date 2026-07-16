<?php

namespace App\Services;

use App\Repositories\Contracts\UserRoleRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Models\UserRole;
use App\Models\User;
use App\Exceptions\BusinessException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class PenugasanPicService
{
    protected UserRoleRepositoryContract $userRoleRepository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        UserRoleRepositoryContract $userRoleRepository,
        PeriodeRepositoryContract $periodeRepository,
        ActivityLogService $activityLogService
    ) {
        $this->userRoleRepository = $userRoleRepository;
        $this->periodeRepository = $periodeRepository;
        $this->activityLogService = $activityLogService;
    }

    /**
     * Assign role PIC ke dosen untuk periode tertentu.
     *
     * @param  array{periode_id: int, pic_dosen_id: int}  $data
     * @param  User  $assignedBy
     * @return array{user_role: UserRole, pic_count: int, warning: string|null}
     */
    public function assign(array $data, User $assignedBy): array
    {
        $periodeId = (int) $data['periode_id'];
        $userId    = (int) $data['pic_dosen_id'];

        $periode = $this->periodeRepository->findById($periodeId);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
        }

        // Cegah Super Admin assign dirinya sendiri (opsional, bisa direlaksasi)
        if ($userId === $assignedBy->id && $assignedBy->isSuperAdmin()) {
            // Boleh — Super Admin mungkin juga dosen
        }

        $userRole = DB::transaction(function () use ($userId, $periodeId, $assignedBy) {
            try {
                return $this->userRoleRepository->assignPic($userId, $periodeId, $assignedBy->id);
            } catch (\Exception $e) {
                if (
                    str_contains($e->getMessage(), 'user_roles_unique_assignment')
                    || $e instanceof UniqueConstraintViolationException
                ) {
                    throw new BusinessException('Dosen ini sudah menjadi PIC pada periode tersebut.', 422);
                }
                throw $e;
            }
        });

        $picCount = $this->userRoleRepository->countPicInPeriode($periodeId);

        $warning = null;
        if ($picCount < 4 || $picCount > 5) {
            $warning = "Perhatian: Jumlah PIC pada periode ini adalah {$picCount} dosen. (Rekomendasi institusi: 4–5 PIC per periode).";
        }

        $this->activityLogService->log(
            "Menugaskan role PIC kepada dosen ID {$userId} untuk periode ID {$periodeId}.",
            'Penugasan PIC',
            $assignedBy->id
        );

        return [
            'user_role' => $userRole->load(['user', 'role', 'periode', 'assignedByUser']),
            'pic_count' => $picCount,
            'warning'   => $warning,
        ];
    }

    /**
     * Cabut role PIC dari user_roles berdasarkan ID baris user_roles.
     */
    public function cabut(int $userRoleId, User $user): void
    {
        $userRole = $this->userRoleRepository->findById($userRoleId);
        if (!$userRole) {
            throw new BusinessException('Penugasan PIC tidak ditemukan.', 404);
        }

        $this->userRoleRepository->revokePic($userRole);

        $this->activityLogService->log(
            "Mencabut role PIC dari dosen ID {$userRole->user_id} (periode ID {$userRole->periode_id}).",
            'Penugasan PIC',
            $user->id
        );
    }
}
