<?php

namespace App\Repositories\Eloquent;

use App\Models\Plo;
use App\Repositories\Contracts\PloRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentPloRepository implements PloRepositoryContract
{
    public function findById(int $id): ?Plo
    {
        return Plo::with(['programStudi', 'creator', 'clo'])->withCount('clo')->find($id);
    }

    public function findByProdi(int $prodiId, int $perPage = 15, ?int $mataKuliahId = null, ?int $periodeId = null, ?string $search = null): LengthAwarePaginator
    {
        $query = Plo::with(['programStudi'])
            ->withCount('clo')
            ->where('prodi_id', $prodiId);

        if ($periodeId) {
            $query->where(function ($q) use ($periodeId) {
                $q->where('periode_id', $periodeId)
                  ->orWhereNull('periode_id');
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('kode')->paginate($perPage);
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
