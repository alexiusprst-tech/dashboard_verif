<?php

namespace App\Repositories\Eloquent;

use App\Models\Template;
use App\Repositories\Contracts\TemplateRepositoryContract;
use Illuminate\Database\Eloquent\Collection;

class EloquentTemplateRepository implements TemplateRepositoryContract
{
    public function findById(int $id): ?Template
    {
        return Template::with('kategori')->find($id);
    }

    public function findByKategori(int $kategoriId): Collection
    {
        return Template::where('kategori_id', $kategoriId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findActiveByKategori(int $kategoriId): ?Template
    {
        return Template::where('kategori_id', $kategoriId)
            ->where('is_active', true)
            ->first();
    }

    public function create(array $data): Template
    {
        return Template::create($data);
    }

    public function update(Template $template, array $data): Template
    {
        $template->update($data);
        return $template->fresh();
    }

    public function delete(Template $template): bool
    {
        return (bool) $template->delete();
    }

    public function deactivateByKategori(int $kategoriId): void
    {
        Template::where('kategori_id', $kategoriId)
            ->where('is_active', true)
            ->update(['is_active' => false]);
    }
}
