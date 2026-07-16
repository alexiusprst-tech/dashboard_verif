<?php

namespace App\Repositories\Eloquent;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class EloquentUserRepository implements UserRepositoryContract
{
    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function searchByKodeOrNama(string $query, int $perPage = 15): LengthAwarePaginator
    {
        $lowerQuery = strtolower($query);
        return User::where(function ($q) use ($lowerQuery) {
                $q->whereRaw('lower(kode_dosen) like ?', ["%{$lowerQuery}%"])
                  ->orWhereRaw('lower(nama_lengkap) like ?', ["%{$lowerQuery}%"]);
            })
            ->where('status_aktif', true)
            ->where('is_super_admin', false)
            ->orderBy('nama_lengkap')
            ->paginate($perPage);
    }

    public function findByProdi(int $prodiId): Collection
    {
        return User::where('prodi_id', $prodiId)
            ->where('status_aktif', true)
            ->orderBy('nama_lengkap')
            ->get();
    }

    public function findAllActiveDosen(): Collection
    {
        return User::where('status_aktif', true)
            ->where('is_super_admin', false)
            ->orderBy('nama_lengkap')
            ->get();
    }

    public function updateLastLogin(int $userId): void
    {
        User::where('id', $userId)->update(['last_login_at' => now()]);
    }
}
