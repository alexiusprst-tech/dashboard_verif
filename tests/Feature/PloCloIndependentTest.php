<?php

namespace Tests\Feature;

use App\Models\Clo;
use App\Models\Course;
use App\Models\Periode;
use App\Models\Plo;
use App\Models\ProgramStudi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PloCloIndependentTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected ProgramStudi $prodi;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $this->prodi = ProgramStudi::create([
            'nama_prodi' => 'S1 Sistem Informasi',
            'kode_prodi' => 'SI',
        ]);

        $this->admin = User::factory()->create([
            'is_super_admin' => true,
            'prodi_id'       => $this->prodi->id,
            'status_aktif'   => true,
        ]);

        $this->course = Course::create([
            'kode_mk'  => 'SI201',
            'nama_mk'  => 'Analisis Proses Bisnis',
            'sks'      => 3,
            'prodi_id' => $this->prodi->id,
        ]);
    }

    public function test_can_create_plo_without_periode(): void
    {
        $payload = [
            'kode'      => 'PLO-01',
            'deskripsi' => 'Mampu menganalisis dan merancang sistem enterprise',
            'prodi_id'  => $this->prodi->id,
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/plo', $payload);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.kode', 'PLO-01');

        $this->assertDatabaseHas('plo', [
            'kode'      => 'PLO-01',
            'prodi_id'  => $this->prodi->id,
        ]);
    }

    public function test_can_create_clo_without_periode(): void
    {
        $plo = Plo::create([
            'kode'      => 'PLO-02',
            'deskripsi' => 'Mampu mengimplementasikan arsitektur enterprise',
            'prodi_id'  => $this->prodi->id,
        ]);

        $payload = [
            'kode'            => 'CLO-01',
            'deskripsi'       => 'Mampu memodelkan arsitektur BPMN',
            'plo_id'          => $plo->id,
            'mata_kuliah_ids' => [$this->course->id],
        ];

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/clo', $payload);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.kode', 'CLO-01');

        $this->assertDatabaseHas('clo', [
            'kode'   => 'CLO-01',
            'plo_id' => $plo->id,
        ]);
    }

    public function test_plo_and_clo_can_be_retrieved_without_periode_filters(): void
    {
        $plo = Plo::create([
            'kode'      => 'PLO-03',
            'deskripsi' => 'Pengujian PLO',
            'prodi_id'  => $this->prodi->id,
        ]);

        $clo = Clo::create([
            'kode'      => 'CLO-03',
            'deskripsi' => 'Pengujian CLO',
            'plo_id'    => $plo->id,
        ]);
        $clo->courses()->attach($this->course->id);

        // Fetch PLO
        $resPlo = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/plo?prodi_id={$this->prodi->id}");

        $resPlo->assertOk()
            ->assertJsonPath('success', true);

        $this->assertCount(1, $resPlo->json('data'));

        // Fetch CLO
        $resClo = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/clo');

        $resClo->assertOk()
            ->assertJsonPath('success', true);

        $this->assertCount(1, $resClo->json('data'));
    }
}
