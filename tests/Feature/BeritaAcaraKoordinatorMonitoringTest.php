<?php

namespace Tests\Feature;

use App\Models\BeritaAcara;
use App\Models\Course;
use App\Models\PenugasanKoordinator;
use App\Models\PenugasanVerifikator;
use App\Models\Periode;
use App\Models\Soal;
use App\Models\User;
use App\Enums\PeriodeStatus;
use App\Enums\SoalStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BeritaAcaraKoordinatorMonitoringTest extends TestCase
{
    use RefreshDatabase;

    protected Periode $periode;
    protected Course $courseA;
    protected Course $courseB;
    protected User $superAdmin;
    protected User $koordinator;
    protected User $verifierA;
    protected User $verifierB;
    protected User $dosenOther;

    protected function setUp(): void
    {
        parent::setUp();

        $prodi = \App\Models\ProgramStudi::create([
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

        $this->courseA = Course::create([
            'kode_mk'  => 'IF101',
            'nama_mk'  => 'Pemrograman Dasar',
            'prodi_id' => $prodi->id,
            'sks'      => 3,
            'semester' => 1,
        ]);

        $this->courseB = Course::create([
            'kode_mk'  => 'IF202',
            'nama_mk'  => 'Struktur Data',
            'prodi_id' => $prodi->id,
            'sks'      => 3,
            'semester' => 2,
        ]);

        $this->superAdmin = User::factory()->create([
            'is_super_admin' => true,
            'email' => 'superadmin@telkomuniversity.ac.id',
        ]);

        $this->koordinator = User::factory()->create([
            'is_super_admin' => false,
            'email' => 'koordinator@telkomuniversity.ac.id',
        ]);

        $this->verifierA = User::factory()->create([
            'is_super_admin' => false,
            'email' => 'verifierA@telkomuniversity.ac.id',
        ]);

        $this->verifierB = User::factory()->create([
            'is_super_admin' => false,
            'email' => 'verifierB@telkomuniversity.ac.id',
        ]);

        $this->dosenOther = User::factory()->create([
            'is_super_admin' => false,
            'email' => 'dosenother@telkomuniversity.ac.id',
        ]);

        // Assign koordinator to courseA
        PenugasanKoordinator::create([
            'course_id'   => $this->courseA->id,
            'dosen_id'    => $this->koordinator->id,
            'periode_id'  => $this->periode->id,
            'assigned_by' => $this->superAdmin->id,
            'assigned_at' => now(),
        ]);

        // Assign verifierA to courseA
        PenugasanVerifikator::create([
            'course_id'   => $this->courseA->id,
            'dosen_id'    => $this->verifierA->id,
            'periode_id'  => $this->periode->id,
            'assigned_by' => $this->superAdmin->id,
            'assigned_at' => now(),
        ]);

        // Assign verifierB to courseB
        PenugasanVerifikator::create([
            'course_id'   => $this->courseB->id,
            'dosen_id'    => $this->verifierB->id,
            'periode_id'  => $this->periode->id,
            'assigned_by' => $this->superAdmin->id,
            'assigned_at' => now(),
        ]);
    }

    protected function createTestSoal(array $attributes): Soal
    {
        $category = \App\Models\Category::firstOrCreate(['nama_kategori' => 'UTS'], ['deskripsi' => 'UTS']);
        $template = \App\Models\Template::firstOrCreate(['nama_template' => 'Default'], [
            'kategori_id' => $category->id,
            'nama_file'   => 'default.docx',
            'file_path'   => 'templates/default.docx',
            'is_active'   => true,
        ]);

        $courseId = $attributes['mata_kuliah_id'] ?? $this->courseA->id;
        $plo = \App\Models\Plo::firstOrCreate(['kode' => 'PLO-1'], ['deskripsi' => 'PLO 1']);
        $clo = \App\Models\Clo::firstOrCreate(
            ['kode' => 'CLO-1-' . $courseId, 'plo_id' => $plo->id],
            ['deskripsi' => 'CLO Test']
        );

        return Soal::create(array_merge([
            'uuid'           => \Illuminate\Support\Str::uuid()->toString(),
            'dosen_id'       => $this->dosenOther->id,
            'periode_id'     => $this->periode->id,
            'mata_kuliah_id' => $courseId,
            'template_id'    => $template->id,
            'clo_id'         => $clo->id,
            'judul_soal'     => 'Soal Ujian Test',
            'file_soal'      => 'soal/test.docx',
            'status'         => SoalStatus::Approved,
        ], $attributes));
    }

    public function test_koordinator_mk_can_view_own_ba_and_verifier_ba_for_same_course(): void
    {
        // 1. Soal & BA for Course A (verified by Verifier A)
        $soalA = $this->createTestSoal([
            'mata_kuliah_id' => $this->courseA->id,
            'periode_id'     => $this->periode->id,
            'dosen_id'        => $this->dosenOther->id,
        ]);
        $baA = BeritaAcara::create([
            'nomor_ba'     => 'BA/2026/001',
            'soal_id'      => $soalA->id,
            'periode_id'   => $this->periode->id,
            'verifier_id'  => $this->verifierA->id,
            'generated_at' => now(),
            'file_pdf'     => 'berita_acara_pdf/ba1.pdf',
        ]);

        // 2. Soal & BA for Course B (verified by Verifier B) - NOT coordinated by $this->koordinator
        $soalB = $this->createTestSoal([
            'mata_kuliah_id' => $this->courseB->id,
            'periode_id'     => $this->periode->id,
            'dosen_id'        => $this->dosenOther->id,
        ]);
        $baB = BeritaAcara::create([
            'nomor_ba'     => 'BA/2026/002',
            'soal_id'      => $soalB->id,
            'periode_id'   => $this->periode->id,
            'verifier_id'  => $this->verifierB->id,
            'generated_at' => now(),
            'file_pdf'     => 'berita_acara_pdf/ba2.pdf',
        ]);

        // 3. Soal & BA where Koordinator is the lecturer (own soal)
        $soalKoordinator = $this->createTestSoal([
            'mata_kuliah_id' => $this->courseB->id,
            'periode_id'     => $this->periode->id,
            'dosen_id'        => $this->koordinator->id,
        ]);
        $baOwn = BeritaAcara::create([
            'nomor_ba'     => 'BA/2026/003',
            'soal_id'      => $soalKoordinator->id,
            'periode_id'   => $this->periode->id,
            'verifier_id'  => $this->verifierB->id,
            'generated_at' => now(),
            'file_pdf'     => 'berita_acara_pdf/ba3.pdf',
        ]);

        // Request as Koordinator
        $response = $this->actingAs($this->koordinator, 'sanctum')
            ->getJson("/api/berita-acara?periode_id={$this->periode->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $baIds = collect($response->json('data'))->pluck('id')->all();

        // Koordinator should see baA (course A verifier) and baOwn (own soal)
        $this->assertContains($baA->id, $baIds, 'Koordinator MK harus dapat melihat Berita Acara verifikator mata kuliahnya');
        $this->assertContains($baOwn->id, $baIds, 'Koordinator MK harus dapat melihat Berita Acara soal miliknya sendiri');

        // Koordinator should NOT see baB (course B where they are not coordinator and not owner)
        $this->assertNotContains($baB->id, $baIds, 'Koordinator MK tidak boleh melihat Berita Acara mata kuliah lain yang bukan koordinasinya');
    }

    public function test_superadmin_can_view_all_berita_acara(): void
    {
        $soalA = $this->createTestSoal([
            'mata_kuliah_id' => $this->courseA->id,
            'periode_id'     => $this->periode->id,
        ]);
        $baA = BeritaAcara::create([
            'nomor_ba'     => 'BA/2026/001',
            'soal_id'      => $soalA->id,
            'periode_id'   => $this->periode->id,
            'verifier_id'  => $this->verifierA->id,
            'generated_at' => now(),
        ]);

        $soalB = $this->createTestSoal([
            'mata_kuliah_id' => $this->courseB->id,
            'periode_id'     => $this->periode->id,
        ]);
        $baB = BeritaAcara::create([
            'nomor_ba'     => 'BA/2026/002',
            'soal_id'      => $soalB->id,
            'periode_id'   => $this->periode->id,
            'verifier_id'  => $this->verifierB->id,
            'generated_at' => now(),
        ]);

        $response = $this->actingAs($this->superAdmin, 'sanctum')
            ->getJson("/api/berita-acara?periode_id={$this->periode->id}");

        $response->assertOk();
        $baIds = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($baA->id, $baIds);
        $this->assertContains($baB->id, $baIds);
    }

    public function test_koordinator_can_filter_by_verifier(): void
    {
        $soalA = $this->createTestSoal([
            'mata_kuliah_id' => $this->courseA->id,
            'periode_id'     => $this->periode->id,
            'dosen_id'        => $this->dosenOther->id,
        ]);
        $baA = BeritaAcara::create([
            'nomor_ba'     => 'BA/2026/001',
            'soal_id'      => $soalA->id,
            'periode_id'   => $this->periode->id,
            'verifier_id'  => $this->verifierA->id,
            'generated_at' => now(),
        ]);

        $response = $this->actingAs($this->koordinator, 'sanctum')
            ->getJson("/api/berita-acara?periode_id={$this->periode->id}&verifier_id={$this->verifierA->id}");

        $response->assertOk();
        $baIds = collect($response->json('data'))->pluck('id')->all();
        $this->assertContains($baA->id, $baIds);

        // Filter by verifierB (who has no BA for courseA)
        $responseB = $this->actingAs($this->koordinator, 'sanctum')
            ->getJson("/api/berita-acara?periode_id={$this->periode->id}&verifier_id={$this->verifierB->id}");

        $responseB->assertOk();
        $baIdsB = collect($responseB->json('data'))->pluck('id')->all();
        $this->assertNotContains($baA->id, $baIdsB);
    }

    public function test_regular_dosen_cannot_view_other_courses_ba(): void
    {
        $soalA = $this->createTestSoal([
            'mata_kuliah_id' => $this->courseA->id,
            'periode_id'     => $this->periode->id,
            'dosen_id'        => $this->koordinator->id,
        ]);
        $baA = BeritaAcara::create([
            'nomor_ba'     => 'BA/2026/001',
            'soal_id'      => $soalA->id,
            'periode_id'   => $this->periode->id,
            'verifier_id'  => $this->verifierA->id,
            'generated_at' => now(),
        ]);

        // Dosen other (neither verifier nor owner nor coordinator)
        $response = $this->actingAs($this->dosenOther, 'sanctum')
            ->getJson("/api/berita-acara?periode_id={$this->periode->id}");

        $response->assertOk();
        $baIds = collect($response->json('data'))->pluck('id')->all();
        $this->assertNotContains($baA->id, $baIds);
    }
}
