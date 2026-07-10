<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Periode\StorePeriodeRequest;
use App\Http\Requests\Periode\UpdatePeriodeRequest;
use App\Http\Resources\PeriodeResource;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Services\PeriodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodeController extends Controller
{
    protected PeriodeService $periodeService;
    protected PeriodeRepositoryContract $periodeRepository;

    public function __construct(PeriodeService $periodeService, PeriodeRepositoryContract $periodeRepository)
    {
        $this->periodeService = $periodeService;
        $this->periodeRepository = $periodeRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->query('per_page', 15);
        $paginator = $this->periodeRepository->paginate($perPage);

        return PeriodeResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data periode akademik berhasil diambil.'
        ])->response();
    }

    public function store(StorePeriodeRequest $request): JsonResponse
    {
        $periode = $this->periodeService->create($request->validated(), $request->user());

        return (new PeriodeResource($periode))->additional([
            'success' => true,
            'message' => 'Periode berhasil ditambahkan.'
        ])->response();
    }

    public function show(int $id): JsonResponse
    {
        $periode = $this->periodeRepository->findById($id);
        if (!$periode) {
            return response()->json([
                'success' => false,
                'message' => 'Periode tidak ditemukan.'
            ], 404);
        }

        return (new PeriodeResource($periode))->additional([
            'success' => true,
            'message' => 'Periode berhasil diambil.'
        ])->response();
    }

    public function update(UpdatePeriodeRequest $request, int $id): JsonResponse
    {
        $periode = $this->periodeService->update($id, $request->validated(), $request->user());

        return (new PeriodeResource($periode))->additional([
            'success' => true,
            'message' => 'Periode berhasil diubah.'
        ])->response();
    }

    public function activate(Request $request, int $id): JsonResponse
    {
        $periode = $this->periodeService->activate($id, $request->user());

        return (new PeriodeResource($periode))->additional([
            'success' => true,
            'message' => 'Periode berhasil diaktifkan. Periode lain telah dinonaktifkan.'
        ])->response();
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->periodeService->delete($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Periode berhasil dihapus.'
        ]);
    }
}
