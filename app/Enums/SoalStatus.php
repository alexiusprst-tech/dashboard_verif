<?php

namespace App\Enums;

enum SoalStatus: string
{
    case Draft     = 'draft';
    case Submitted = 'submitted';
    case InReview  = 'in_review';
    case Revisi    = 'revisi';
    case Approved  = 'approved';
    case Rejected  = 'rejected';

    public function label(): string
    {
        return match($this) {
            self::Draft     => 'Draft',
            self::Submitted => 'Submitted',
            self::InReview  => 'Dalam Review',
            self::Revisi    => 'Perlu Revisi',
            self::Approved  => 'Disetujui',
            self::Rejected  => 'Ditolak',
        };
    }

    /** Status yang membolehkan dosen melakukan edit / upload ulang */
    public function isEditable(): bool
    {
        return in_array($this, [self::Draft, self::Revisi]);
    }

    /** Status final — tidak bisa dikembalikan ke status sebelumnya */
    public function isFinal(): bool
    {
        return $this === self::Approved;
    }
}
