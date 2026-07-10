<?php

namespace App\Repositories\Contracts;

use App\Models\Broadcast;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface BroadcastRepositoryContract
{
    public function findById(int $id): ?Broadcast;

    public function paginate(int $perPage = 15): LengthAwarePaginator;

    /** Feed untuk user — filter berdasarkan target & prodi_id */
    public function paginateFeedForUser(int $userId, ?int $prodiId, int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Broadcast;

    public function publish(Broadcast $broadcast): Broadcast;
}
