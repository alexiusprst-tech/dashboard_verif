<?php

namespace App\Services;

use App\Repositories\Contracts\NotifikasiRepositoryContract;
use App\Enums\NotificationType;
use App\Models\Notifikasi;
use Illuminate\Support\Collection;
use App\Jobs\SendBulkNotificationJob;

class NotifikasiService
{
    protected NotifikasiRepositoryContract $notifikasiRepository;

    public function __construct(NotifikasiRepositoryContract $notifikasiRepository)
    {
        $this->notifikasiRepository = $notifikasiRepository;
    }

    public function kirim(
        int $userId,
        string $judul,
        string $pesan,
        NotificationType $tipe,
        ?string $refType = null,
        ?int $refId = null
    ): Notifikasi {
        return $this->notifikasiRepository->create([
            'user_id' => $userId,
            'judul' => $judul,
            'pesan' => $pesan,
            'tipe' => $tipe->value,
            'is_read' => false,
            'reference_type' => $refType,
            'reference_id' => $refId,
        ]);
    }

    public function kirimBulk(
        array|Collection $userIds,
        string $judul,
        string $pesan,
        NotificationType $tipe,
        ?string $refType = null,
        ?int $refId = null
    ): void {
        $ids = is_array($userIds) ? $userIds : $userIds->toArray();
        
        if (count($ids) > 20) {
            // Dispatch ke Job jika jumlah user besar agar tidak memblokir request
            SendBulkNotificationJob::dispatch($ids, $judul, $pesan, $tipe->value, $refType, $refId);
        } else {
            $data = [];
            $now = now();
            foreach ($ids as $userId) {
                $data[] = [
                    'user_id' => $userId,
                    'judul' => $judul,
                    'pesan' => $pesan,
                    'tipe' => $tipe->value,
                    'is_read' => false,
                    'reference_type' => $refType,
                    'reference_id' => $refId,
                    'created_at' => $now,
                ];
            }
            if (!empty($data)) {
                $this->notifikasiRepository->insertBulk($data);
            }
        }
    }
}
