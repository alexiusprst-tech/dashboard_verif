<?php

namespace App\Enums;

enum VerifikasiStatus: string
{
    case Approved = 'approved';
    case Revisi   = 'revisi';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match($this) {
            self::Approved => 'Disetujui',
            self::Revisi   => 'Perlu Revisi',
            self::Rejected => 'Ditolak',
        };
    }

    /** Konversi ke SoalStatus yang sesuai setelah verifikasi */
    public function toSoalStatus(): SoalStatus
    {
        return match($this) {
            self::Approved => SoalStatus::Approved,
            self::Revisi   => SoalStatus::Revisi,
            self::Rejected => SoalStatus::Rejected,
        };
    }
}
