<?php

namespace App\Repositories\Contracts;

use App\Models\Template;
use Illuminate\Database\Eloquent\Collection;

interface TemplateRepositoryContract
{
    public function findById(int $id): ?Template;

    public function findByKategori(int $kategoriId): Collection;

    public function findActiveByKategori(int $kategoriId): ?Template;

    public function create(array $data): Template;

    public function update(Template $template, array $data): Template;

    public function delete(Template $template): bool;

    /** Nonaktifkan semua template dalam kategori tertentu */
    public function deactivateByKategori(int $kategoriId): void;
}
