<?php

namespace App\Repositories\Contracts;

use App\Models\BeritaAcaraTemplate;
use Illuminate\Database\Eloquent\Collection;

interface BeritaAcaraTemplateRepositoryContract
{
    public function all(): Collection;

    public function findActive(): ?BeritaAcaraTemplate;

    public function findById(int $id): ?BeritaAcaraTemplate;

    public function create(array $data): BeritaAcaraTemplate;

    public function update(BeritaAcaraTemplate $template, array $data): BeritaAcaraTemplate;

    public function delete(BeritaAcaraTemplate $template): bool;

    public function deactivateAll(): void;
}
