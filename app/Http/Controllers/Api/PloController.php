<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Plo\ImportPloRequest;
use App\Http\Requests\Plo\StorePloRequest;
use App\Http\Requests\Plo\UpdatePloRequest;
use App\Http\Resources\PloResource;
use App\Repositories\Contracts\PloRepositoryContract;
use App\Services\PloExportService;
use App\Services\PloImportService;
use App\Services\PloService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PloController extends Controller
{
    protected PloService $ploService;
    protected PloRepositoryContract $ploRepository;
    protected PloImportService $ploImportService;
    protected PloExportService $ploExportService;

    public function __construct(
        PloService $ploService,
        PloRepositoryContract $ploRepository,
        PloImportService $ploImportService,
        PloExportService $ploExportService
    ) {
        $this->ploService = $ploService;
        $this->ploRepository = $ploRepository;
        $this->ploImportService = $ploImportService;
        $this->ploExportService = $ploExportService;
    }

    public function index(Request $request): JsonResponse
    {
        $prodiId = $request->query('prodi_id');
        $perPage = $request->query('per_page', 15);

        if (!$prodiId) {
            $siProdi = \App\Models\ProgramStudi::where('kode_prodi', 'SI')
                ->orWhere('nama_prodi', 'like', '%Sistem Informasi%')
                ->first();
            $prodiId = $siProdi ? $siProdi->id : \App\Models\ProgramStudi::value('id');
        }

        if (!$prodiId) {
            return response()->json([
                'success' => false,
                'message' => 'Prodi ID wajib ditentukan.'
            ], 422);
        }

        $mataKuliahId = $request->query('mata_kuliah_id') ? (int)$request->query('mata_kuliah_id') : null;
        $periodeId = $request->query('periode_id') ? (int)$request->query('periode_id') : null;
        $search = $request->query('search');

        $paginator = $this->ploRepository->findByProdi((int)$prodiId, $perPage, $mataKuliahId, $periodeId, $search);

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

    public function previewImport(ImportPloRequest $request): JsonResponse
    {
        $preview = $this->ploImportService->preview($request->file('file'));

        return response()->json([
            'success' => true,
            'message' => 'Preview import PLO berhasil diambil.',
            'data' => $preview,
        ]);
    }

    public function import(ImportPloRequest $request): JsonResponse
    {
        $result = $this->ploImportService->import($request->file('file'), $request->user());

        return response()->json([
            'success' => true,
            'message' => "Import PLO berhasil. {$result['created']} data disimpan.",
            'data' => $result,
        ]);
    }

    public function export(): StreamedResponse
    {
        return $this->ploExportService->export();
    }
}
