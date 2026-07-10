<?php

namespace App\Repositories\Contracts;

use App\Models\Clo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface CloRepositoryContract
{
    public function findById(int $id): ?Clo;

    public function findByMataKuliah(int $mataKuliahId): Collection;

    public function findByPlo(int $ploId): Collection;

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Clo;

    public function update(Clo $clo, array $data): Clo;

    public function delete(Clo $clo): bool;

    /** Cek apakah CLO ini masih digunakan oleh Soal manapun */
    public function isUsedBySoal(int $cloId): bool;
}
