<?php

namespace App\Services;

use App\Models\BeritaAcaraTemplate;
use App\Models\User;
use App\Repositories\Contracts\BeritaAcaraTemplateRepositoryContract;
use App\Exceptions\BusinessException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TemplateBeritaAcaraService
{
    protected BeritaAcaraTemplateRepositoryContract $templateRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        BeritaAcaraTemplateRepositoryContract $templateRepository,
        ActivityLogService $activityLogService
    ) {
        $this->templateRepository = $templateRepository;
        $this->activityLogService = $activityLogService;
    }

    public function all(): Collection
    {
        return $this->templateRepository->all();
    }

    public function getActive(): ?BeritaAcaraTemplate
    {
        return $this->templateRepository->findActive();
    }

    public function upload(string $namaTemplate, UploadedFile $file, User $user): BeritaAcaraTemplate
    {
        // Store in storage/app/templates/ba (private local storage)
        $path = $file->store('templates/ba', 'local');

        $originalName = $file->getClientOriginalName();

        $template = DB::transaction(function () use ($namaTemplate, $originalName, $path, $user) {
            // Deactivate all existing templates
            $this->templateRepository->deactivateAll();

            // Create new template as active
            return $this->templateRepository->create([
                'nama_template' => $namaTemplate,
                'nama_file' => $originalName,
                'file_path' => $path,
                'is_active' => true,
                'uploaded_by' => $user->id,
            ]);
        });

        $this->activityLogService->log(
            "Mengunggah template Berita Acara baru: {$namaTemplate}",
            'Template Berita Acara',
            $user->id
        );

        return $template;
    }

    public function activate(int $id, User $user): BeritaAcaraTemplate
    {
        $template = $this->templateRepository->findById($id);
        if (!$template) {
            throw new BusinessException('Template Berita Acara tidak ditemukan.', 404);
        }

        $template = DB::transaction(function () use ($template) {
            $this->templateRepository->deactivateAll();
            return $this->templateRepository->update($template, ['is_active' => true]);
        });

        $this->activityLogService->log(
            "Mengaktifkan template Berita Acara: {$template->nama_template}",
            'Template Berita Acara',
            $user->id
        );

        return $template;
    }

    public function delete(int $id, User $user): void
    {
        $template = $this->templateRepository->findById($id);
        if (!$template) {
            throw new BusinessException('Template Berita Acara tidak ditemukan.', 404);
        }

        // Delete template file from disk
        if (Storage::disk('local')->exists($template->file_path)) {
            Storage::disk('local')->delete($template->file_path);
        }

        $this->templateRepository->delete($template);

        $this->activityLogService->log(
            "Menghapus template Berita Acara: {$template->nama_template}",
            'Template Berita Acara',
            $user->id
        );
    }
}
