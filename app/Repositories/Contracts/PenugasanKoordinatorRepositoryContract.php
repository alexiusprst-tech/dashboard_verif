<?php

namespace App\Repositories\Contracts;

use App\Models\PenugasanKoordinator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface PenugasanKoordinatorRepositoryContract
{
    /**
     * Assign Dosen Koordinator ke Mata Kuliah pada periode tertentu.
     */
    public function assignKoordinator(int $courseId, int $dosenId, int $periodeId, int $assignedBy): PenugasanKoordinator;

    /**
     * Cabut penugasan koordinator.
     */
    public function revokeKoordinator(PenugasanKoordinator $penugasan): bool;

    /**
     * Cari penugasan koordinator berdasarkan ID.
     */
    public function findById(int $id): ?PenugasanKoordinator;

    /**
     * Paginate penugasan koordinator per periode dan opsi filter course.
     */
    public function paginate(int $periodeId, ?int $courseId = null, ?string $search = null, int $perPage = 15): LengthAwarePaginator;

    /**
     * Ambil penugasan koordinator per mata kuliah dan periode.
     */
    public function findByCourseAndPeriode(int $courseId, int $periodeId): Collection;

    /**
     * Ambil penugasan koordinator per dosen dan periode.
     */
    public function findByDosenAndPeriode(int $dosenId, int $periodeId): Collection;

    /**
     * Cek apakah dosen masih memiliki penugasan koordinator lain.
     */
    public function countActiveAssignmentsByDosen(int $dosenId): int;
}
