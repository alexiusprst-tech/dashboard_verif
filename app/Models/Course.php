<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $table = 'courses';

    protected $fillable = [
        'kode_mk',
        'nama_mk',
        'prodi_id',
    ];

    /* ── Relations ──────────────────────────────────────────── */

    public function programStudi(): BelongsTo
    {
        return $this->belongsTo(ProgramStudi::class, 'prodi_id');
    }

    public function plo(): HasMany
    {
        return $this->hasMany(Plo::class, 'mata_kuliah_id');
    }

    public function clo(): HasMany
    {
        return $this->hasMany(Clo::class, 'mata_kuliah_id');
    }

    public function soal(): HasMany
    {
        return $this->hasMany(Soal::class, 'mata_kuliah_id');
    }
}
