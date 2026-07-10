<?php

namespace App\Repositories\Eloquent;

use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentCategoryRepository implements CategoryRepositoryContract
{
    public function findById(int $id): ?Category
    {
        return Category::with('activeTemplate')->find($id);
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return Category::with('activeTemplate')
            ->orderBy('nama_kategori')
            ->paginate($perPage);
    }

    public function create(array $data): Category
    {
        return Category::create($data);
    }

    public function update(Category $category, array $data): Category
    {
        $category->update($data);
        return $category->fresh();
    }

    public function delete(Category $category): bool
    {
        return (bool) $category->delete();
    }
}
