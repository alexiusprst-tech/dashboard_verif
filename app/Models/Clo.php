<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Clo extends Model
{
    protected $table = 'clo';

    protected $fillable = [
        'kode',
        'nama_clo',
        'deskripsi',
        'plo_id',
        'periode_id',
        'created_by',
    ];

    /* ── Relations ──────────────────────────────────────────── */

    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_clo', 'clo_id', 'course_id')->withTimestamps();
    }

    public function plo(): BelongsTo
    {
        return $this->belongsTo(Plo::class, 'plo_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
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
