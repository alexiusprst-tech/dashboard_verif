<?php

namespace App\Repositories\Contracts;

use App\Models\BeritaAcara;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BeritaAcaraRepositoryContract
{
    public function findById(int $id): ?BeritaAcara;

    public function findByVerifierAndPeriode(int $verifierId, int $periodeId): ?BeritaAcara;

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): BeritaAcara;

    public function update(BeritaAcara $ba, array $data): BeritaAcara;

    /**
     * Generate nomor BA otomatis: BA/{kode_periode}/{nomor_urut_3digit}
     * Pastikan nomor unik per periode.
     */
    public function generateNomorBA(int $periodeId): string;

    /** Hapus semua snapshot items dari BA ini (untuk regenerate) */
    public function deleteItems(int $beritaAcaraId): void;

    /** Insert snapshot items secara bulk */
    public function insertItems(array $items): void;
}
