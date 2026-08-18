<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Course;
use App\Models\Periode;
use App\Models\ProgramStudi;
use App\Models\Template;
use App\Models\User;
use App\Models\Plo;
use App\Models\Clo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadSoalFormTest extends TestCase
{
    use RefreshDatabase;

    protected User $dosen;
    protected Periode $activePeriode;
    protected Course $course;
    protected Category $kategoriUts;
    protected Template $template;
    protected Clo $clo1;
    protected Clo $clo2;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $prodi = ProgramStudi::create([
            'kode_prodi' => 'IF',
            'nama_prodi' => 'Informatika',
        ]);

        $this->activePeriode = Periode::create([
            'nama_periode'     => 'UTS Ganjil 2026/2027',
            'tahun_akademik'   => '2026/2027',
            'semester'         => 'ganjil',
            'tanggal_mulai'    => now()->subDays(5)->toDateString(),
            'tanggal_deadline' => now()->addDays(20)->toDateString(),
            'status'           => 'aktif',
        ]);

        $this->dosen = User::factory()->create([
            'kode_dosen'     => 'DSN888',
            'nama_lengkap'   => 'Dosen Pengampu S.Kom',
            'prodi_id'       => $prodi->id,
            'is_super_admin' => false,
            'is_coordinator' => false,
            'status_aktif'   => true,
        ]);

        $this->course = Course::create([
            'kode_mk'  => 'IF2113',
            'nama_mk'  => 'Algoritma dan Struktur Data',
            'prodi_id' => $prodi->id,
            'sks'      => 3,
            'semester' => 3,
        ]);

        $this->kategoriUts = Category::create([
            'nama_kategori' => 'UTS',
            'deskripsi'     => 'Ujian Tengah Semester',
        ]);

        $this->template = Template::create([
            'kategori_id'   => $this->kategoriUts->id,
            'nama_file'     => 'Template_UTS.docx',
            'file_path'     => 'templates/Template_UTS.docx',
            'versi'         => 1,
            'is_active'     => true,
        ]);

        $plo = Plo::create([
            'kode'      => 'PLO-1',
            'deskripsi' => 'Kemampuan merancang algoritma',
        ]);

        $this->clo1 = Clo::create([
            'mata_kuliah_id' => $this->course->id,
            'plo_id'         => $plo->id,
            'kode'           => 'CLO 1',
            'deskripsi'      => 'Mahasiswa mampu mengimplementasikan struktur data linier',
        ]);

        $this->clo2 = Clo::create([
            'mata_kuliah_id' => $this->course->id,
            'plo_id'         => $plo->id,
            'kode'           => 'CLO 2',
            'deskripsi'      => 'Mahasiswa mampu menganalisis kompleksitas algoritma',
        ]);
    }

    public function test_dosen_can_upload_soal_via_form_with_active_periode_kategori_and_clos(): void
    {
        $file = UploadedFile::fake()->create('naskah_uts_if2113.pdf', 500, 'application/pdf');

        $payload = [
            'periode_id'     => $this->activePeriode->id,
            'mata_kuliah_id' => $this->course->id,
            'kategori_id'    => $this->kategoriUts->id,
            'clo_ids'        => [$this->clo1->id, $this->clo2->id],
            'judul_soal'     => 'Soal UTS Algoritma dan Struktur Data Kelas IF-46-01',
            'file_soal'      => $file,
        ];

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->postJson('/api/soal', $payload);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('soal', [
            'dosen_id'       => $this->dosen->id,
            'periode_id'     => $this->activePeriode->id,
            'mata_kuliah_id' => $this->course->id,
            'clo_id'         => $this->clo1->id,
            'template_id'    => $this->template->id,
            'judul_soal'     => 'Soal UTS Algoritma dan Struktur Data Kelas IF-46-01',
            'status'         => 'in_review',
            'versi'          => 1,
        ]);
    }

    public function test_dosen_can_upload_soal_via_form_with_word_docx_file(): void
    {
        $file = UploadedFile::fake()->create('naskah_uts_if2113.docx', 800, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $payload = [
            'periode_id'     => $this->activePeriode->id,
            'mata_kuliah_id' => $this->course->id,
            'kategori_id'    => $this->kategoriUts->id,
            'clo_ids'        => [$this->clo1->id],
            'judul_soal'     => 'Soal UTS Format Word Docx',
            'file_soal'      => $file,
        ];

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->postJson('/api/soal', $payload);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('soal', [
            'dosen_id'   => $this->dosen->id,
            'judul_soal' => 'Soal UTS Format Word Docx',
        ]);
    }

    public function test_upload_fails_if_file_is_unsupported_format(): void
    {
        $file = UploadedFile::fake()->create('naskah_uts.jpg', 500, 'image/jpeg');

        $payload = [
            'periode_id'     => $this->activePeriode->id,
            'mata_kuliah_id' => $this->course->id,
            'kategori_id'    => $this->kategoriUts->id,
            'clo_id'         => $this->clo1->id,
            'judul_soal'     => 'Soal Gambar JPG',
            'file_soal'      => $file,
        ];

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->postJson('/api/soal', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file_soal']);
    }

    public function test_upload_fails_if_no_clo_selected(): void
    {
        $file = UploadedFile::fake()->create('naskah.pdf', 500, 'application/pdf');

        $payload = [
            'periode_id'     => $this->activePeriode->id,
            'mata_kuliah_id' => $this->course->id,
            'kategori_id'    => $this->kategoriUts->id,
            'judul_soal'     => 'Soal Tanpa CLO',
            'file_soal'      => $file,
        ];

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->postJson('/api/soal', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['clo_id']);
    }

    public function test_dosen_can_upload_soal_with_multiple_jenis_asesmen_like_quiz_and_uts(): void
    {
        $file = UploadedFile::fake()->create('soal_quiz_uts.pdf', 600, 'application/pdf');

        $payload = [
            'periode_id'     => $this->activePeriode->id,
            'mata_kuliah_id' => $this->course->id,
            'jenis_asesmen'  => ['Quiz', 'UTS'],
            'clo_ids'        => [$this->clo1->id, $this->clo2->id],
            'judul_soal'     => 'Soal Quiz & UTS IF2113',
            'file_soal'      => $file,
        ];

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->postJson('/api/soal', $payload);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('soal', [
            'dosen_id'   => $this->dosen->id,
            'judul_soal' => 'Soal Quiz & UTS IF2113',
            'status'     => 'in_review',
        ]);
    }

    public function test_super_admin_can_activate_and_deactivate_periode(): void
    {
        $admin = User::factory()->create([
            'is_super_admin' => true,
            'status_aktif'   => true,
        ]);

        $periode2 = Periode::create([
            'nama_periode'     => 'Periode Cadangan',
            'tahun_akademik'   => '2026/2027',
            'semester'         => 'genap',
            'tanggal_mulai'    => now()->toDateString(),
            'tanggal_deadline' => now()->addDays(30)->toDateString(),
            'status'           => 'draft',
        ]);

        // Activate
        $resActivate = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/periode/{$periode2->id}/activate");

        $resActivate->assertOk()
            ->assertJsonPath('data.status', 'aktif');

        $periode2->refresh();
        $this->assertEquals('aktif', $periode2->status->value);

        // Deactivate
        $resDeactivate = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/periode/{$periode2->id}/deactivate");

        $resDeactivate->assertOk()
            ->assertJsonPath('data.status', 'selesai');

        $periode2->refresh();
        $this->assertEquals('selesai', $periode2->status->value);
    }

    public function test_dosen_only_sees_own_uploaded_soal(): void
    {
        $otherDosen = User::factory()->create([
            'is_super_admin' => false,
            'is_coordinator' => false,
            'status_aktif'   => true,
        ]);

        // Soal milik $this->dosen
        $soalOwn = \App\Models\Soal::create([
            'uuid'           => \Illuminate\Support\Str::uuid()->toString(),
            'dosen_id'       => $this->dosen->id,
            'periode_id'     => $this->activePeriode->id,
            'mata_kuliah_id' => $this->course->id,
            'template_id'    => $this->template->id,
            'clo_id'         => $this->clo1->id,
            'judul_soal'     => 'Soal Ujian Milik Sendiri',
            'file_soal'      => 'soal/own.docx',
            'status'         => 'in_review',
        ]);

        // Soal milik $otherDosen
        $soalOther = \App\Models\Soal::create([
            'uuid'           => \Illuminate\Support\Str::uuid()->toString(),
            'dosen_id'       => $otherDosen->id,
            'periode_id'     => $this->activePeriode->id,
            'mata_kuliah_id' => $this->course->id,
            'template_id'    => $this->template->id,
            'clo_id'         => $this->clo1->id,
            'judul_soal'     => 'Soal Ujian Milik Dosen Lain',
            'file_soal'      => 'soal/other.docx',
            'status'         => 'in_review',
        ]);

        // Request as $this->dosen
        $response = $this->actingAs($this->dosen, 'sanctum')
            ->getJson("/api/soal?periode_id={$this->activePeriode->id}");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $soalIds = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($soalOwn->id, $soalIds, 'Dosen harus dapat melihat soal yang diunggahnya sendiri');
        $this->assertNotContains($soalOther->id, $soalIds, 'Dosen tidak boleh melihat soal yang diunggah oleh dosen lain');
    }
}
