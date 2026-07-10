<?php

namespace App\Repositories\Contracts;

use App\Models\Penugasan;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface PenugasanRepositoryContract
{
    public function findById(int $id): ?Penugasan;

    public function paginate(int $periodeId, int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Penugasan;

    public function delete(Penugasan $penugasan): bool;

    /** Semua assignment di mana user adalah verifier untuk periode ini */
    public function findByVerifierAndPeriode(int $verifierId, int $periodeId): Collection;

    /** Assignment di mana dosen ini adalah target (soalnya diverifikasi) */
    public function findByTargetAndPeriode(int $targetDosenId, int $periodeId): ?Penugasan;

    /** Jumlah dosen unik yang ditunjuk sebagai verifier dalam satu periode */
    public function countUniqueVerifierInPeriode(int $periodeId): int;

    /** Cek apakah target_dosen sudah diassign ke verifier LAIN dalam periode yang sama */
    public function isTargetAssignedToOtherVerifier(int $targetDosenId, int $periodeId, int $excludeVerifierId): bool;

    /** Cek apakah user adalah PIC aktif (ada di penugasan di periode aktif) */
    public function isActivePic(int $userId, int $periodeId): bool;

    /** Semua periode di mana user adalah PIC aktif */
    public function getActivePicPeriodes(int $userId): Collection;
}
