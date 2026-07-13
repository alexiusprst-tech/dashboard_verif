<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class KategoriApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_index_returns_paginated_categories_without_error(): void
    {
        $user = User::factory()->create();
        Category::create([
            'nama_kategori' => 'UTS',
            'deskripsi' => 'Deskripsi UTS',
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/kategori?page=1&per_page=10');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'nama_kategori',
                    'deskripsi',
                    'active_template',
                ],
            ],
            'meta',
        ]);
    }

    public function test_template_upload_accepts_word_file(): void
    {
        $user = User::factory()->create(['is_super_admin' => true]);
        $category = Category::create([
            'nama_kategori' => 'UAS',
            'deskripsi' => 'Deskripsi UAS',
        ]);

        $file = UploadedFile::fake()->create('template.docx', 120, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/templates', [
            'kategori_id' => $category->id,
            'file_template' => $file,
            'versi' => '1.0',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.kategori_id', $category->id);
        $response->assertJsonPath('data.versi', '1.0');
    }
}
