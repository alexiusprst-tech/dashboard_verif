<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryContract
{
    public function findById(int $id): ?User;

    public function findByEmail(string $email): ?User;

    /** Cari dosen by kode_dosen atau nama_lengkap (for combobox assignment PIC) */
    public function searchByKodeOrNama(string $query, int $perPage = 15): LengthAwarePaginator;

    /** Semua dosen dalam satu prodi */
    public function findByProdi(int $prodiId): Collection;

    /** Semua dosen aktif (untuk blast notifikasi) */
    public function findAllActiveDosen(): Collection;

    public function updateLastLogin(int $userId): void;
}
