<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * KoordinatorAssignment — Penugasan Koordinator per Semester/Periode.
 *
 * Business Rules:
 * - BR-02: Koordinator dapat berubah setiap semester.
 * - BR-03: Super Admin dapat menunjuk Koordinator.
 * - BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
 */
class KoordinatorAssignment extends Model
{
    protected $table = 'koordinator_assignments';

    protected $fillable = [
        'user_id',
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

    /** Dosen yang ditunjuk sebagai Koordinator */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Periode/semester assignment ini berlaku */
    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    /** Super Admin yang melakukan penugasan */
    public function assignedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
