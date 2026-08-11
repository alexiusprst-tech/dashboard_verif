<?php

namespace App\Enums;

enum TipeVerifikator: string
{
    case Verifikator = 'pic'; // Tetap 'pic' untuk backward compatibility db
    case Coordinator = 'coordinator';

    public function label(): string
    {
        return match($this) {
            self::Verifikator => 'Verifikator',
            self::Coordinator => 'Koordinator',
        };
    }
}
