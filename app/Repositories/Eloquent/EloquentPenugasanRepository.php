<?php

namespace App\Repositories\Eloquent;

use App\Models\Penugasan;
use App\Enums\PeriodeStatus;
use App\Repositories\Contracts\PenugasanRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentPenugasanRepository implements PenugasanRepositoryContract
{
    public function findById(int $id): ?Penugasan
    {
        return Penugasan::with(['periode', 'verifier', 'targetDosen', 'assignedBy'])->find($id);
    }

    public function paginate(int $periodeId, int $perPage = 15): LengthAwarePaginator
    {
        return Penugasan::with(['verifier', 'targetDosen', 'assignedBy'])
            ->where('periode_id', $periodeId)
            ->orderBy('verifier_id')
            ->paginate($perPage);
    }

    public function create(array $data): Penugasan
    {
        return Penugasan::create($data);
    }

    public function delete(Penugasan $penugasan): bool
    {
        return (bool) $penugasan->delete();
    }

    public function findByVerifierAndPeriode(int $verifierId, int $periodeId): Collection
    {
        return Penugasan::with('targetDosen')
            ->where('verifier_id', $verifierId)
            ->where('periode_id', $periodeId)
            ->get();
    }

    public function findByTargetAndPeriode(int $targetDosenId, int $periodeId): ?Penugasan
    {
        return Penugasan::where('target_dosen_id', $targetDosenId)
            ->where('periode_id', $periodeId)
            ->first();
    }

    public function countUniqueVerifierInPeriode(int $periodeId): int
    {
        return Penugasan::where('periode_id', $periodeId)
            ->distinct('verifier_id')
            ->count('verifier_id');
    }

    public function isTargetAssignedToOtherVerifier(
        int $targetDosenId,
        int $periodeId,
        int $excludeVerifierId
    ): bool {
        return Penugasan::where('target_dosen_id', $targetDosenId)
            ->where('periode_id', $periodeId)
            ->where('verifier_id', '!=', $excludeVerifierId)
            ->exists();
    }

    public function isActivePic(int $userId, int $periodeId): bool
    {
        return Penugasan::where('verifier_id', $userId)
            ->where('periode_id', $periodeId)
            ->whereHas('periode', fn($q) => $q->where('status', PeriodeStatus::Aktif->value))
            ->exists();
    }

    public function getActivePicPeriodes(int $userId): Collection
    {
        return Penugasan::with('periode')
            ->where('verifier_id', $userId)
            ->whereHas('periode', fn($q) => $q->where('status', PeriodeStatus::Aktif->value))
            ->get()
            ->pluck('periode')
            ->unique('id')
            ->values();
    }
}
