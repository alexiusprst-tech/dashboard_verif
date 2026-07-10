<?php

namespace App\Enums;

enum TipeVerifikator: string
{
    case Pic         = 'pic';
    case Coordinator = 'coordinator';

    public function label(): string
    {
        return match($this) {
            self::Pic         => 'PIC',
            self::Coordinator => 'Koordinator',
        };
    }
}
