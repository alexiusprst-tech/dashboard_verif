<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Clo extends Model
{
    protected $table = 'clo';

    protected $fillable = [
        'kode',
        'deskripsi',
        'mata_kuliah_id',
        'plo_id',
        'created_by',
    ];

    /* ── Relations ──────────────────────────────────────────── */

    public function mataKuliah(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'mata_kuliah_id');
    }

    public function plo(): BelongsTo
    {
        return $this->belongsTo(Plo::class, 'plo_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function soal(): HasMany
    {
        return $this->hasMany(Soal::class, 'clo_id');
    }
}
