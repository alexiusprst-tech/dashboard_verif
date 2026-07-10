<?php

namespace App\Enums;

enum PrintType: string
{
    case Ba   = 'ba';
    case Soal = 'soal';
    case Both = 'both';

    public function label(): string
    {
        return match($this) {
            self::Ba   => 'Berita Acara',
            self::Soal => 'Soal',
            self::Both => 'Berita Acara + Soal',
        };
    }
}
