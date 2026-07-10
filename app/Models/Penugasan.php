<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Penugasan extends Model
{
    protected $table = 'penugasan';

    protected $fillable = [
        'periode_id',
        'verifier_id',
        'target_dosen_id',
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

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    /** Dosen yang ditugaskan sebagai PIC */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verifier_id');
    }

    /** Dosen yang soalnya diverifikasi */
    public function targetDosen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_dosen_id');
    }

    /** Super Admin yang melakukan assignment */
    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
