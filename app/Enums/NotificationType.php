<?php

namespace App\Enums;

enum NotificationType: string
{
    case Info        = 'info';
    case Warning     = 'warning';
    case Deadline    = 'deadline';
    case Verifikasi  = 'verifikasi';
    case Broadcast   = 'broadcast';

    public function label(): string
    {
        return match($this) {
            self::Info       => 'Informasi',
            self::Warning    => 'Peringatan',
            self::Deadline   => 'Deadline',
            self::Verifikasi => 'Verifikasi',
            self::Broadcast  => 'Pengumuman',
        };
    }
}
