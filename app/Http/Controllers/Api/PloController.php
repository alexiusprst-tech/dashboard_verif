<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Plo\StorePloRequest;
use App\Http\Requests\Plo\UpdatePloRequest;
use App\Http\Resources\PloResource;
use App\Repositories\Contracts\PloRepositoryContract;
use App\Services\PloService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PloController extends Controller
{
    protected PloService $ploService;
    protected PloRepositoryContract $ploRepository;

    public function __construct(PloService $ploService, PloRepositoryContract $ploRepository)
    {
        $this->ploService = $ploService;
        $this->ploRepository = $ploRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $prodiId = $request->query('prodi_id');
        $perPage = $request->query('per_page', 15);

        if (!$prodiId) {
            return response()->json([
                'success' => false,
                'message' => 'Prodi ID wajib ditentukan.'
            ], 422);
        }

        $paginator = $this->ploRepository->findByProdi($prodiId, $perPage);

        return PloResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data PLO berhasil diambil.'
        ])->response();
    }

    public function store(StorePloRequest $request): JsonResponse
    {
        $plo = $this->ploService->create($request->validated(), $request->user());

        return (new PloResource($plo))->additional([
            'success' => true,
            'message' => 'PLO berhasil ditambahkan.'
        ])->response();
    }

    public function show(int $id): JsonResponse
    {
        $plo = $this->ploRepository->findById($id);
        if (!$plo) {
            return response()->json([
                'success' => false,
                'message' => 'PLO tidak ditemukan.'
            ], 404);
        }

        return (new PloResource($plo))->additional([
            'success' => true,
            'message' => 'PLO berhasil diambil.'
        ])->response();
    }

    public function update(UpdatePloRequest $request, int $id): JsonResponse
    {
        $plo = $this->ploService->update($id, $request->validated(), $request->user());

        return (new PloResource($plo))->additional([
            'success' => true,
            'message' => 'PLO berhasil diubah.'
        ])->response();
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->ploService->delete($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'PLO berhasil dihapus.'
        ]);
    }
}
