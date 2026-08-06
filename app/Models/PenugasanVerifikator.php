<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model PenugasanVerifikator
 *
 * Merepresentasikan penugasan Dosen Verifikator ke Mata Kuliah tertentu
 * dalam sebuah periode verifikasi. Dikelola oleh Super Admin.
 *
 * Relasi:
 * - Satu mata kuliah (course) dapat memiliki banyak verifikator.
 * - Satu dosen dapat menjadi verifikator di banyak mata kuliah.
 *
 * @property int $id
 * @property int $course_id
 * @property int $dosen_id
 * @property int $periode_id
 * @property int $assigned_by
 * @property \Illuminate\Support\Carbon $assigned_at
 */
class PenugasanVerifikator extends Model
{
    protected $table = 'penugasan_verifikator';

    protected $fillable = [
        'course_id',
        'dosen_id',
        'periode_id',
        'assigned_by',
        'assigned_at',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
        ];
    }

    /* ── Relations ──────────────────────────────────────────── */

    /** Mata kuliah yang diverifikasi */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    /** Dosen yang ditugaskan sebagai verifikator */
    public function dosen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dosen_id');
    }

    /** Periode verifikasi berlaku */
    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    /** Super Admin yang melakukan penugasan */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
