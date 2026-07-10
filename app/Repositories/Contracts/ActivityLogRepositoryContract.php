<?php

namespace App\Repositories\Contracts;

interface ActivityLogRepositoryContract
{
    public function log(
        string $aktivitas,
        string $modul,
        ?int $userId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void;
}
