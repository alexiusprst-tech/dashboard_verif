<?php

namespace App\Repositories\Eloquent;

use App\Models\Role;
use App\Models\UserRole;
use App\Repositories\Contracts\UserRoleRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentUserRoleRepository implements UserRoleRepositoryContract
{
    public function assignPic(int $userId, int $periodeId, int $assignedBy): UserRole
    {
        $picRole = Role::where('nama_role', 'pic')->firstOrFail();

        return UserRole::create([
            'user_id'     => $userId,
            'role_id'     => $picRole->id,
            'periode_id'  => $periodeId,
            'assigned_by' => $assignedBy,
            'assigned_at' => now(),
        ]);
    }

    public function revokePic(UserRole $userRole): bool
    {
        return (bool) $userRole->delete();
    }

    public function findById(int $id): ?UserRole
    {
        return UserRole::with(['user', 'role', 'periode', 'assignedByUser'])->find($id);
    }

    public function isActivePic(int $userId, int $periodeId): bool
    {
        return UserRole::where('user_id', $userId)
            ->where('periode_id', $periodeId)
            ->whereHas('role', fn ($q) => $q->where('nama_role', 'pic'))
            ->exists();
    }

    public function getActivePicPeriodes(int $userId): Collection
    {
        return UserRole::where('user_id', $userId)
            ->whereHas('role', fn ($q) => $q->where('nama_role', 'pic'))
            ->pluck('periode_id');
    }

    public function paginate(int $periodeId, int $perPage = 15): LengthAwarePaginator
    {
        return UserRole::with(['user', 'role', 'assignedByUser'])
            ->where('periode_id', $periodeId)
            ->whereHas('role', fn ($q) => $q->where('nama_role', 'pic'))
            ->orderBy('assigned_at', 'desc')
            ->paginate($perPage);
    }

    public function countPicInPeriode(int $periodeId): int
    {
        return UserRole::where('periode_id', $periodeId)
            ->whereHas('role', fn ($q) => $q->where('nama_role', 'pic'))
            ->count();
    }
}
