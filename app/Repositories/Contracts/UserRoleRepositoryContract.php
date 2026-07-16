<?php

namespace App\Repositories\Contracts;

use App\Models\UserRole;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface UserRoleRepositoryContract
{
    /**
     * Assign role PIC ke dosen untuk periode tertentu.
     * Mengembalikan UserRole yang baru dibuat.
     */
    public function assignPic(int $userId, int $periodeId, int $assignedBy): UserRole;

    /**
     * Cabut assignment PIC berdasarkan ID user_roles.
     */
    public function revokePic(UserRole $userRole): bool;

    /**
     * Cari user_role by ID.
     */
    public function findById(int $id): ?UserRole;

    /**
     * Cek apakah user adalah PIC aktif di suatu periode.
     * Query ke tabel user_roles JOIN roles WHERE nama_role='pic'.
     */
    public function isActivePic(int $userId, int $periodeId): bool;

    /**
     * Ambil semua periode_id di mana user berperan sebagai PIC.
     * Digunakan di GET /api/auth/me untuk render sidebar.
     */
    public function getActivePicPeriodes(int $userId): Collection;

    /**
     * List semua PIC yang ditugaskan di periode ini (paginated).
     */
    public function paginate(int $periodeId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Hitung jumlah PIC unik di suatu periode.
     */
    public function countPicInPeriode(int $periodeId): int;
}
