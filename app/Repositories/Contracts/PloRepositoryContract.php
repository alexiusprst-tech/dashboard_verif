<?php

namespace App\Repositories\Contracts;

use App\Models\Plo;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PloRepositoryContract
{
    public function findById(int $id): ?Plo;

    public function findByProdi(int $prodiId, int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Plo;

    public function update(Plo $plo, array $data): Plo;

    public function delete(Plo $plo): bool;

    /** Cek apakah PLO ini masih digunakan oleh CLO manapun */
    public function isUsedByClo(int $ploId): bool;
}
