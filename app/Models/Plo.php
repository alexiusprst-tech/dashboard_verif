<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plo extends Model
{
    protected $table = 'plo';

    protected $fillable = [
        'kode',
        'deskripsi',
        'prodi_id',
        'periode_id',
        'created_by',
    ];

    /* ── Relations ──────────────────────────────────────────── */

    public function programStudi(): BelongsTo
    {
        return $this->belongsTo(ProgramStudi::class, 'prodi_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function clo(): HasMany
    {
        return $this->hasMany(Clo::class, 'plo_id');
    }
}
