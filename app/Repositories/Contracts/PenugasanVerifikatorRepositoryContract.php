<?php

namespace App\Repositories\Contracts;

use App\Models\PenugasanVerifikator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface PenugasanVerifikatorRepositoryContract
{
    /**
     * Assign dosen verifikator ke mata kuliah pada periode tertentu.
     */
    public function assignVerifikator(int $courseId, int $dosenId, int $periodeId, int $assignedBy): PenugasanVerifikator;

    /**
     * Cabut assignment verifikator.
     */
    public function revokeVerifikator(PenugasanVerifikator $penugasan): bool;

    /**
     * Cari penugasan verifikator berdasarkan ID.
     */
    public function findById(int $id): ?PenugasanVerifikator;

    /**
     * List penugasan verifikator per periode (paginated/filtered).
     */
    public function paginate(int $periodeId, int|array|null $courseId = null, ?string $search = null, int $perPage = 15): LengthAwarePaginator;

    /**
     * Ambil daftar verifikator untuk mata kuliah tertentu pada periode tertentu.
     */
    public function findByCourseAndPeriode(int $courseId, int $periodeId): Collection;

    /**
     * Ambil mata kuliah yang ditugaskan ke verifikator tertentu pada periode tertentu.
     */
    public function findByDosenAndPeriode(int $dosenId, int $periodeId): Collection;
}
