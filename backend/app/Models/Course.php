<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Course Model (Mata Kuliah)
 *
 * Source: AGENTS.md Section 7
 * BR-01: Satu mata kuliah dapat memiliki lebih dari satu CLO dan PLO.
 *
 * NEEDS CONFIRMATION: Struktur mapping Mata Kuliah↔CLO yang aktif:
 * course_clo pivot table atau mata_kuliah_id di CLO.
 */
class Course extends Model
{
    protected $fillable = [
        'nama',
        'kode',
    ];

    /**
     * Koordinator assignments for this course.
     */
    public function koordinatorAssignments(): HasMany
    {
        return $this->hasMany(KoordinatorAssignment::class);
    }

    /**
     * CLOs associated with this course.
     * BR-01: Many-to-many relationship.
     *
     * NEEDS CONFIRMATION: Pivot table name (course_clo or other).
     */
    public function clos(): BelongsToMany
    {
        return $this->belongsToMany(Clo::class, 'course_clo');
    }
}
