<?php

namespace App\Repositories\Eloquent;

use App\Models\Notifikasi;
use App\Repositories\Contracts\NotifikasiRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EloquentNotifikasiRepository implements NotifikasiRepositoryContract
{
    public function paginateForUser(int $userId, ?bool $isRead, int $perPage = 20): LengthAwarePaginator
    {
        $query = Notifikasi::where('user_id', $userId);

        if ($isRead !== null) {
            $query->where('is_read', $isRead);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function create(array $data): Notifikasi
    {
        return Notifikasi::create($data);
    }

    public function insertBulk(array $notifikasiData): void
    {
        collect($notifikasiData)->chunk(500)->each(function ($chunk) {
            DB::table('notifikasi')->insert($chunk->toArray());
        });
    }

    public function markAsRead(int $notifikasiId, int $userId): bool
    {
        return (bool) Notifikasi::where('id', $notifikasiId)
            ->where('user_id', $userId)
            ->update(['is_read' => true]);
    }

    public function markAllReadByUser(int $userId): int
    {
        return Notifikasi::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    public function countUnreadByUser(int $userId): int
    {
        return Notifikasi::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }
}
