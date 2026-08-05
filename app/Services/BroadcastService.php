<?php

namespace App\Services;

use App\Repositories\Contracts\BroadcastRepositoryContract;
use App\Repositories\Contracts\UserRepositoryContract;
use App\Models\Broadcast;
use App\Models\User;
use App\Enums\TargetBroadcast;
use App\Exceptions\BusinessException;
use App\Jobs\PublishBroadcastJob;

class BroadcastService
{
    protected BroadcastRepositoryContract $broadcastRepository;
    protected UserRepositoryContract $userRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        BroadcastRepositoryContract $broadcastRepository,
        UserRepositoryContract $userRepository,
        ActivityLogService $activityLogService
    ) {
        $this->broadcastRepository = $broadcastRepository;
        $this->userRepository = $userRepository;
        $this->activityLogService = $activityLogService;
    }

    public function create(array $data, User $user): Broadcast
    {
        $data['created_by'] = $user->id;
        $data['published_at'] = now(); // Langsung terbitkan saat dibuat agar semua akun dapat langsung melihat

        $broadcast = $this->broadcastRepository->create($data);

        // Ambil target user IDs
        $targetUserIds = [];
        $targetEnum = $broadcast->target instanceof TargetBroadcast 
            ? $broadcast->target 
            : TargetBroadcast::tryFrom($broadcast->target);

        if ($targetEnum === TargetBroadcast::Semua || $broadcast->target === 'semua') {
            $targetUserIds = $this->userRepository->findAllActiveDosen()->pluck('id')->toArray();
        } else {
            $targetUserIds = $this->userRepository->findByProdi($broadcast->prodi_id)->pluck('id')->toArray();
        }

        // Dispatch Job untuk insert bulk notifikasi
        PublishBroadcastJob::dispatch($targetUserIds, $broadcast->id, $broadcast->judul);

        $this->activityLogService->log("Membuat dan mempublikasikan broadcast baru: {$broadcast->judul}", 'Broadcast', $user->id);

        return $broadcast;
    }

    public function publish(int $id, User $user): Broadcast
    {
        $broadcast = $this->broadcastRepository->findById($id);
        if (!$broadcast) {
            throw new BusinessException('Broadcast tidak ditemukan.', 404);
        }

        if ($broadcast->isPublished()) {
            throw new BusinessException('Broadcast ini sudah dipublikasikan sebelumnya.', 422);
        }

        // Set published_at
        $broadcast = $this->broadcastRepository->publish($broadcast);

        // Ambil target user IDs
        $targetUserIds = [];
        if ($broadcast->target === TargetBroadcast::Semua) {
            $targetUserIds = $this->userRepository->findAllActiveDosen()->pluck('id')->toArray();
        } else {
            $targetUserIds = $this->userRepository->findByProdi($broadcast->prodi_id)->pluck('id')->toArray();
        }

        // Dispatch Job untuk insert bulk notifikasi
        PublishBroadcastJob::dispatch($targetUserIds, $broadcast->id, $broadcast->judul);

        $this->activityLogService->log("Mempublikasikan broadcast: {$broadcast->judul}", 'Broadcast', $user->id);

        return $broadcast;
    }
}
