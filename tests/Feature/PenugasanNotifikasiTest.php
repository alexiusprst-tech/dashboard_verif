<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Notifikasi;
use App\Models\Periode;
use App\Models\ProgramStudi;
use App\Models\User;
use App\Services\PenugasanDosenService;
use App\Services\PenugasanVerifikatorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PenugasanNotifikasiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $verifier;
    protected User $targetDosen;
    protected Periode $periode;
    protected Course $course;

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

        $this->course = Course::create([
            'kode_mk'  => 'IF2113',
            'nama_mk'  => 'Dasar Pemrograman',
            'prodi_id' => $prodi->id,
            'sks'      => 3,
        ]);

        $this->admin = User::factory()->create([
            'kode_dosen'     => 'ADM999',
            'is_super_admin' => true,
            'prodi_id'       => $prodi->id,
        ]);

        $this->verifier = User::factory()->create([
            'kode_dosen'   => 'VER999',
            'nama_lengkap' => 'Dosen Verifikator Utama',
            'prodi_id'     => $prodi->id,
        ]);

        $this->targetDosen = User::factory()->create([
            'kode_dosen'   => 'DSN999',
            'nama_lengkap' => 'Dosen Target Pengampu',
            'prodi_id'     => $prodi->id,
        ]);
    }

    public function test_notification_sent_when_admin_assigns_verifier(): void
    {
        $service = app(PenugasanVerifikatorService::class);
        $service->assign([
            'periode_id' => $this->periode->id,
            'course_id'  => $this->course->id,
            'dosen_id'   => $this->verifier->id,
        ], $this->admin);

        $this->assertDatabaseHas('notifikasi', [
            'user_id' => $this->verifier->id,
            'judul'   => 'Penugasan Dosen Verifikator',
        ]);
    }

    public function test_notification_sent_when_verifier_assigns_target_dosen(): void
    {
        $service = app(PenugasanDosenService::class);
        $service->assign([
            'periode_id'       => $this->periode->id,
            'verifier_id'      => $this->verifier->id,
            'target_dosen_ids' => [$this->targetDosen->id],
        ], $this->admin);

        $this->assertDatabaseHas('notifikasi', [
            'user_id' => $this->targetDosen->id,
            'judul'   => 'Penugasan Dosen Target Verifikasi',
        ]);
    }
}
