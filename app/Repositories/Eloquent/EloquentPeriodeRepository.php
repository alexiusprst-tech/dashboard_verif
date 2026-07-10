<?php

namespace App\Repositories\Eloquent;

use App\Enums\PeriodeStatus;
use App\Models\Periode;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentPeriodeRepository implements PeriodeRepositoryContract
{
    public function findById(int $id): ?Periode
    {
        return Periode::find($id);
    }

    public function findActive(): ?Periode
    {
        return Periode::where('status', PeriodeStatus::Aktif->value)->first();
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Periode::orderByDesc('tanggal_mulai')->paginate($perPage);
    }

    public function create(array $data): Periode
    {
        return Periode::create($data);
    }

    public function update(Periode $periode, array $data): Periode
    {
        $periode->update($data);
        return $periode->fresh();
    }

    public function delete(Periode $periode): bool
    {
        return (bool) $periode->delete();
    }

    public function deactivateAll(): void
    {
        Periode::where('status', PeriodeStatus::Aktif->value)
            ->update(['status' => PeriodeStatus::Selesai->value]);
    }

    public function hasSoal(int $periodeId): bool
    {
        return \App\Models\Soal::where('periode_id', $periodeId)->exists();
    }
}
