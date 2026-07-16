<?php

namespace Database\Seeders;

use App\Enums\PeriodeStatus;
use App\Models\Category;
use App\Models\Course;
use App\Models\Periode;
use App\Models\ProgramStudi;
use App\Models\Template;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ROLE DINAMIS
        |--------------------------------------------------------------------------
        | Hanya PIC yang disimpan pada tabel roles.
        | Super Admin dan Coordinator menggunakan boolean pada tabel users.
        |--------------------------------------------------------------------------
        */

        DB::table('roles')->updateOrInsert(
            ['nama_role' => 'pic'],
            [
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | PROGRAM STUDI
        |--------------------------------------------------------------------------
        */

        $if = ProgramStudi::create([
            'kode_prodi' => 'IF',
            'nama_prodi' => 'Teknik Informatika',
        ]);

        $si = ProgramStudi::create([
            'kode_prodi' => 'SI',
            'nama_prodi' => 'Sistem Informasi',
        ]);

        /*
        |--------------------------------------------------------------------------
        | USER
        |--------------------------------------------------------------------------
        */

        // Super Admin
        User::create([
            'uuid' => (string) Str::uuid(),
            'kode_dosen' => 'ADM001',
            'nama_lengkap' => 'Administrator Utama',
            'email' => 'admin@telkomuniversity.ac.id',
            'password' => Hash::make('password'),
            'prodi_id' => $if->id,
            'is_super_admin' => true,
            'is_coordinator' => false,
            'status_aktif' => true,
        ]);

        // Coordinator
        User::create([
            'uuid' => (string) Str::uuid(),
            'kode_dosen' => 'KOR001',
            'nama_lengkap' => 'Koordinator Program Studi',
            'email' => 'coordinator@telkomuniversity.ac.id',
            'password' => Hash::make('password'),
            'prodi_id' => $if->id,
            'is_super_admin' => false,
            'is_coordinator' => true,
            'status_aktif' => true,
        ]);

        /*
        |--------------------------------------------------------------------------
        | DOSEN
        |--------------------------------------------------------------------------
        */

        $dosenList = [
            ['kode' => 'DSN001', 'nama' => 'Dosen Satu',  'email' => 'dosen1@telkomuniversity.ac.id'],
            ['kode' => 'DSN002', 'nama' => 'Dosen Dua',   'email' => 'dosen2@telkomuniversity.ac.id'],
            ['kode' => 'DSN003', 'nama' => 'Dosen Tiga',  'email' => 'dosen3@telkomuniversity.ac.id'],
            ['kode' => 'DSN004', 'nama' => 'Dosen Empat', 'email' => 'dosen4@telkomuniversity.ac.id'],
            ['kode' => 'DSN005', 'nama' => 'Dosen Lima',  'email' => 'dosen5@telkomuniversity.ac.id'],
        ];

        foreach ($dosenList as $dosen) {
            User::create([
                'uuid' => (string) Str::uuid(),
                'kode_dosen' => $dosen['kode'],
                'nama_lengkap' => $dosen['nama'],
                'email' => $dosen['email'],
                'password' => Hash::make('password'),
                'prodi_id' => $if->id,
                'is_super_admin' => false,
                'is_coordinator' => false,
                'status_aktif' => true,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | MATA KULIAH
        |--------------------------------------------------------------------------
        */

        Course::create([
            'kode_mk' => 'IF2113',
            'nama_mk' => 'Dasar Pemrograman',
            'prodi_id' => $if->id,
        ]);

        Course::create([
            'kode_mk' => 'IF2243',
            'nama_mk' => 'Rekayasa Perangkat Lunak',
            'prodi_id' => $if->id,
        ]);

        /*
        |--------------------------------------------------------------------------
        | PERIODE
        |--------------------------------------------------------------------------
        */

        Periode::create([
            'nama_periode' => 'UTS Ganjil 2025/2026',
            'semester' => 'ganjil',
            'tahun_akademik' => '2025/2026',
            'tanggal_mulai' => now()->toDateString(),
            'tanggal_deadline' => now()->addMonth()->toDateString(),
            'status' => PeriodeStatus::Aktif->value,
        ]);

        /*
        |--------------------------------------------------------------------------
        | KATEGORI SOAL
        |--------------------------------------------------------------------------
        */

        $uts = Category::create([
            'nama_kategori' => 'UTS',
            'deskripsi' => 'Ujian Tengah Semester',
        ]);

        $uas = Category::create([
            'nama_kategori' => 'UAS',
            'deskripsi' => 'Ujian Akhir Semester',
        ]);

        /*
        |--------------------------------------------------------------------------
        | TEMPLATE SOAL
        |--------------------------------------------------------------------------
        */

        Template::create([
            'kategori_id' => $uts->id,
            'nama_file' => 'Template_UTS_2025.docx',
            'file_path' => 'templates/Template_UTS_2025.docx',
            'versi' => '1.0',
            'is_active' => true,
        ]);

        Template::create([
            'kategori_id' => $uas->id,
            'nama_file' => 'Template_UAS_2025.docx',
            'file_path' => 'templates/Template_UAS_2025.docx',
            'versi' => '1.0',
            'is_active' => true,
        ]);
    }
}
