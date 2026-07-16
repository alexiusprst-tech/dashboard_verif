<?php

namespace App\Repositories\Eloquent;

use App\Models\DosenMataKuliah;
use App\Repositories\Contracts\DosenMataKuliahRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentDosenMataKuliahRepository implements DosenMataKuliahRepositoryContract
{
    public function findByDosenAndPeriode(int $dosenId, int $periodeId): Collection
    {
        return DosenMataKuliah::with(['mataKuliah'])
            ->where('dosen_id', $dosenId)
            ->where('periode_id', $periodeId)
            ->get();
    }

    public function isDosenAmpu(int $dosenId, int $mataKuliahId, int $periodeId): bool
    {
        return DosenMataKuliah::where('dosen_id', $dosenId)
            ->where('mata_kuliah_id', $mataKuliahId)
            ->where('periode_id', $periodeId)
            ->exists();
    }

    public function create(array $data): DosenMataKuliah
    {
        return DosenMataKuliah::create($data);
    }

    public function delete(DosenMataKuliah $dosenMataKuliah): bool
    {
        return (bool) $dosenMataKuliah->delete();
    }

    public function paginate(int $periodeId, ?int $dosenId = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = DosenMataKuliah::with(['dosen', 'mataKuliah', 'createdByUser'])
            ->where('periode_id', $periodeId);

        if ($dosenId !== null) {
            $query->where('dosen_id', $dosenId);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }
}
