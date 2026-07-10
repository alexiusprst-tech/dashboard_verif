<?php

namespace App\Repositories\Eloquent;

use App\Models\ActivityLog;
use App\Repositories\Contracts\ActivityLogRepositoryContract;

class EloquentActivityLogRepository implements ActivityLogRepositoryContract
{
    public function log(
        string $aktivitas,
        string $modul,
        ?int $userId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        ActivityLog::create([
            'user_id'    => $userId,
            'aktivitas'  => $aktivitas,
            'modul'      => $modul,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);
    }
}
