<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model PenugasanKoordinator
 *
 * Merepresentasikan penugasan Dosen Koordinator ke Mata Kuliah tertentu
 * dalam sebuah periode akademik. Dikelola oleh Super Admin.
 *
 * @property int $id
 * @property int $course_id
 * @property int $dosen_id
 * @property int $periode_id
 * @property int $assigned_by
 * @property \Illuminate\Support\Carbon $assigned_at
 */
class PenugasanKoordinator extends Model
{
    protected $table = 'penugasan_koordinator';

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

    /** Mata kuliah yang dikoordinasikan */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    /** Dosen yang ditugaskan sebagai Koordinator MK */
    public function dosen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dosen_id');
    }

    /** Periode akademik berlaku */
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
