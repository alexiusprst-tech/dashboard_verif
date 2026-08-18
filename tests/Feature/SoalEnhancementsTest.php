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
        $clo = \App\Models\Clo::firstOrCreate(
            ['kode' => 'CLO-1', 'plo_id' => $plo->id],
            [
                'mata_kuliah_id' => $this->course->id,
                'deskripsi'      => 'CLO 1',
            ]
        );

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

    public function test_verifikator_only_sees_assigned_courses_in_dashboard_upload_progress(): void
    {
        $verifier = User::factory()->create([
            'is_super_admin' => false,
            'is_coordinator' => false,
            'status_aktif'   => true,
        ]);

        $courseAssigned = Course::create([
            'kode_mk'  => 'ASSIGN1',
            'nama_mk'  => 'Mata Kuliah Ditugaskan',
            'prodi_id' => $this->course->prodi_id,
            'sks'      => 3,
            'semester' => 3,
            'kategori' => 'wajib',
        ]);

        $courseOther = Course::create([
            'kode_mk'  => 'OTHER1',
            'nama_mk'  => 'Mata Kuliah Lainnya',
            'prodi_id' => $this->course->prodi_id,
            'sks'      => 3,
            'semester' => 3,
            'kategori' => 'wajib',
        ]);

        // Assign $courseAssigned to $verifier
        \App\Models\PenugasanVerifikator::create([
            'course_id'   => $courseAssigned->id,
            'dosen_id'    => $verifier->id,
            'periode_id'  => $this->activePeriode->id,
            'assigned_by' => $verifier->id,
            'assigned_at' => now(),
        ]);

        $response = $this->actingAs($verifier, 'sanctum')
            ->getJson("/api/dashboard/upload-progress?periode_id={$this->activePeriode->id}&role=verifikator");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $courseIds = collect($response->json('data'))->pluck('course_id')->all();

        $this->assertContains($courseAssigned->id, $courseIds, 'Verifikator harus melihat mata kuliah yang ditugaskan');
        $this->assertNotContains($courseOther->id, $courseIds, 'Verifikator tidak boleh melihat mata kuliah yang tidak ditugaskan');
    }

    public function test_can_submit_verification_with_per_clo_notes(): void
    {
        $soal = $this->createTestSoal(['status' => 'submitted']);

        $verifier = User::factory()->create([
            'is_super_admin' => true,
        ]);

        $payload = [
            'status' => 'revisi',
            'tipe_verifikator' => 'pic',
            'catatan' => 'Perlu revisi pada beberapa butir soal.',
            'catatan_clo' => [
                [
                    'clo_id' => $soal->clo_id,
                    'kode' => 'CLO-1',
                    'deskripsi' => 'CLO 1 deskripsi',
                    'catatan' => 'Pertanyaan nomor 3 rubriknya belum jelas.',
                    'status' => 'revisi',
                ],
            ],
        ];

        $response = $this->actingAs($verifier, 'sanctum')
            ->postJson("/api/soal/{$soal->id}/verifikasi", $payload);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'revisi')
            ->assertJsonPath('data.catatan', 'Perlu revisi pada beberapa butir soal.')
            ->assertJsonPath('data.catatan_clo.0.kode', 'CLO-1')
            ->assertJsonPath('data.catatan_clo.0.catatan', 'Pertanyaan nomor 3 rubriknya belum jelas.');

        $historyResponse = $this->actingAs($this->dosen, 'sanctum')
            ->getJson("/api/soal/{$soal->id}/revision-history");

        $historyResponse->assertOk()
            ->assertJsonPath('data.0.catatan_clo.0.kode', 'CLO-1')
            ->assertJsonPath('data.0.catatan_clo.0.catatan', 'Pertanyaan nomor 3 rubriknya belum jelas.');
    }

    public function test_automatic_berita_acara_generated_per_verified_soal(): void
    {
        $soal1 = $this->createTestSoal(['status' => 'submitted', 'judul_soal' => 'Soal UTS APB']);
        $soal2 = $this->createTestSoal(['status' => 'submitted', 'judul_soal' => 'Soal UAS APB']);

        $verifier = User::factory()->create([
            'is_super_admin' => true,
            'nama_lengkap'   => 'Dr. Verifikator Test, M.Kom.',
        ]);

        // Verifikasi Soal 1
        $this->actingAs($verifier, 'sanctum')
            ->postJson("/api/soal/{$soal1->id}/verifikasi", [
                'status'           => 'approved',
                'tipe_verifikator' => 'pic',
                'catatan'          => 'Soal 1 sangat baik dan sesuai CLO.',
                'catatan_clo'      => [
                    [
                        'kode'      => 'CLO1',
                        'deskripsi' => 'Analisis proses',
                        'catatan'   => 'Sesuai dengan rubrik',
                        'status'    => 'sesuai',
                    ]
                ],
            ])->assertCreated();

        // Verifikasi Soal 2
        $this->actingAs($verifier, 'sanctum')
            ->postJson("/api/soal/{$soal2->id}/verifikasi", [
                'status'           => 'revisi',
                'tipe_verifikator' => 'pic',
                'catatan'          => 'Soal 2 perlu perbaikan pada butir soal 2.',
                'catatan_clo'      => [
                    [
                        'kode'        => 'CLO2',
                        'deskripsi'   => 'Desain proses',
                        'catatan'     => 'Perbaiki rubrik penilaian',
                        'rekomendasi' => 'Tambahkan studi kasus riil',
                        'status'      => 'revisi',
                    ]
                ],
            ])->assertCreated();

        $verif2 = \App\Models\Verification::where('soal_id', $soal2->id)->first();
        $this->assertNotNull($verif2);
        $this->assertEquals('Tambahkan studi kasus riil', $verif2->catatan_clo[0]['rekomendasi']);

        // Verifikasi Berita Acara dibuat otomatis untuk masing-masing soal
        $ba1 = \App\Models\BeritaAcara::where('soal_id', $soal1->id)->first();
        $ba2 = \App\Models\BeritaAcara::where('soal_id', $soal2->id)->first();

        $this->assertNotNull($ba1, 'Berita Acara untuk Soal 1 harus terbuat otomatis.');
        $this->assertNotNull($ba2, 'Berita Acara untuk Soal 2 harus terbuat otomatis.');

        $this->assertNotEquals($ba1->id, $ba2->id, 'Masing-masing soal harus memiliki Berita Acara yang berbeda.');
        $this->assertNotNull($ba1->file_pdf);
        $this->assertNotNull($ba2->file_pdf);

        // Periksa endpoint /api/berita-acara mengembalikan data per-soal
        $baListResponse = $this->actingAs($verifier, 'sanctum')
            ->getJson("/api/berita-acara?periode_id={$soal1->periode_id}");

        $baListResponse->assertOk()
            ->assertJsonPath('success', true);

        $data = $baListResponse->json('data');
        $this->assertGreaterThanOrEqual(2, count($data));
    }
}
