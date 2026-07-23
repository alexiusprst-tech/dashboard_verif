<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Program Studi
        $if = \App\Models\ProgramStudi::create([
            'kode_prodi' => 'IF',
            'nama_prodi' => 'Teknik Informatika',
        ]);
        $si = \App\Models\ProgramStudi::create([
            'kode_prodi' => 'SI',
            'nama_prodi' => 'Sistem Informasi',
        ]);

        // 2. Users
        // Coordinator (previously Super Admin)
        $admin = User::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'kode_dosen' => 'ADM001',
            'nama_lengkap' => 'Koordinator Utama',
            'email' => 'coordinator@telkomuniversity.ac.id',
            'password' => 'password',
            'prodi_id' => $if->id,
            'is_super_admin' => true,
            'is_coordinator' => false,
            'status_aktif' => true,
        ]);

        // Dosen
        $dosenList = [
            ['nama' => 'Dosen Satu', 'email' => 'dosen1@telkomuniversity.ac.id', 'kode' => 'DSN001'],
            ['nama' => 'Dosen Dua', 'email' => 'dosen2@telkomuniversity.ac.id', 'kode' => 'DSN002'],
            ['nama' => 'Dosen Tiga', 'email' => 'dosen3@telkomuniversity.ac.id', 'kode' => 'DSN003'],
            ['nama' => 'Dosen Empat', 'email' => 'dosen4@telkomuniversity.ac.id', 'kode' => 'DSN004'],
            ['nama' => 'Dosen Lima', 'email' => 'dosen5@telkomuniversity.ac.id', 'kode' => 'DSN005'],
        ];

        $createdDosen = [];
        foreach ($dosenList as $d) {
            $createdDosen[] = User::create([
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'kode_dosen' => $d['kode'],
                'nama_lengkap' => $d['nama'],
                'email' => $d['email'],
                'password' => 'password',
                'prodi_id' => $if->id,
                'is_super_admin' => false,
                'is_coordinator' => false,
                'status_aktif' => true,
            ]);
        }

        // 3. Courses (Mata Kuliah)
        $mk1 = \App\Models\Course::create([
            'kode_mk' => 'IF2113',
            'nama_mk' => 'Dasar Pemrograman',
            'prodi_id' => $if->id,
        ]);
        $mk2 = \App\Models\Course::create([
            'kode_mk' => 'IF2243',
            'nama_mk' => 'Rekayasa Perangkat Lunak',
            'prodi_id' => $if->id,
        ]);

        // 4. Periode
        $periode = \App\Models\Periode::create([
            'nama_periode' => 'UTS Ganjil 2025/2026',
            'semester' => '1',
            'tahun_akademik' => '2025/2026',
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_deadline' => now()->addMonth()->toDateString(),
            'status' => \App\Enums\PeriodeStatus::Aktif->value,
        ]);

        // 5. Kategori & Template
        $katUts = \App\Models\Category::create([
            'nama_kategori' => 'UTS',
            'deskripsi' => 'Ujian Tengah Semester',
        ]);
        $katUas = \App\Models\Category::create([
            'nama_kategori' => 'UAS',
            'deskripsi' => 'Ujian Akhir Semester',
        ]);

        \App\Models\Template::create([
            'kategori_id' => $katUts->id,
            'nama_file' => 'Template_UTS_2025.docx',
            'file_path' => 'templates/Template_UTS_2025.docx',
            'versi' => '1.0',
            'is_active' => true,
        ]);

        \App\Models\Template::create([
            'kategori_id' => $katUas->id,
            'nama_file' => 'Template_UAS_2025.docx',
            'file_path' => 'templates/Template_UAS_2025.docx',
            'versi' => '1.0',
            'is_active' => true,
        ]);
    }
}
