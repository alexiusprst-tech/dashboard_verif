<?php

namespace App\Repositories\Contracts;

interface DashboardRepositoryContract
{
    /**
     * Hitung soal per status untuk periode tertentu.
     * Returns: ['draft' => n, 'submitted' => n, 'approved' => n, ...]
     */
    public function countSoalByStatus(int $periodeId, ?int $dosenId = null): array;

    /**
     * Progress verifikasi per periode.
     * Returns: ['total' => n, 'verified' => n, 'percentage' => float]
     */
    public function progressByPeriode(int $periodeId): array;

    /**
     * Progress verifikasi per prodi (untuk Coordinator dashboard).
     * Returns: [['prodi' => '...', 'total' => n, 'approved' => n, 'percentage' => float], ...]
     */
    public function progressByProdi(int $periodeId): array;

    /**
     * Summary untuk PIC: soal dalam tanggung jawab PIC di periode aktif.
     * Returns: ['total' => n, 'pending' => n, 'done' => n]
     */
    public function picSummary(int $verifierId, int $periodeId): array;

    /** Deadline terdekat untuk dosen tertentu */
    public function nearestDeadline(int $dosenId): ?array;
}
