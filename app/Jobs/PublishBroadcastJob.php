<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Repositories\Contracts\NotifikasiRepositoryContract;
use App\Enums\NotificationType;

class PublishBroadcastJob implements ShouldQueue
{
    use Queueable;

    protected array $userIds;
    protected int $broadcastId;
    protected string $judul;

    /**
     * Create a new job instance.
     */
    public function __construct(array $userIds, int $broadcastId, string $judul)
    {
        $this->userIds = $userIds;
        $this->broadcastId = $broadcastId;
        $this->judul = $judul;
    }

    /**
     * Execute the job.
     */
    public function handle(NotifikasiRepositoryContract $notifikasiRepository): void
    {
        $data = [];
        $now = now();
        foreach ($this->userIds as $userId) {
            $data[] = [
                'user_id' => $userId,
                'judul' => "Pengumuman Baru: " . $this->judul,
                'pesan' => "Ada pengumuman baru yang diterbitkan. Silakan cek menu Broadcast.",
                'tipe' => NotificationType::Broadcast->value,
                'is_read' => false,
                'reference_type' => 'broadcast',
                'reference_id' => $this->broadcastId,
                'created_at' => $now,
            ];
        }

        if (!empty($data)) {
            $notifikasiRepository->insertBulk($data);
        }
    }
}
