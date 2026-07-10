<?php

namespace App\Repositories\Contracts;

use App\Enums\SoalStatus;
use App\Models\Soal;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface SoalRepositoryContract
{
    public function findById(int $id): ?Soal;

    public function findByUuid(string $uuid): ?Soal;

    /**
     * List soal dengan filter kombinasi.
     * @param array{periode_id?: int, status?: string, dosen_id?: int, mata_kuliah_id?: int} $filters
     */
    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Soal;

    public function update(Soal $soal, array $data): Soal;

    public function softDelete(Soal $soal): bool;

    /** Ambil versi terakhir soal milik dosen dalam periode */
    public function getLatestVersi(int $dosenId, int $periodeId, int $mataKuliahId): int;

    /** Hitung jumlah soal per status untuk keperluan dashboard */
    public function countByStatus(array $filters = []): array;

    /**
     * Soal yang perlu diverifikasi oleh PIC tertentu.
     * Diambil berdasarkan assignment di tabel penugasan.
     */
    public function findForVerifier(int $verifierId, int $periodeId, int $perPage = 15): LengthAwarePaginator;
}
