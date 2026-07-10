<?php

namespace App\Services;

use App\Repositories\Contracts\PloRepositoryContract;
use App\Models\Plo;
use App\Models\User;
use App\Exceptions\BusinessException;

class PloService
{
    protected PloRepositoryContract $ploRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        PloRepositoryContract $ploRepository,
        ActivityLogService $activityLogService
    ) {
        $this->ploRepository = $ploRepository;
        $this->activityLogService = $activityLogService;
    }

    public function create(array $data, User $user): Plo
    {
        $data['created_by'] = $user->id;
        $plo = $this->ploRepository->create($data);

        $this->activityLogService->log("Membuat PLO baru: {$plo->kode}", 'PLO', $user->id);

        return $plo;
    }

    public function update(int $id, array $data, User $user): Plo
    {
        $plo = $this->ploRepository->findById($id);
        if (!$plo) {
            throw new BusinessException('PLO tidak ditemukan.', 404);
        }

        // Ownership check: Hanya creator atau Super Admin yang boleh edit
        if (!$user->isSuperAdmin() && $plo->created_by !== $user->id) {
            throw new BusinessException('Anda tidak memiliki akses untuk mengubah PLO ini.', 403);
        }

        $plo = $this->ploRepository->update($plo, $data);

        $this->activityLogService->log("Mengubah PLO: {$plo->kode}", 'PLO', $user->id);

        return $plo;
    }

    public function delete(int $id, User $user): void
    {
        $plo = $this->ploRepository->findById($id);
        if (!$plo) {
            throw new BusinessException('PLO tidak ditemukan.', 404);
        }

        // Ownership check
        if (!$user->isSuperAdmin() && $plo->created_by !== $user->id) {
            throw new BusinessException('Anda tidak memiliki akses untuk menghapus PLO ini.', 403);
        }

        // Cek apakah PLO dipakai di CLO
        if ($this->ploRepository->isUsedByClo($plo->id)) {
            throw new BusinessException('PLO ini tidak dapat dihapus karena sudah digunakan oleh CLO.', 422);
        }

        $this->ploRepository->delete($plo);

        $this->activityLogService->log("Menghapus PLO: {$plo->kode}", 'PLO', $user->id);
    }
}
