<?php

namespace App\Repositories\Contracts;

use App\Models\DosenMataKuliah;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface DosenMataKuliahRepositoryContract
{
    /**
     * Ambil semua pemetaan matkul untuk dosen di periode tertentu.
     */
    public function findByDosenAndPeriode(int $dosenId, int $periodeId): Collection;

    /**
     * Cek apakah dosen mengampu mata kuliah ini di periode tertentu.
     */
    public function isDosenAmpu(int $dosenId, int $mataKuliahId, int $periodeId): bool;

    /**
     * Buat pemetaan baru.
     */
    public function create(array $data): DosenMataKuliah;

    /**
     * Hapus pemetaan.
     */
    public function delete(DosenMataKuliah $dosenMataKuliah): bool;

    /**
     * List pemetaan per periode (paginated), opsional filter per dosen.
     */
    public function paginate(int $periodeId, ?int $dosenId = null, int $perPage = 15): LengthAwarePaginator;
}
