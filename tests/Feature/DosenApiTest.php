<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ProgramStudi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DosenApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_get_paginated_dosen_list(): void
    {
        /** @var User $superAdmin */
        $superAdmin = User::factory()->create(['is_super_admin' => true]);
        User::factory()->count(3)->create(['is_super_admin' => false]);

        $response = $this->actingAs($superAdmin, 'sanctum')->getJson('/api/dosen');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'kode_dosen',
                    'nama_lengkap',
                    'email',
                    'tipe_dosen',
                    'status_aktif',
                ],
            ],
            'meta',
        ]);
    }

    public function test_super_admin_can_create_new_dosen(): void
    {
        /** @var User $superAdmin */
        $superAdmin = User::factory()->create(['is_super_admin' => true]);
        $prodi = ProgramStudi::create([
            'kode_prodi' => 'SI',
            'nama_prodi' => 'Sistem Informasi',
        ]);

        $payload = [
            'name'         => 'Dosen Testing, M.T.',
            'email'        => 'dosentest@telkomuniversity.ac.id',
            'password'     => 'password123',
            'kode_dosen'   => 'DSN-TEST-01',
            'tipe_dosen'   => 'biasa',
            'prodi_id'     => $prodi->id,
            'status_aktif' => true,
        ];

        $response = $this->actingAs($superAdmin, 'sanctum')->postJson('/api/dosen', $payload);

        $response->assertCreated();
        $response->assertJsonPath('data.kode_dosen', 'DSN-TEST-01');
        $response->assertJsonPath('data.email', 'dosentest@telkomuniversity.ac.id');
        $this->assertDatabaseHas('users', ['email' => 'dosentest@telkomuniversity.ac.id']);
    }

    public function test_super_admin_can_update_dosen(): void
    {
        /** @var User $superAdmin */
        $superAdmin = User::factory()->create(['is_super_admin' => true]);
        /** @var User $dosen */
        $dosen = User::factory()->create([
            'is_super_admin' => false,
            'kode_dosen' => 'DSN-OLD',
            'nama_lengkap' => 'Nama Lama',
        ]);

        $payload = [
            'name'       => 'Nama Baru, M.Kom.',
            'kode_dosen' => 'DSN-NEW',
        ];

        $response = $this->actingAs($superAdmin, 'sanctum')->putJson("/api/dosen/{$dosen->id}", $payload);

        $response->assertOk();
        $response->assertJsonPath('data.kode_dosen', 'DSN-NEW');
        $response->assertJsonPath('data.nama_lengkap', 'Nama Baru, M.Kom.');
    }

    public function test_coordinator_can_access_dosen_crud(): void
    {
        /** @var User $coordinator */
        $coordinator = User::factory()->create([
            'is_super_admin' => false,
            'is_coordinator' => true,
        ]);

        $response = $this->actingAs($coordinator, 'sanctum')->getJson('/api/dosen');
        $response->assertOk();
    }

    public function test_non_coordinator_cannot_access_dosen_crud(): void
    {
        /** @var User $regularDosen */
        $regularDosen = User::factory()->create([
            'is_super_admin' => false,
            'is_coordinator' => false,
        ]);

        $response = $this->actingAs($regularDosen, 'sanctum')->getJson('/api/dosen');
        $response->assertForbidden();
    }
}
