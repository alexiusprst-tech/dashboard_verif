<?php

namespace App\Services;

use App\Repositories\Contracts\CategoryRepositoryContract;
use App\Repositories\Contracts\TemplateRepositoryContract;
use App\Models\Category;
use App\Models\Template;
use App\Models\User;
use App\Exceptions\BusinessException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class KategoriTemplateService
{
    protected CategoryRepositoryContract $categoryRepository;
    protected TemplateRepositoryContract $templateRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        CategoryRepositoryContract $categoryRepository,
        TemplateRepositoryContract $templateRepository,
        ActivityLogService $activityLogService
    ) {
        $this->categoryRepository = $categoryRepository;
        $this->templateRepository = $templateRepository;
        $this->activityLogService = $activityLogService;
    }

    public function createCategory(array $data, User $user): Category
    {
        $category = $this->categoryRepository->create($data);
        $this->activityLogService->log("Membuat kategori baru: {$category->nama_kategori}", 'Kategori', $user->id);
        return $category;
    }

    public function updateCategory(int $id, array $data, User $user): Category
    {
        $category = $this->categoryRepository->findById($id);
        if (!$category) {
            throw new BusinessException('Kategori tidak ditemukan.', 404);
        }

        $category = $this->categoryRepository->update($category, $data);
        $this->activityLogService->log("Mengubah kategori: {$category->nama_kategori}", 'Kategori', $user->id);
        return $category;
    }

    public function deleteCategory(int $id, User $user): void
    {
        $category = $this->categoryRepository->findById($id);
        if (!$category) {
            throw new BusinessException('Kategori tidak ditemukan.', 404);
        }

        $this->categoryRepository->delete($category);
        $this->activityLogService->log("Menghapus kategori: {$category->nama_kategori}", 'Kategori', $user->id);
    }

    public function uploadTemplate(int $kategoriId, string $versi, UploadedFile $file, User $user): Template
    {
        $category = $this->categoryRepository->findById($kategoriId);
        if (!$category) {
            throw new BusinessException('Kategori tidak ditemukan.', 404);
        }

        // Store file in storage/app/public/templates
        $path = $file->store('templates', 'public');

        $template = DB::transaction(function () use ($kategoriId, $versi, $file, $path) {
            // Deactivate all current active templates for this category
            $this->templateRepository->deactivateByKategori($kategoriId);

            // Create new template
            return $this->templateRepository->create([
                'kategori_id' => $kategoriId,
                'nama_file' => $file->getClientOriginalName(),
                'file_path' => $path,
                'versi' => $versi,
                'is_active' => true,
            ]);
        });

        $this->activityLogService->log(
            "Mengunggah template baru untuk kategori {$category->nama_kategori}: versi {$versi}",
            'Template',
            $user->id
        );

        return $template;
    }

    public function deleteTemplate(int $id, User $user): void
    {
        $template = $this->templateRepository->findById($id);
        if (!$template) {
            throw new BusinessException('Template tidak ditemukan.', 404);
        }

        // Delete file from disk
        Storage::disk('public')->delete($template->file_path);

        $this->templateRepository->delete($template);

        $this->activityLogService->log("Menghapus template ID {$id}", 'Template', $user->id);
    }
}
