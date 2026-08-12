<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Semester Model
 *
 * Represents an academic semester/period.
 * Source: tech-spec.md Section 2.3, AGENTS.md Section 8
 *
 * BR-02: Koordinator dapat berubah setiap semester.
 * BR-08: Pilihan periode soal mengikuti periode waktu yang sedang berjalan.
 */
class Semester extends Model
{
    protected $fillable = [
        'nama',
        'tahun_ajaran',
        'periode',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
