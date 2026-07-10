<?php

namespace App\Repositories\Eloquent;

use App\Models\Broadcast;
use App\Repositories\Contracts\BroadcastRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentBroadcastRepository implements BroadcastRepositoryContract
{
    public function findById(int $id): ?Broadcast
    {
        return Broadcast::with(['creator', 'programStudi', 'periode'])->find($id);
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Broadcast::with(['creator', 'programStudi', 'periode'])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function paginateFeedForUser(int $userId, ?int $prodiId, int $perPage = 15): LengthAwarePaginator
    {
        $user = \App\Models\User::find($userId);

        return Broadcast::published()
            ->where(function ($q) use ($user) {
                $q->where('target', 'semua')
                  ->orWhere(function ($q2) use ($user) {
                      $q2->where('target', 'prodi_tertentu')
                         ->where('prodi_id', $user?->prodi_id);
                  });
            })
            ->with(['creator', 'programStudi'])
            ->orderByDesc('published_at')
            ->paginate($perPage);
    }

    public function create(array $data): Broadcast
    {
        return Broadcast::create($data);
    }

    public function publish(Broadcast $broadcast): Broadcast
    {
        $broadcast->update(['published_at' => now()]);
        return $broadcast->fresh();
    }
}
