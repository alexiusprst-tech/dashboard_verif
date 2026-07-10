<?php

namespace App\Repositories\Contracts;

use App\Models\Periode;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PeriodeRepositoryContract
{
    public function findById(int $id): ?Periode;

    public function findActive(): ?Periode;

    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Periode;

    public function update(Periode $periode, array $data): Periode;

    public function delete(Periode $periode): bool;

    /** Set semua periode aktif menjadi 'selesai' (sebelum aktivasi periode baru) */
    public function deactivateAll(): void;

    /** Cek apakah periode ini memiliki soal terkait (untuk guard sebelum hapus) */
    public function hasSoal(int $periodeId): bool;
}
