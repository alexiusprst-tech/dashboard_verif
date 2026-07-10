<?php

namespace App\Services;

use App\Repositories\Contracts\ActivityLogRepositoryContract;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    protected ActivityLogRepositoryContract $activityLogRepository;
    protected ?Request $request;

    public function __construct(ActivityLogRepositoryContract $activityLogRepository)
    {
        $this->activityLogRepository = $activityLogRepository;
        // Ambil request instance dari container jika dijalankan dalam HTTP context
        $this->request = request();
    }

    public function log(string $aktivitas, string $modul, ?int $userId = null): void
    {
        $userId = $userId ?? Auth::id();
        $ipAddress = $this->request ? $this->request->ip() : null;
        $userAgent = $this->request ? $this->request->header('User-Agent') : null;

        $this->activityLogRepository->log($aktivitas, $modul, $userId, $ipAddress, $userAgent);
    }
}
