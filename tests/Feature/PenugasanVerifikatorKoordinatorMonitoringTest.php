<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Periode;
use App\Models\ProgramStudi;
use App\Models\User;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Services\PenugasanKoordinatorService;
use App\Services\PenugasanVerifikatorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PenugasanVerifikatorKoordinatorMonitoringTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $koordinatorDosen;
    protected User $otherDosen;
    protected User $verifikator1;
    protected User $verifikator2;
    protected Periode $periode;
    protected Course $courseKoordinator;
    protected Course $otherCourse;

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

        $this->courseKoordinator = Course::create([
            'kode_mk'  => 'IF2113',
            'nama_mk'  => 'Dasar Pemrograman',
            'prodi_id' => $prodi->id,
            'sks'      => 3,
            'semester' => 1,
        ]);

        $this->otherCourse = Course::create([
            'kode_mk'  => 'IF2243',
            'nama_mk'  => 'Rekayasa Perangkat Lunak',
            'prodi_id' => $prodi->id,
            'sks'      => 3,
            'semester' => 3,
        ]);

        $this->admin = User::factory()->create([
            'kode_dosen'     => 'ADM999',
            'nama_lengkap'   => 'Super Administrator',
            'is_super_admin' => true,
            'prodi_id'       => $prodi->id,
            'status_aktif'   => true,
        ]);

        $this->koordinatorDosen = User::factory()->create([
            'kode_dosen'        => 'KOR001',
            'nama_lengkap'      => 'Dr. Koordinator MK',
            'prodi_id'          => $prodi->id,
            'is_super_admin'    => false,
            'is_koordinator_mk' => false,
            'status_aktif'      => true,
        ]);

        $this->otherDosen = User::factory()->create([
            'kode_dosen'        => 'DSN002',
            'nama_lengkap'      => 'Dosen Biasa S.Kom',
            'prodi_id'          => $prodi->id,
            'is_super_admin'    => false,
            'is_koordinator_mk' => false,
            'status_aktif'      => true,
        ]);

        $this->verifikator1 = User::factory()->create([
            'kode_dosen'        => 'VRF001',
            'nama_lengkap'      => 'Verifikator Dasar Pemrograman',
            'prodi_id'          => $prodi->id,
            'is_super_admin'    => false,
            'is_koordinator_mk' => false,
            'status_aktif'      => true,
        ]);

        $this->verifikator2 = User::factory()->create([
            'kode_dosen'        => 'VRF002',
            'nama_lengkap'      => 'Verifikator RPL',
            'prodi_id'          => $prodi->id,
            'is_super_admin'    => false,
            'is_koordinator_mk' => false,
            'status_aktif'      => true,
        ]);

        // SuperAdmin assigns koordinatorDosen as Koordinator MK for courseKoordinator
        $koordinatorService = app(PenugasanKoordinatorService::class);
        $koordinatorService->assign([
            'periode_id' => $this->periode->id,
            'course_id'  => $this->courseKoordinator->id,
            'dosen_id'   => $this->koordinatorDosen->id,
        ], $this->admin);

        // SuperAdmin assigns verifikators to both courses
        $verifikatorService = app(PenugasanVerifikatorService::class);
        $verifikatorService->assign([
            'periode_id' => $this->periode->id,
            'course_id'  => $this->courseKoordinator->id,
            'dosen_id'   => $this->verifikator1->id,
        ], $this->admin);

        $verifikatorService->assign([
            'periode_id' => $this->periode->id,
            'course_id'  => $this->otherCourse->id,
            'dosen_id'   => $this->verifikator2->id,
        ], $this->admin);
    }

    public function test_super_admin_can_view_all_verifikators(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/penugasan-verifikator?periode_id={$this->periode->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.is_koordinator_view', false);
    }

    public function test_koordinator_mk_only_views_verifikators_for_held_course(): void
    {
        $response = $this->actingAs($this->koordinatorDosen, 'sanctum')
            ->getJson("/api/penugasan-verifikator?periode_id={$this->periode->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.course.id', $this->courseKoordinator->id)
            ->assertJsonPath('data.0.dosen.id', $this->verifikator1->id)
            ->assertJsonPath('meta.is_koordinator_view', true)
            ->assertJsonCount(1, 'meta.coordinated_courses')
            ->assertJsonPath('meta.coordinated_courses.0.id', $this->courseKoordinator->id);
    }

    public function test_koordinator_mk_can_filter_by_held_course(): void
    {
        $response = $this->actingAs($this->koordinatorDosen, 'sanctum')
            ->getJson("/api/penugasan-verifikator?periode_id={$this->periode->id}&course_id={$this->courseKoordinator->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.dosen.id', $this->verifikator1->id);
    }

    public function test_koordinator_mk_filtering_by_unheld_course_returns_empty(): void
    {
        $response = $this->actingAs($this->koordinatorDosen, 'sanctum')
            ->getJson("/api/penugasan-verifikator?periode_id={$this->periode->id}&course_id={$this->otherCourse->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('meta.total', 0);
    }

    public function test_dosen_without_koordinator_role_is_forbidden(): void
    {
        $response = $this->actingAs($this->otherDosen, 'sanctum')
            ->getJson("/api/penugasan-verifikator?periode_id={$this->periode->id}");

        $response->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Akses ditolak. Fitur monitoring verifikator hanya tersedia untuk role Koordinator MK.');
    }

    public function test_koordinator_mk_cannot_assign_or_revoke_verifikator(): void
    {
        // Cannot assign (POST)
        $storeResponse = $this->actingAs($this->koordinatorDosen, 'sanctum')
            ->postJson('/api/penugasan-verifikator', [
                'periode_id' => $this->periode->id,
                'course_id'  => $this->courseKoordinator->id,
                'dosen_id'   => $this->otherDosen->id,
            ]);

        $storeResponse->assertForbidden();

        // Cannot revoke (DELETE)
        $assignment = PenugasanVerifikator::where('course_id', $this->courseKoordinator->id)->first();
        $this->assertNotNull($assignment);

        $deleteResponse = $this->actingAs($this->koordinatorDosen, 'sanctum')
            ->deleteJson("/api/penugasan-verifikator/{$assignment->id}");

        $deleteResponse->assertForbidden();
    }
}
