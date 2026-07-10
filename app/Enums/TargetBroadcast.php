<?php

namespace App\Enums;

enum TargetBroadcast: string
{
    case Semua          = 'semua';
    case ProdiTertentu  = 'prodi_tertentu';

    public function label(): string
    {
        return match($this) {
            self::Semua         => 'Semua Dosen',
            self::ProdiTertentu => 'Program Studi Tertentu',
        };
    }
}
