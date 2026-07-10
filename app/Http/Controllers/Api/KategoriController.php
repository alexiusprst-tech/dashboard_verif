<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Kategori\StoreKategoriRequest;
use App\Http\Resources\CategoryResource;
use App\Repositories\Contracts\CategoryRepositoryContract;
use App\Services\KategoriTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KategoriController extends Controller
{
    protected KategoriTemplateService $kategoriTemplateService;
    protected CategoryRepositoryContract $categoryRepository;

    public function __construct(
        KategoriTemplateService $kategoriTemplateService,
        CategoryRepositoryContract $categoryRepository
    ) {
        $this->kategoriTemplateService = $kategoriTemplateService;
        $this->categoryRepository = $categoryRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->query('per_page', 15);
        $paginator = $this->categoryRepository->paginate($perPage);

        return CategoryResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data kategori berhasil diambil.'
        ])->response();
    }

    public function store(StoreKategoriRequest $request): JsonResponse
    {
        $category = $this->kategoriTemplateService->createCategory($request->validated(), $request->user());

        return (new CategoryResource($category))->additional([
            'success' => true,
            'message' => 'Kategori berhasil ditambahkan.'
        ])->response();
    }

    public function show(int $id): JsonResponse
    {
        $category = $this->categoryRepository->findById($id);
        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak ditemukan.'
            ], 404);
        }

        return (new CategoryResource($category))->additional([
            'success' => true,
            'message' => 'Kategori berhasil diambil.'
        ])->response();
    }

    public function update(StoreKategoriRequest $request, int $id): JsonResponse
    {
        $category = $this->kategoriTemplateService->updateCategory($id, $request->validated(), $request->user());

        return (new CategoryResource($category))->additional([
            'success' => true,
            'message' => 'Kategori berhasil diubah.'
        ])->response();
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->kategoriTemplateService->deleteCategory($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus.'
        ]);
    }
}
