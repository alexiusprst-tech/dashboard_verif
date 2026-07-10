<?php

namespace App\Repositories\Eloquent;

use App\Models\Clo;
use App\Repositories\Contracts\CloRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class EloquentCloRepository implements CloRepositoryContract
{
    public function findById(int $id): ?Clo
    {
        return Clo::with(['mataKuliah', 'plo', 'creator'])->find($id);
    }

    public function findByMataKuliah(int $mataKuliahId): Collection
    {
        return Clo::with('plo')
            ->where('mata_kuliah_id', $mataKuliahId)
            ->orderBy('kode')
            ->get();
    }

    public function findByPlo(int $ploId): Collection
    {
        return Clo::where('plo_id', $ploId)->orderBy('kode')->get();
    }

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Clo::with(['mataKuliah', 'plo', 'creator']);

        if (!empty($filters['mata_kuliah_id'])) {
            $query->where('mata_kuliah_id', $filters['mata_kuliah_id']);
        }
        if (!empty($filters['plo_id'])) {
            $query->where('plo_id', $filters['plo_id']);
        }

        return $query->orderBy('kode')->paginate($perPage);
    }

    public function create(array $data): Clo
    {
        return Clo::create($data);
    }

    public function update(Clo $clo, array $data): Clo
    {
        $clo->update($data);
        return $clo->fresh();
    }

    public function delete(Clo $clo): bool
    {
        return (bool) $clo->delete();
    }

    public function isUsedBySoal(int $cloId): bool
    {
        return \App\Models\Soal::where('clo_id', $cloId)->exists();
    }
}
