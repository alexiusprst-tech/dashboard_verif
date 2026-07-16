<?php

namespace App\Repositories\Eloquent;

use App\Models\BeritaAcaraTemplate;
use App\Repositories\Contracts\BeritaAcaraTemplateRepositoryContract;
use Illuminate\Database\Eloquent\Collection;

class EloquentBeritaAcaraTemplateRepository implements BeritaAcaraTemplateRepositoryContract
{
    public function all(): Collection
    {
        return BeritaAcaraTemplate::with('uploadedByUser')
            ->orderByDesc('created_at')
            ->get();
    }

    public function findActive(): ?BeritaAcaraTemplate
    {
        return BeritaAcaraTemplate::where('is_active', true)->first();
    }

    public function findById(int $id): ?BeritaAcaraTemplate
    {
        return BeritaAcaraTemplate::with('uploadedByUser')->find($id);
    }

    public function create(array $data): BeritaAcaraTemplate
    {
        return BeritaAcaraTemplate::create($data);
    }

    public function update(BeritaAcaraTemplate $template, array $data): BeritaAcaraTemplate
    {
        $template->update($data);
        return $template->fresh();
    }

    public function delete(BeritaAcaraTemplate $template): bool
    {
        return (bool) $template->delete();
    }

    public function deactivateAll(): void
    {
        BeritaAcaraTemplate::where('is_active', true)->update(['is_active' => false]);
    }
}
