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
        return Clo::with(['plo', 'courses', 'creator'])->find($id);
    }

    public function findByMataKuliah(int $mataKuliahId): Collection
    {
        return Clo::with('plo')
            ->whereHas('courses', function ($q) use ($mataKuliahId) {
                $q->where('courses.id', $mataKuliahId);
            })
            ->orderBy('kode')
            ->get();
    }

    public function findByPlo(int $ploId): Collection
    {
        return Clo::with(['plo', 'courses'])->where('plo_id', $ploId)->orderBy('kode')->get();
    }

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Clo::with(['plo', 'courses', 'creator']);

        if (!empty($filters['mata_kuliah_id'])) {
            $query->whereHas('courses', function ($q) use ($filters) {
                $q->where('courses.id', $filters['mata_kuliah_id']);
            });
        }
        if (!empty($filters['plo_id'])) {
            $query->where('plo_id', $filters['plo_id']);
        }
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('kode', 'like', "%{$search}%")
                  ->orWhere('deskripsi', 'like', "%{$search}%");
            });
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
