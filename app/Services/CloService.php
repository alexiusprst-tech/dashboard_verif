<?php

namespace App\Services;

use App\Repositories\Contracts\CloRepositoryContract;
use App\Models\Clo;
use App\Models\User;
use App\Exceptions\BusinessException;

class CloService
{
    protected CloRepositoryContract $cloRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        CloRepositoryContract $cloRepository,
        ActivityLogService $activityLogService
    ) {
        $this->cloRepository = $cloRepository;
        $this->activityLogService = $activityLogService;
    }

    public function create(array $data, User $user): Clo
    {
        $data['created_by'] = $user->id;
        $clo = $this->cloRepository->create($data);

        $this->activityLogService->log("Membuat CLO baru: {$clo->kode}", 'CLO', $user->id);

        return $clo;
    }

    public function update(int $id, array $data, User $user): Clo
    {
        $clo = $this->cloRepository->findById($id);
        if (!$clo) {
            throw new BusinessException('CLO tidak ditemukan.', 404);
        }

        // Ownership check: Hanya creator atau Super Admin yang boleh edit
        if (!$user->isSuperAdmin() && $clo->created_by !== $user->id) {
            throw new BusinessException('Anda tidak memiliki akses untuk mengubah CLO ini.', 403);
        }

        $clo = $this->cloRepository->update($clo, $data);

        $this->activityLogService->log("Mengubah CLO: {$clo->kode}", 'CLO', $user->id);

        return $clo;
    }

    public function delete(int $id, User $user): void
    {
        $clo = $this->cloRepository->findById($id);
        if (!$clo) {
            throw new BusinessException('CLO tidak ditemukan.', 404);
        }

        // Ownership check
        if (!$user->isSuperAdmin() && $clo->created_by !== $user->id) {
            throw new BusinessException('Anda tidak memiliki akses untuk menghapus CLO ini.', 403);
        }

        // Cek apakah CLO dipakai di Soal
        if ($this->cloRepository->isUsedBySoal($clo->id)) {
            throw new BusinessException('CLO ini tidak dapat dihapus karena sudah digunakan dalam Soal.', 422);
        }

        $this->cloRepository->delete($clo);

        $this->activityLogService->log("Menghapus CLO: {$clo->kode}", 'CLO', $user->id);
    }
}
