<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Clo Model (Course Learning Outcome)
 *
 * BR-01: Satu mata kuliah dapat memiliki lebih dari satu CLO dan PLO.
 * BR-13: CLO dianggap telah ditetapkan seperti sistem OBE.
 *
 * NEEDS CONFIRMATION: CRUD scope — full CRUD vs read-only (BR-13 conflict).
 * Relasi ke PLO tidak langsung melalui tabel Soal (AGENTS.md Section 7).
 */
class Clo extends Model
{
    protected $fillable = [
        'nama',
        'deskripsi',
    ];

    /**
     * Courses that this CLO belongs to.
     * NEEDS CONFIRMATION: Pivot table name.
     */
    public function courses(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'course_clo');
    }
}
