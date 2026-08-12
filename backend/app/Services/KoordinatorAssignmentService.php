<?php

namespace App\Services;

use App\Repositories\KoordinatorAssignmentRepository;
use Illuminate\Support\Facades\DB;

/**
 * KoordinatorAssignmentService
 *
 * Business logic for Koordinator assignment management.
 * Source: AGENTS.md Section 3 (architecture pattern), tech-spec.md Section 3.2
 *
 * BR-02: Koordinator dapat berubah setiap semester.
 * BR-03: Super Admin dapat menunjuk Koordinator.
 * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
 *
 * Unique constraint: (course_id, semester_id) — mengganti Koordinator berarti
 * UPDATE baris existing, bukan INSERT baris baru yang bertabrakan.
 */
class KoordinatorAssignmentService
{
    public function __construct(
        private KoordinatorAssignmentRepository $repository
    ) {}

    /**
     * Assign a Koordinator to a course for a specific semester.
     * BR-03: Super Admin dapat menunjuk Koordinator.
     */
    public function assignKoordinator(array $data): mixed
    {
        // TODO: Implement
        // - Validate unique constraint (course_id, semester_id)
        // - Create assignment record
        // - Record assigned_by from authenticated user
        return null;
    }

    /**
     * Replace Koordinator on an existing assignment.
     * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
     */
    public function replaceKoordinator(int $assignmentId, array $data): mixed
    {
        // TODO: Implement
        // - Find existing assignment
        // - Update user_id to new Koordinator
        // - Update assigned_by for audit trail
        return null;
    }
}
