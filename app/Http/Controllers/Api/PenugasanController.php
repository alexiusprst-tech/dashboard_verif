<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Penugasan\StorePenugasanRequest;
use App\Http\Resources\PenugasanResource;
use App\Repositories\Contracts\PenugasanRepositoryContract;
use App\Services\PenugasanPicService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PenugasanController extends Controller
{
    protected PenugasanPicService $penugasanPicService;
    protected PenugasanRepositoryContract $penugasanRepository;

    public function __construct(
        PenugasanPicService $penugasanPicService,
        PenugasanRepositoryContract $penugasanRepository
    ) {
        $this->penugasanPicService = $penugasanPicService;
        $this->penugasanRepository = $penugasanRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $perPage = $request->query('per_page', 15);

        if (!$periodeId) {
            return response()->json([
                'success' => false,
                'message' => 'Periode ID wajib ditentukan.'
            ], 422);
        }

        $paginator = $this->penugasanRepository->paginate((int) $periodeId, $perPage);

        return PenugasanResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data penugasan PIC berhasil diambil.'
        ])->response();
    }

    public function store(StorePenugasanRequest $request): JsonResponse
    {
        $result = $this->penugasanPicService->assign($request->validated(), $request->user());

        return PenugasanResource::collection(collect($result['assignments']))->additional([
            'success' => true,
            'message' => 'Penugasan PIC berhasil disimpan.',
            'unique_pic_count' => $result['unique_pic_count'],
            'warning' => $result['warning']
        ])->response();
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->penugasanPicService->cabut($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Penugasan PIC berhasil dicabut.'
        ]);
    }
}
