<?php

namespace App\Services;

use App\Repositories\Contracts\DashboardRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Models\User;
use App\Exceptions\BusinessException;

class DashboardService
{
    protected DashboardRepositoryContract $dashboardRepository;
    protected PeriodeRepositoryContract $periodeRepository;

    public function __construct(
        DashboardRepositoryContract $dashboardRepository,
        PeriodeRepositoryContract $periodeRepository
    ) {
        $this->dashboardRepository = $dashboardRepository;
        $this->periodeRepository = $periodeRepository;
    }

    public function superAdmin(): array
    {
        $activePeriode = $this->periodeRepository->findActive();
        if (!$activePeriode) {
            return [
                'periode' => null,
                'soal_status_counts' => [],
                'progress' => null
            ];
        }

        return [
            'periode' => $activePeriode,
            'soal_status_counts' => $this->dashboardRepository->countSoalByStatus($activePeriode->id),
            'progress' => $this->dashboardRepository->progressByPeriode($activePeriode->id)
        ];
    }

    public function dosen(User $user): array
    {
        $activePeriode = $this->periodeRepository->findActive();
        if (!$activePeriode) {
            return [
                'periode' => null,
                'soal_status_counts' => [],
                'deadline' => null
            ];
        }

        return [
            'periode' => $activePeriode,
            'soal_status_counts' => $this->dashboardRepository->countSoalByStatus($activePeriode->id, $user->id),
            'deadline' => $this->dashboardRepository->nearestDeadline($user->id)
        ];
    }

    public function pic(User $user): array
    {
        $activePeriode = $this->periodeRepository->findActive();
        if (!$activePeriode) {
            return [
                'periode' => null,
                'summary' => ['total' => 0, 'pending' => 0, 'done' => 0]
            ];
        }

        return [
            'periode' => $activePeriode,
            'summary' => $this->dashboardRepository->picSummary($user->id, $activePeriode->id)
        ];
    }

    public function coordinator(): array
    {
        $activePeriode = $this->periodeRepository->findActive();
        if (!$activePeriode) {
            return [
                'periode' => null,
                'progress_by_prodi' => []
            ];
        }

        return [
            'periode' => $activePeriode,
            'progress_by_prodi' => $this->dashboardRepository->progressByProdi($activePeriode->id)
        ];
    }
}
