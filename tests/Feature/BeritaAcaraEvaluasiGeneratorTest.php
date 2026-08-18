<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Periode;
use App\Models\ProgramStudi;
use App\Models\Plo;
use App\Models\Clo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BeritaAcaraEvaluasiGeneratorTest extends TestCase
{
    use RefreshDatabase;

    protected User $dosen;
    protected Periode $activePeriode;
    protected Course $course;
    protected Clo $clo1;
    protected Clo $clo2;

    protected function setUp(): void
    {
        parent::setUp();

        $prodi = ProgramStudi::create([
            'kode_prodi' => 'SI',
            'nama_prodi' => 'S1 Sistem Informasi',
        ]);

        $this->activePeriode = Periode::create([
            'nama_periode'     => 'Semester Ganjil 2026/2027',
            'tahun_akademik'   => '2026/2027',
            'semester'         => 'ganjil',
            'tanggal_mulai'    => now()->subDays(10),
            'tanggal_deadline' => now()->addDays(20),
            'status'           => 'aktif',
        ]);

        $this->dosen = User::factory()->create([
            'nama_lengkap'   => 'Dr. Alexius Prast, M.Kom.',
            'kode_dosen'     => 'APR',
            'prodi_id'       => $prodi->id,
            'is_super_admin' => false,
            'is_coordinator' => true,
            'status_aktif'   => true,
        ]);

        $this->course = Course::create([
            'kode_mk'  => 'SI101',
            'nama_mk'  => 'Analisis Proses Bisnis',
            'prodi_id' => $prodi->id,
            'sks'      => 3,
        ]);

        $plo = Plo::create([
            'kode'      => 'PLO-1',
            'deskripsi' => 'Mampu menganalisis proses bisnis sistem informasi',
        ]);

        $this->clo1 = Clo::create([
            'kode'           => 'CLO1',
            'deskripsi'      => 'Menganalisis diagram alur proses bisnis',
            'plo_id'         => $plo->id,
            'mata_kuliah_id' => $this->course->id,
        ]);

        $this->clo2 = Clo::create([
            'kode'           => 'CLO2',
            'deskripsi'      => 'Merancang perbaikan proses bisnis sistem',
            'plo_id'         => $plo->id,
            'mata_kuliah_id' => $this->course->id,
        ]);
    }

    public function test_can_fetch_initial_data_for_generator(): void
    {
        $response = $this->actingAs($this->dosen, 'sanctum')
            ->getJson("/api/berita-acara-evaluasi/initial-data?mata_kuliah_id={$this->course->id}&periode_id={$this->activePeriode->id}");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'form_no',
                    'no_dokumen',
                    'no_revisi',
                    'berlaku',
                    'semester_tahun_akademik',
                    'fakultas',
                    'nama_evaluator',
                    'kode_dosen',
                    'program_studi',
                    'kode_mata_kuliah',
                    'nama_mata_kuliah',
                    'dosen_koordinator',
                    'evaluasi' => [
                        '*' => [
                            'bentuk_asesmen',
                            'clo',
                            'no_soal',
                            'catatan_evaluasi',
                            'rekomendasi',
                        ]
                    ],
                    'kota',
                    'tanggal',
                    'ttd' => [
                        'evaluator_soal',
                        'dosen_koordinator',
                        'ka_prodi',
                    ]
                ]
            ]);

        $response->assertJsonPath('data.kode_mata_kuliah', 'SI101');
        $response->assertJsonPath('data.nama_evaluator', 'Dr. Alexius Prast, M.Kom.');
    }

    public function test_can_download_docx_berita_acara_evaluasi_on_the_fly(): void
    {
        $payload = [
            'form_no'                 => '100-S1SI-001-R1',
            'semester_tahun_akademik' => 'Ganjil 2026/2027',
            'fakultas'                => 'Rekayasa Industri',
            'nama_evaluator'          => 'Dr. Alexius Prast, M.Kom.',
            'kode_dosen'              => 'APR',
            'program_studi'           => 'S1 Sistem Informasi',
            'kode_mata_kuliah'        => 'SI101',
            'nama_mata_kuliah'        => 'Analisis Proses Bisnis',
            'program_studi_mk'        => 'S1 Sistem Informasi',
            'dosen_koordinator'       => 'Dr. Dosen Koordinator, M.Kom.',
            'evaluasi'                => [
                [
                    'bentuk_asesmen'   => 'QUIZ-1',
                    'clo'              => 'CLO1',
                    'no_soal'          => '1',
                    'catatan_evaluasi' => 'Sesuai',
                    'rekomendasi'      => '-',
                ],
                [
                    'bentuk_asesmen'   => 'UTS',
                    'clo'              => 'CLO2',
                    'no_soal'          => '1-3',
                    'catatan_evaluasi' => 'Perlu perbaikan',
                    'rekomendasi'      => 'Perjelas indikator soal kasus',
                ],
            ],
            'kota'                    => 'Bandung',
            'tanggal'                 => '18 Agustus 2026',
            'ttd'                     => [
                'evaluator_soal'    => 'Dr. Alexius Prast, M.Kom.',
                'dosen_koordinator' => 'Dr. Dosen Koordinator, M.Kom.',
                'ka_prodi'          => 'Dr. Hubbul Walidain, S.Kom., M.T.',
            ],
        ];

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->postJson('/api/berita-acara-evaluasi/download-docx', $payload);

        $response->assertOk();
        $this->assertEquals(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            $response->headers->get('Content-Type')
        );
    }

    public function test_can_download_pdf_berita_acara_evaluasi_on_the_fly(): void
    {
        $payload = [
            'form_no'                 => '100-S1SI-001-R1',
            'semester_tahun_akademik' => 'Ganjil 2026/2027',
            'fakultas'                => 'Rekayasa Industri',
            'nama_evaluator'          => 'Dr. Alexius Prast, M.Kom.',
            'kode_dosen'              => 'APR',
            'program_studi'           => 'S1 Sistem Informasi',
            'kode_mata_kuliah'        => 'SI101',
            'nama_mata_kuliah'        => 'Analisis Proses Bisnis',
            'dosen_koordinator'       => 'Dr. Dosen Koordinator, M.Kom.',
            'evaluasi'                => [
                [
                    'bentuk_asesmen'   => 'UTS',
                    'clo'              => 'CLO1',
                    'no_soal'          => '1',
                    'catatan_evaluasi' => 'Sesuai',
                    'rekomendasi'      => '-',
                ],
            ],
            'kota'                    => 'Bandung',
            'tanggal'                 => '18 Agustus 2026',
            'ttd'                     => [
                'evaluator_soal'    => 'Dr. Alexius Prast, M.Kom.',
                'dosen_koordinator' => 'Dr. Dosen Koordinator, M.Kom.',
                'ka_prodi'          => 'Dr. Hubbul Walidain, S.Kom., M.T.',
            ],
        ];

        $response = $this->actingAs($this->dosen, 'sanctum')
            ->postJson('/api/berita-acara-evaluasi/download-pdf', $payload);

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('Content-Type'));
    }
}
