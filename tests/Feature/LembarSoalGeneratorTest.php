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

class LembarSoalGeneratorTest extends TestCase
{
    use RefreshDatabase;

    protected User $dosen;
    protected ProgramStudi $prodi;
    protected Course $course;
    protected Plo $plo1;
    protected Plo $plo2;
    protected Clo $clo1;
    protected Clo $clo2;
    protected Clo $clo3;

    protected function setUp(): void
    {
        parent::setUp();

        $this->prodi = ProgramStudi::create([
            'nama_prodi' => 'S1 Sistem Informasi',
            'kode_prodi' => 'SI',
        ]);

        $this->dosen = User::factory()->create([
            'nama_lengkap' => 'Dr. Budi Santoso, M.Kom.',
            'kode_dosen'   => 'D001',
            'prodi_id'     => $this->prodi->id,
            'status_aktif' => true,
        ]);

        Periode::create([
            'nama_periode'    => 'Semester Ganjil 2026/2027',
            'tahun_ajaran'    => '2026/2027',
            'semester'        => 'ganjil',
            'status'          => 'aktif',
            'tanggal_mulai'   => '2026-08-01',
            'tanggal_selesai' => '2027-01-31',
            'tanggal_deadline'=> '2026-10-31',
        ]);

        $this->course = Course::create([
            'kode_mk'  => 'IS1234',
            'nama_mk'  => 'Sistem Informasi Enterprise',
            'sks'      => 3,
            'prodi_id' => $this->prodi->id,
        ]);

        $this->plo1 = Plo::create([
            'kode'      => 'PLO1',
            'deskripsi' => 'Mampu menganalisis dan merancang arsitektur enterprise',
            'prodi_id'  => $this->prodi->id,
        ]);

        $this->plo2 = Plo::create([
            'kode'      => 'PLO2',
            'deskripsi' => 'Mampu mengevaluasi tata kelola sistem',
            'prodi_id'  => $this->prodi->id,
        ]);

        $this->clo1 = Clo::create([
            'kode'      => 'CLO1',
            'deskripsi' => 'Mampu menjelaskan model bisnis',
            'plo_id'    => $this->plo1->id,
        ]);
        $this->clo1->courses()->attach($this->course->id);

        $this->clo2 = Clo::create([
            'kode'      => 'CLO2',
            'deskripsi' => 'Mampu memodelkan proses bisnis BPMN',
            'plo_id'    => $this->plo1->id,
        ]);
        $this->clo2->courses()->attach($this->course->id);

        $this->clo3 = Clo::create([
            'kode'      => 'CLO3',
            'deskripsi' => 'Mampu menyusun mitigasi risiko IT',
            'plo_id'    => $this->plo2->id,
        ]);
        $this->clo3->courses()->attach($this->course->id);
    }

    public function test_can_fetch_course_structure_for_generator(): void
    {
        $response = $this->actingAs($this->dosen, 'sanctum')
            ->getJson("/api/lembar-soal/course-structure/{$this->course->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.course.kode_mk', 'IS1234')
            ->assertJsonPath('data.kode_dosen', 'D001');

        $ploStructure = $response->json('data.plo_structure');
        $this->assertCount(2, $ploStructure);
        $this->assertEquals('PLO1', $ploStructure[0]['kode']);
        $this->assertCount(2, $ploStructure[0]['clo']);
        $this->assertEquals('PLO2', $ploStructure[1]['kode']);
        $this->assertCount(1, $ploStructure[1]['clo']);
    }

    public function test_can_download_docx_lembar_soal_on_the_fly(): void
    {
        $payload = [
            'nama_evaluasi'    => 'Ujian Tengah Semester (UTS)',
            'kode_nama_mk'     => 'IS1234 / Sistem Informasi Enterprise',
            'kode_dosen'       => 'D001',
            'tipe_ujian'       => 'UTS',
            'tanggal_evaluasi' => '18 Agustus 2026',
            'tipe_soal'        => 'Closed Book / Essay',
            'petunjuk_pengerjaan' => [
                'Bacalah setiap soal dengan teliti.',
                'Jawablah pertanyaan pada lembar jawaban yang tersedia.',
            ],
            'plo' => [
                [
                    'kode' => 'PLO1',
                    'deskripsi' => 'Mampu menganalisis dan merancang arsitektur enterprise',
                    'clo' => [
                        [
                            'kode' => 'CLO1',
                            'deskripsi' => 'Mampu menjelaskan model bisnis',
                            'bobot_lo' => '20%',
                        ],
                        [
                            'kode' => 'CLO2',
                            'deskripsi' => 'Mampu memodelkan proses bisnis BPMN',
                            'bobot_lo' => '30%',
                        ],
                    ],
                ],
                [
                    'kode' => 'PLO2',
                    'deskripsi' => 'Mampu mengevaluasi tata kelola sistem',
                    'clo' => [
                        [
                            'kode' => 'CLO3',
                            'deskripsi' => 'Mampu menyusun mitigasi risiko IT',
                            'bobot_lo' => '50%',
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->postJson('/api/lembar-soal/download-docx', $payload);

        $response->assertOk();
        $this->assertStringContainsString('application/vnd.openxmlformats-officedocument.wordprocessingml.document', $response->headers->get('content-type'));
    }

    public function test_can_download_pdf_lembar_soal_on_the_fly(): void
    {
        $payload = [
            'nama_evaluasi'    => 'Ujian Tengah Semester (UTS)',
            'kode_nama_mk'     => 'IS1234 / Sistem Informasi Enterprise',
            'kode_dosen'       => 'D001',
            'tipe_ujian'       => 'UTS',
            'tanggal_evaluasi' => '18 Agustus 2026',
            'tipe_soal'        => 'Closed Book / Essay',
            'petunjuk_pengerjaan' => [
                'Bacalah setiap soal dengan teliti.',
            ],
            'plo' => [
                [
                    'kode' => 'PLO1',
                    'deskripsi' => 'Mampu menganalisis dan merancang arsitektur enterprise',
                    'clo' => [
                        [
                            'kode' => 'CLO1',
                            'deskripsi' => 'Mampu menjelaskan model bisnis',
                            'bobot_lo' => '100%',
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->postJson('/api/lembar-soal/download-pdf', $payload);

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
    }
}
