<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\Periode;
use App\Models\ProgramStudi;
use App\Models\Soal;
use App\Models\Template;
use App\Models\User;
use App\Models\Verification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SoalEnhancementsTest extends TestCase
{
    use RefreshDatabase;

    protected User $dosen;
    protected Periode $activePeriode;
    protected Course $course;

    protected function setUp(): void
    {
        parent::setUp();

        $prodi = ProgramStudi::create([
            'kode_prodi' => 'IF',
            'nama_prodi' => 'Informatika',
        ]);

        $this->activePeriode = Periode::create([
            'nama_periode'     => 'Semester Ganjil 2026/2027',
            'tahun_akademik'   => '2026/2027',
            'semester'         => 'ganjil',
            'tanggal_mulai'    => now()->subDays(5),
            'tanggal_deadline' => now()->addDays(2),
            'status'           => 'aktif',
        ]);

        $this->dosen = User::factory()->create([
            'prodi_id'       => $prodi->id,
            'is_super_admin' => false,
            'is_coordinator' => false,
            'status_aktif'   => true,
        ]);

        $this->course = Course::create([
            'kode_mk'  => 'IF101',
            'nama_mk'  => 'Dasar Pemrograman',
            'prodi_id' => $prodi->id,
            'sks'      => 3,
        ]);
    }

    protected function createTestSoal(array $overrides = []): Soal
    {
        $category = Category::firstOrCreate(['nama_kategori' => 'UTS'], ['deskripsi' => 'UTS']);
        $template = Template::firstOrCreate(['nama_template' => 'Default'], [
            'kategori_id' => $category->id,
            'nama_file'   => 'default.docx',
            'file_path'   => 'templates/default.docx',
            'is_active'   => true,
        ]);
        $plo = \App\Models\Plo::firstOrCreate(['kode' => 'PLO-1'], [
            'deskripsi' => 'PLO 1',
        ]);
        $clo = \App\Models\Clo::firstOrCreate(['kode' => 'CLO-1', 'mata_kuliah_id' => $this->course->id], [
            'deskripsi' => 'CLO 1',
            'plo_id'    => $plo->id,
        ]);

        return Soal::create(array_merge([
            'uuid'           => \Illuminate\Support\Str::uuid()->toString(),
            'dosen_id'       => $this->dosen->id,
            'periode_id'     => $this->activePeriode->id,
            'mata_kuliah_id' => $this->course->id,
            'clo_id'         => $clo->id,
            'template_id'    => $template->id,
            'judul_soal'     => 'Soal Ujian Testing',
            'file_soal'      => 'soal/testing.docx',
            'versi'          => 1,
            'status'         => 'submitted',
            'uploaded_at'    => now(),
        ], $overrides));
    }

    public function test_can_fetch_soal_timeline(): void
    {
        $soal = $this->createTestSoal(['status' => 'submitted']);

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->getJson("/api/soal/{$soal->id}/timeline");

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'status',
                    'status_label',
                    'icon_status',
                    'color',
                    'actor_name',
                    'actor_role',
                    'description',
                    'date',
                    'time',
                ]
            ],
            'success',
            'message'
        ]);
    }

    public function test_can_fetch_revision_history(): void
    {
        $soal = $this->createTestSoal(['status' => 'revisi']);

        $verifier = User::factory()->create();

        Verification::create([
            'soal_id'     => $soal->id,
            'verifier_id' => $verifier->id,
            'status'      => 'revisi',
            'catatan'     => 'Nomor 5 belum sesuai CLO.',
            'verified_at' => now(),
        ]);

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->getJson("/api/questions/{$soal->id}/revision-history");

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'revision',
                    'status',
                    'notes',
                    'version',
                    'verifier_name',
                ]
            ],
            'success',
        ]);
        $response->assertJsonPath('data.0.notes', 'Nomor 5 belum sesuai CLO.');
    }

    public function test_can_fetch_dashboard_upload_progress(): void
    {
        $this->createTestSoal(['status' => 'approved']);

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->getJson('/api/dashboard/upload-progress');

        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'course_id',
                    'course',
                    'status',
                    'progress',
                    'deadline',
                    'days_remaining',
                    'is_critical_deadline',
                ]
            ],
            'success',
        ]);
    }
}
