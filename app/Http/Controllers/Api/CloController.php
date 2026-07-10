<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clo\StoreCloRequest;
use App\Http\Requests\Clo\UpdateCloRequest;
use App\Http\Resources\CloResource;
use App\Repositories\Contracts\CloRepositoryContract;
use App\Services\CloService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CloController extends Controller
{
    protected CloService $cloService;
    protected CloRepositoryContract $cloRepository;

    public function __construct(CloService $cloService, CloRepositoryContract $cloRepository)
    {
        $this->cloService = $cloService;
        $this->cloRepository = $cloRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['mata_kuliah_id', 'plo_id']);
        $perPage = $request->query('per_page', 15);

        // Jika hanya minta list dropdown tanpa paginasi (misal untuk form upload soal)
        if ($request->has('dropdown') && !empty($filters['mata_kuliah_id'])) {
            $clos = $this->cloRepository->findByMataKuliah((int) $filters['mata_kuliah_id']);
            return CloResource::collection($clos)->additional([
                'success' => true,
                'message' => 'Data CLO dropdown berhasil diambil.'
            ])->response();
        }

        $paginator = $this->cloRepository->paginate($filters, $perPage);

        return CloResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data CLO berhasil diambil.'
        ])->response();
    }

    public function store(StoreCloRequest $request): JsonResponse
    {
        $clo = $this->cloService->create($request->validated(), $request->user());

        return (new CloResource($clo))->additional([
            'success' => true,
            'message' => 'CLO berhasil ditambahkan.'
        ])->response();
    }

    public function show(int $id): JsonResponse
    {
        $clo = $this->cloRepository->findById($id);
        if (!$clo) {
            return response()->json([
                'success' => false,
                'message' => 'CLO tidak ditemukan.'
            ], 404);
        }

        return (new CloResource($clo))->additional([
            'success' => true,
            'message' => 'CLO berhasil diambil.'
        ])->response();
    }

    public function update(UpdateCloRequest $request, int $id): JsonResponse
    {
        $clo = $this->cloService->update($id, $request->validated(), $request->user());

        return (new CloResource($clo))->additional([
            'success' => true,
            'message' => 'CLO berhasil diubah.'
        ])->response();
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->cloService->delete($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'CLO berhasil dihapus.'
        ]);
    }
}
