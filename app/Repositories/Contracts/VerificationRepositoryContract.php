<?php

namespace App\Repositories\Contracts;

use App\Models\Verification;
use Illuminate\Database\Eloquent\Collection;

interface VerificationRepositoryContract
{
    public function findById(int $id): ?Verification;

    public function create(array $data): Verification;

    /** Verifikasi terbaru (PIC) untuk soal tertentu */
    public function findLatestBySoal(int $soalId): ?Verification;

    /** Semua riwayat verifikasi untuk satu soal */
    public function findAllBySoal(int $soalId): Collection;

    /** Verifikasi yang dibuat oleh verifier tertentu untuk soal ini */
    public function findBySoalAndVerifier(int $soalId, int $verifierId): ?Verification;

    /**
     * Semua verifikasi approved dalam tanggung jawab satu PIC di satu periode.
     * Dipakai saat generate Berita Acara.
     */
    public function findApprovedForPicInPeriode(int $verifierId, int $periodeId): Collection;
}
