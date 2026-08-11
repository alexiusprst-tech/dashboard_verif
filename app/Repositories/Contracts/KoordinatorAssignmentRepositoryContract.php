<?php

namespace App\Repositories\Contracts;

use App\Models\KoordinatorAssignment;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface KoordinatorAssignmentRepositoryContract
{
    /**
     * Ambil semua assignment Koordinator, opsional filter per periode.
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Cari assignment berdasarkan ID.
     */
    public function findById(int $id): ?KoordinatorAssignment;

    /**
     * Cek apakah user adalah Koordinator pada periode tertentu.
     */
    public function isKoordinatorPadaPeriode(int $userId, int $periodeId): bool;

    /**
     * Cari assignment Koordinator berdasarkan user_id dan periode_id.
     */
    public function findByUserAndPeriode(int $userId, int $periodeId): ?KoordinatorAssignment;

    /**
     * Buat assignment Koordinator baru.
     */
    public function create(array $data): KoordinatorAssignment;

    /**
     * Update assignment Koordinator.
     */
    public function update(KoordinatorAssignment $assignment, array $data): KoordinatorAssignment;

    /**
     * Hapus assignment Koordinator.
     */
    public function delete(KoordinatorAssignment $assignment): void;

    /**
     * Ambil semua Koordinator pada periode tertentu.
     */
    public function findByPeriode(int $periodeId): Collection;
}
