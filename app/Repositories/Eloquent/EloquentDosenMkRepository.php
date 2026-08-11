<?php

namespace App\Repositories\Eloquent;

use App\Models\DosenMk;
use App\Repositories\Contracts\DosenMkRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentDosenMkRepository implements DosenMkRepositoryContract
{
    public function findByDosenAndPeriode(int $dosenId, int $periodeId): Collection
    {
        return DosenMk::with(['mataKuliah'])
            ->where('dosen_id', $dosenId)
            ->where('periode_id', $periodeId)
            ->get();
    }

    public function isDosenAmpu(int $dosenId, int $mataKuliahId, int $periodeId): bool
    {
        return DosenMk::where('dosen_id', $dosenId)
            ->where('mata_kuliah_id', $mataKuliahId)
            ->where('periode_id', $periodeId)
            ->exists();
    }

    public function create(array $data): DosenMk
    {
        return DosenMk::create($data);
    }

    public function delete(DosenMk $DosenMk): bool
    {
        return (bool) $DosenMk->delete();
    }

    public function paginate(int $periodeId, ?int $dosenId = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = DosenMk::with(['dosen', 'mataKuliah', 'createdByUser'])
            ->where('periode_id', $periodeId);

        if ($dosenId !== null) {
            $query->where('dosen_id', $dosenId);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }
}
