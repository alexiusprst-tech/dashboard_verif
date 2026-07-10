<?php

namespace App\Repositories\Eloquent;

use App\Models\Plo;
use App\Repositories\Contracts\PloRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentPloRepository implements PloRepositoryContract
{
    public function findById(int $id): ?Plo
    {
        return Plo::with(['programStudi', 'creator'])->find($id);
    }

    public function findByProdi(int $prodiId, int $perPage = 15): LengthAwarePaginator
    {
        return Plo::with('programStudi')
            ->where('prodi_id', $prodiId)
            ->orderBy('kode')
            ->paginate($perPage);
    }

    public function create(array $data): Plo
    {
        return Plo::create($data);
    }

    public function update(Plo $plo, array $data): Plo
    {
        $plo->update($data);
        return $plo->fresh();
    }

    public function delete(Plo $plo): bool
    {
        return (bool) $plo->delete();
    }

    public function isUsedByClo(int $ploId): bool
    {
        return \App\Models\Clo::where('plo_id', $ploId)->exists();
    }
}
