<?php

namespace App\Repositories\Eloquent;

use App\Models\KoordinatorAssignment;
use App\Repositories\Contracts\KoordinatorAssignmentRepositoryContract;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentKoordinatorAssignmentRepository implements KoordinatorAssignmentRepositoryContract
{
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = KoordinatorAssignment::with(['user.prodi', 'periode', 'assignedByUser']);

        if (!empty($filters['periode_id'])) {
            $query->where('periode_id', $filters['periode_id']);
        }

        return $query->orderByDesc('assigned_at')->paginate($perPage);
    }

    public function findById(int $id): ?KoordinatorAssignment
    {
        return KoordinatorAssignment::with(['user.prodi', 'periode', 'assignedByUser'])->find($id);
    }

    public function isKoordinatorPadaPeriode(int $userId, int $periodeId): bool
    {
        return KoordinatorAssignment::where('user_id', $userId)
            ->where('periode_id', $periodeId)
            ->exists();
    }

    public function findByUserAndPeriode(int $userId, int $periodeId): ?KoordinatorAssignment
    {
        return KoordinatorAssignment::where('user_id', $userId)
            ->where('periode_id', $periodeId)
            ->first();
    }

    public function create(array $data): KoordinatorAssignment
    {
        return KoordinatorAssignment::create($data);
    }

    public function update(KoordinatorAssignment $assignment, array $data): KoordinatorAssignment
    {
        $assignment->update($data);
        return $assignment->refresh();
    }

    public function delete(KoordinatorAssignment $assignment): void
    {
        $assignment->delete();
    }

    public function findByPeriode(int $periodeId): Collection
    {
        return KoordinatorAssignment::with(['user.prodi'])
            ->where('periode_id', $periodeId)
            ->orderBy('assigned_at')
            ->get();
    }
}
