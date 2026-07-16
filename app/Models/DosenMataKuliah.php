<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DosenMataKuliah extends Model
{
    protected $table = 'dosen_mata_kuliah';

    protected $fillable = [
        'dosen_id',
        'mata_kuliah_id',
        'periode_id',
        'created_by',
    ];

    /* ── Relations ───────────────────────────────────────────── */

    public function dosen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dosen_id');
    }

    public function mataKuliah(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'mata_kuliah_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    /** Super Admin yang membuat pemetaan */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
