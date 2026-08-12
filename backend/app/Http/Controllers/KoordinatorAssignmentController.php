<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreKoordinatorAssignmentRequest;
use App\Http\Requests\UpdateKoordinatorAssignmentRequest;
use App\Services\KoordinatorAssignmentService;
use Illuminate\Http\JsonResponse;

/**
 * KoordinatorAssignmentController
 *
 * Handles assignment of Koordinator to courses per semester.
 * Actor: SuperAdmin
 *
 * Source: AGENTS.md Section 9, tech-spec.md Section 4.2
 * BR-03: Super Admin dapat menunjuk Koordinator.
 * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
 *
 * Architecture: Route → Middleware → FormRequest → Controller → Service → Repository → Model
 */
class KoordinatorAssignmentController extends Controller
{
    public function __construct(
        private KoordinatorAssignmentService $service
    ) {}

    /**
     * GET /api/koordinator-assignments
     * List all koordinator assignments, optionally filtered by semester.
     */
    public function index(): JsonResponse
    {
        // TODO: Implement with semester filter from request
        return response()->json(['data' => []]);
    }

    /**
     * POST /api/koordinator-assignments
     * Create a new koordinator assignment (menunjuk Koordinator).
     * BR-03: Super Admin dapat menunjuk Koordinator.
     */
    public function store(StoreKoordinatorAssignmentRequest $request): JsonResponse
    {
        // TODO: Implement via service
        // $assignment = $this->service->assignKoordinator($request->validated());
        // return response()->json(['data' => $assignment], 201);
        return response()->json(['data' => []], 201);
    }

    /**
     * PUT /api/koordinator-assignments/{id}
     * Update (replace) Koordinator on existing assignment.
     * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
     *
     * Unique constraint: (course_id, semester_id) ensures one Koordinator per MK per semester.
     */
    public function update(UpdateKoordinatorAssignmentRequest $request, int $id): JsonResponse
    {
        // TODO: Implement via service
        // $assignment = $this->service->replaceKoordinator($id, $request->validated());
        // return response()->json(['data' => $assignment]);
        return response()->json(['data' => []]);
    }
}
