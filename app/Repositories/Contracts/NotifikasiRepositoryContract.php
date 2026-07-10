<?php

namespace App\Repositories\Contracts;

use App\Models\Notifikasi;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface NotifikasiRepositoryContract
{
    /** List notifikasi user, dengan filter is_read */
    public function paginateForUser(int $userId, ?bool $isRead, int $perPage = 20): LengthAwarePaginator;

    public function create(array $data): Notifikasi;

    /** Insert bulk notifikasi untuk banyak user sekaligus */
    public function insertBulk(array $notifikasiData): void;

    public function markAsRead(int $notifikasiId, int $userId): bool;

    public function markAllReadByUser(int $userId): int;

    public function countUnreadByUser(int $userId): int;
}
