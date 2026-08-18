<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $table = 'courses';

    protected $fillable = [
        'kode_mk',
        'nama_mk',
        'prodi_id',
        'sks',
        'semester',
        'kategori',
    ];

    /* ── Relations ──────────────────────────────────────────── */

    public function programStudi(): BelongsTo
    {
        return $this->belongsTo(ProgramStudi::class, 'prodi_id');
    }

    public function prodi(): BelongsTo
    {
        return $this->programStudi();
    }

    public function clo(): BelongsToMany
    {
        return $this->belongsToMany(Clo::class, 'course_clo', 'course_id', 'clo_id')->withTimestamps();
    }

    public function soal(): HasMany
    {
        return $this->hasMany(Soal::class, 'mata_kuliah_id');
    }

    public function penugasanKoordinator(): HasMany
    {
        return $this->hasMany(PenugasanKoordinator::class, 'course_id');
    }

    public function penugasanVerifikator(): HasMany
    {
        return $this->hasMany(PenugasanVerifikator::class, 'course_id');
    }
}
