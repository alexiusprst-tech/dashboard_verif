<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Template\StoreTemplateRequest;
use App\Http\Resources\TemplateResource;
use App\Repositories\Contracts\TemplateRepositoryContract;
use App\Services\KategoriTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    protected KategoriTemplateService $kategoriTemplateService;
    protected TemplateRepositoryContract $templateRepository;

    public function __construct(
        KategoriTemplateService $kategoriTemplateService,
        TemplateRepositoryContract $templateRepository
    ) {
        $this->kategoriTemplateService = $kategoriTemplateService;
        $this->templateRepository = $templateRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $kategoriId = $request->query('kategori_id');
        if (!$kategoriId) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori ID wajib ditentukan.'
            ], 422);
        }

        $templates = $this->templateRepository->findByKategori((int) $kategoriId);

        return TemplateResource::collection($templates)->additional([
            'success' => true,
            'message' => 'Data template berhasil diambil.'
        ])->response();
    }

    public function store(StoreTemplateRequest $request): JsonResponse
    {
        $data = $request->validated();
        $file = $request->file('file_template');

        $template = $this->kategoriTemplateService->uploadTemplate(
            (int) $data['kategori_id'],
            $data['versi'],
            $file,
            $request->user()
        );

        return (new TemplateResource($template))->additional([
            'success' => true,
            'message' => 'Template berhasil diunggah.'
        ])->response();
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->kategoriTemplateService->deleteTemplate($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Template berhasil dihapus.'
        ]);
    }
}
