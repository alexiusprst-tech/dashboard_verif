<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\KoordinatorAssignment\StoreKoordinatorAssignmentRequest;
use App\Http\Requests\KoordinatorAssignment\UpdateKoordinatorAssignmentRequest;
use App\Http\Resources\KoordinatorAssignmentResource;
use App\Repositories\Contracts\KoordinatorAssignmentRepositoryContract;
use App\Services\KoordinatorAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * KoordinatorAssignmentController — CRUD Penugasan Koordinator.
 *
 * BR-02: Koordinator dapat berubah setiap semester.
 * BR-03: Super Admin dapat menunjuk Koordinator.
 * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
 */
class KoordinatorAssignmentController extends Controller
{
    protected KoordinatorAssignmentService $service;
    protected KoordinatorAssignmentRepositoryContract $repository;

    public function __construct(
        KoordinatorAssignmentService $service,
        KoordinatorAssignmentRepositoryContract $repository
    ) {
        $this->service = $service;
        $this->repository = $repository;
    }

    /**
     * Daftar semua assignment Koordinator.
     * Filter opsional: ?periode_id=
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['periode_id']);
        $perPage = $request->query('per_page', 15);

        $paginator = $this->repository->paginate($filters, $perPage);

        return KoordinatorAssignmentResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data penugasan Koordinator berhasil diambil.',
        ])->response();
    }

    /**
     * Assign Koordinator baru.
     * BR-03: Super Admin dapat menunjuk Koordinator.
     */
    public function store(StoreKoordinatorAssignmentRequest $request): JsonResponse
    {
        $assignment = $this->service->assign(
            $request->validated(),
            $request->user()
        );

        return (new KoordinatorAssignmentResource($assignment))->additional([
            'success' => true,
            'message' => 'Koordinator berhasil ditugaskan.',
        ])->response()->setStatusCode(201);
    }

    /**
     * Ganti Koordinator (replace user pada assignment yang ada).
     * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
     */
    public function update(UpdateKoordinatorAssignmentRequest $request, int $id): JsonResponse
    {
        $assignment = $this->service->replace(
            $id,
            $request->validated(),
            $request->user()
        );

        return (new KoordinatorAssignmentResource($assignment))->additional([
            'success' => true,
            'message' => 'Koordinator berhasil diganti.',
        ])->response();
    }

    /**
     * Hapus assignment Koordinator.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->service->remove($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Penugasan Koordinator berhasil dihapus.',
        ]);
    }
}
