<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Periode;
use App\Models\ProgramStudi;
use App\Models\User;
use App\Models\PenugasanKoordinator;
use App\Services\PenugasanKoordinatorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PenugasanKoordinatorTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $dosen1;
    protected User $dosen2;
    protected Periode $periode;
    protected Course $course1;
    protected Course $course2;

    protected function setUp(): void
    {
        parent::setUp();

        $prodi = ProgramStudi::create([
            'kode_prodi' => 'SI',
            'nama_prodi' => 'Sistem Informasi',
        ]);

        $this->periode = Periode::create([
            'nama_periode'     => 'UTS Ganjil 2026/2027',
            'tahun_akademik'   => '2026/2027',
            'semester'         => 'ganjil',
            'tanggal_mulai'    => now()->subDays(2)->toDateString(),
            'tanggal_deadline' => now()->addDays(30)->toDateString(),
            'status'           => 'aktif',
        ]);

        $this->course1 = Course::create([
            'kode_mk'  => 'IF2113',
            'nama_mk'  => 'Dasar Pemrograman',
            'prodi_id' => $prodi->id,
            'sks'      => 3,
            'semester' => 1,
        ]);

        $this->course2 = Course::create([
            'kode_mk'  => 'IF2243',
            'nama_mk'  => 'Rekayasa Perangkat Lunak',
            'prodi_id' => $prodi->id,
            'sks'      => 3,
            'semester' => 3,
        ]);

        $this->admin = User::factory()->create([
            'kode_dosen'     => 'ADM999',
            'nama_lengkap'   => 'Administrator Utama',
            'is_super_admin' => true,
            'prodi_id'       => $prodi->id,
            'status_aktif'   => true,
        ]);

        $this->dosen1 = User::factory()->create([
            'kode_dosen'        => 'DSN001',
            'nama_lengkap'      => 'Dosen Pertama S.Kom',
            'prodi_id'          => $prodi->id,
            'is_super_admin'    => false,
            'is_koordinator_mk' => false,
            'status_aktif'      => true,
        ]);

        $this->dosen2 = User::factory()->create([
            'kode_dosen'        => 'DSN002',
            'nama_lengkap'      => 'Dosen Kedua M.Kom',
            'prodi_id'          => $prodi->id,
            'is_super_admin'    => false,
            'is_koordinator_mk' => false,
            'status_aktif'      => true,
        ]);
    }

    public function test_super_admin_can_get_penugasan_koordinator_list(): void
    {
        $service = app(PenugasanKoordinatorService::class);
        $service->assign([
            'periode_id' => $this->periode->id,
            'course_id'  => $this->course1->id,
            'dosen_id'   => $this->dosen1->id,
        ], $this->admin);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/penugasan-koordinator?periode_id={$this->periode->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.dosen.id', $this->dosen1->id)
            ->assertJsonPath('data.0.course.id', $this->course1->id);
    }

    public function test_super_admin_can_assign_dosen_as_koordinator_mk(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/penugasan-koordinator', [
                'periode_id' => $this->periode->id,
                'course_id'  => $this->course1->id,
                'dosen_id'   => $this->dosen1->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('penugasan_koordinator', [
            'periode_id' => $this->periode->id,
            'course_id'  => $this->course1->id,
            'dosen_id'   => $this->dosen1->id,
        ]);

        // User flag should be updated
        $this->dosen1->refresh();
        $this->assertTrue($this->dosen1->is_koordinator_mk);

        // Notification should be created
        $this->assertDatabaseHas('notifikasi', [
            'user_id' => $this->dosen1->id,
            'judul'   => 'Penugasan Koordinator Mata Kuliah',
        ]);
    }

    public function test_cannot_assign_duplicate_koordinator_for_same_course_and_periode(): void
    {
        $service = app(PenugasanKoordinatorService::class);
        $service->assign([
            'periode_id' => $this->periode->id,
            'course_id'  => $this->course1->id,
            'dosen_id'   => $this->dosen1->id,
        ], $this->admin);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/penugasan-koordinator', [
                'periode_id' => $this->periode->id,
                'course_id'  => $this->course1->id,
                'dosen_id'   => $this->dosen1->id,
            ]);

        $response->assertStatus(422);
    }

    public function test_super_admin_can_revoke_koordinator_mk(): void
    {
        $service = app(PenugasanKoordinatorService::class);
        $assignment = $service->assign([
            'periode_id' => $this->periode->id,
            'course_id'  => $this->course1->id,
            'dosen_id'   => $this->dosen1->id,
        ], $this->admin);

        $this->dosen1->refresh();
        $this->assertTrue($this->dosen1->is_koordinator_mk);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/penugasan-koordinator/{$assignment->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('penugasan_koordinator', [
            'id' => $assignment->id,
        ]);

        // When all assignments are revoked, is_koordinator_mk is false
        $this->dosen1->refresh();
        $this->assertFalse($this->dosen1->is_koordinator_mk);
    }

    public function test_non_super_admin_cannot_assign_or_revoke_koordinator(): void
    {
        // Store
        $storeResponse = $this->actingAs($this->dosen1, 'sanctum')
            ->postJson('/api/penugasan-koordinator', [
                'periode_id' => $this->periode->id,
                'course_id'  => $this->course1->id,
                'dosen_id'   => $this->dosen2->id,
            ]);

        $storeResponse->assertForbidden();

        // Assign with admin first
        $service = app(PenugasanKoordinatorService::class);
        $assignment = $service->assign([
            'periode_id' => $this->periode->id,
            'course_id'  => $this->course1->id,
            'dosen_id'   => $this->dosen2->id,
        ], $this->admin);

        // Delete with non-admin
        $deleteResponse = $this->actingAs($this->dosen1, 'sanctum')
            ->deleteJson("/api/penugasan-koordinator/{$assignment->id}");

        $deleteResponse->assertForbidden();
    }
}
