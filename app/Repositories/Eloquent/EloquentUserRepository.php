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

    public function paginateDosen(?string $search = null, ?int $prodiId = null, ?string $tipeDosen = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = User::with('prodi')->where('is_super_admin', false);

        if ($search) {
            $lower = strtolower($search);
            $query->where(function ($q) use ($lower) {
                $q->whereRaw('lower(nama_lengkap) like ?', ["%{$lower}%"])
                  ->orWhereRaw('lower(kode_dosen) like ?', ["%{$lower}%"])
                  ->orWhereRaw('lower(email) like ?', ["%{$lower}%"]);
            });
        }

        if ($prodiId) {
            $query->where('prodi_id', $prodiId);
        }

        if ($tipeDosen) {
            $query->where('tipe_dosen', $tipeDosen);
        }

        return $query->orderBy('nama_lengkap')->paginate($perPage);
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    public function delete(User $user): bool
    {
        return (bool) $user->delete();
    }
}
