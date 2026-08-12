<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * KoordinatorAssignment Model
 *
 * Represents the assignment of a Koordinator to a course for a specific semester.
 * Source: AGENTS.md Section 7-8
 *
 * Table: koordinator_assignments
 * Unique constraint: (course_id, semester_id)
 * — satu MK hanya punya satu Koordinator aktif per semester (BR-02/BR-04).
 */
class KoordinatorAssignment extends Model
{
    protected $table = 'koordinator_assignments';

    protected $fillable = [
        'course_id',
        'user_id',
        'semester_id',
        'assigned_by',
    ];

    /**
     * The course (Mata Kuliah) this assignment belongs to.
     */
    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * The user (Dosen) assigned as Koordinator.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The semester this assignment is active for.
     * BR-02: Koordinator dapat berubah setiap semester.
     */
    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    /**
     * The SuperAdmin who made this assignment (audit trail).
     */
    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }
}
