<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Repositories\Contracts\NotifikasiRepositoryContract;

class SendBulkNotificationJob implements ShouldQueue
{
    use Queueable;

    protected array $userIds;
    protected string $judul;
    protected string $pesan;
    protected string $tipe;
    protected ?string $refType;
    protected ?int $refId;

    /**
     * Create a new job instance.
     */
    public function __construct(
        array $userIds,
        string $judul,
        string $pesan,
        string $tipe,
        ?string $refType = null,
        ?int $refId = null
    ) {
        $this->userIds = $userIds;
        $this->judul = $judul;
        $this->pesan = $pesan;
        $this->tipe = $tipe;
        $this->refType = $refType;
        $this->refId = $refId;
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
                'judul' => $this->judul,
                'pesan' => $this->pesan,
                'tipe' => $this->tipe,
                'is_read' => false,
                'reference_type' => $this->refType,
                'reference_id' => $this->refId,
                'created_at' => $now,
            ];
        }

        if (!empty($data)) {
            $notifikasiRepository->insertBulk($data);
        }
    }
}
