<?php

namespace App\Repositories;

use App\Models\KoordinatorAssignment;
use Illuminate\Database\Eloquent\Collection;

/**
 * KoordinatorAssignmentRepository
 *
 * Data access layer for KoordinatorAssignment model.
 * Source: AGENTS.md Section 3 (architecture pattern)
 *
 * Architecture: Route → Middleware → FormRequest → Controller → Service → Repository → Model
 */
class KoordinatorAssignmentRepository
{
    /**
     * Get all assignments, optionally filtered by semester.
     */
    public function getAll(?int $semesterId = null): Collection
    {
        $query = KoordinatorAssignment::with(['course', 'user', 'semester', 'assigner']);

        if ($semesterId) {
            $query->where('semester_id', $semesterId);
        }

        return $query->get();
    }

    /**
     * Find assignment by ID.
     */
    public function findById(int $id): ?KoordinatorAssignment
    {
        return KoordinatorAssignment::with(['course', 'user', 'semester', 'assigner'])
            ->find($id);
    }

    /**
     * Find assignment by course and semester (unique constraint lookup).
     */
    public function findByCourseAndSemester(int $courseId, int $semesterId): ?KoordinatorAssignment
    {
        return KoordinatorAssignment::where('course_id', $courseId)
            ->where('semester_id', $semesterId)
            ->first();
    }

    /**
     * Create a new assignment.
     */
    public function create(array $data): KoordinatorAssignment
    {
        return KoordinatorAssignment::create($data);
    }

    /**
     * Update an existing assignment.
     */
    public function update(KoordinatorAssignment $assignment, array $data): KoordinatorAssignment
    {
        $assignment->update($data);
        return $assignment->fresh();
    }
}
