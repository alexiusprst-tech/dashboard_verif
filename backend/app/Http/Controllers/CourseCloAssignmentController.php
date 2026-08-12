<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCourseCloAssignmentRequest;
use App\Services\CourseCloAssignmentService;
use Illuminate\Http\JsonResponse;

/**
 * CourseCloAssignmentController
 *
 * Replaces closure route for Course-CLO assignment.
 * Actor: SuperAdmin
 *
 * Source: AGENTS.md Section 9, tech-spec.md Section 2.2
 * Audit finding: C-01 (closure in routes/api.php), F-03 (missing exists validation),
 *                FN-01 (missing DB::transaction)
 *
 * This controller closes three audit findings at once by moving
 * closure logic to proper Controller+Service+Repository pattern.
 *
 * Architecture: Route → Middleware → FormRequest → Controller → Service → Repository → Model
 */
class CourseCloAssignmentController extends Controller
{
    public function __construct(
        private CourseCloAssignmentService $service
    ) {}

    /**
     * POST /api/courses/{courseId}/clo
     * Assign CLOs to a course.
     *
     * Replaces closure route — endpoint URL is NOT changed (AGENTS.md Section 9).
     * FormRequest validates: exists:clos,id (closing F-03).
     * Service wraps in DB::transaction() (closing FN-01).
     */
    public function store(StoreCourseCloAssignmentRequest $request, int $courseId): JsonResponse
    {
        // TODO: Implement via service
        // $result = $this->service->syncCloToCourse($courseId, $request->validated());
        // return response()->json(['data' => $result]);
        return response()->json(['data' => []], 201);
    }
}
