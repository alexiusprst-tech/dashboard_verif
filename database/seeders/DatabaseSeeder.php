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

        $if = ProgramStudi::firstOrCreate(
            ['kode_prodi' => 'IF'],
            ['nama_prodi' => 'Teknik Informatika']
        );

        $si = ProgramStudi::firstOrCreate(
            ['kode_prodi' => 'SI'],
            ['nama_prodi' => 'Sistem Informasi']
        );

        // 2. Users
        /*
        |--------------------------------------------------------------------------
        | USER
        |--------------------------------------------------------------------------
        */

        // Super Admin
        User::updateOrCreate(
            ['kode_dosen' => 'ADM001'],
            [
                'uuid' => (string) Str::uuid(),
                'nama_lengkap' => 'Administrator Utama',
                'email' => 'admin@telkomuniversity.ac.id',
                'password' => Hash::make('password'),
                'prodi_id' => $if->id,
                'is_super_admin' => true,
                'is_coordinator' => false,
                'status_aktif' => true,
            ]
        );

        // Coordinator
        User::updateOrCreate(
            ['kode_dosen' => 'KOR001'],
            [
                'uuid' => (string) Str::uuid(),
                'nama_lengkap' => 'Koordinator Program Studi',
                'email' => 'coordinator@telkomuniversity.ac.id',
                'password' => Hash::make('password'),
                'prodi_id' => $if->id,
                'is_super_admin' => false,
                'is_coordinator' => true,
                'status_aktif' => true,
            ]
        );

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
            User::updateOrCreate(
                ['kode_dosen' => $dosen['kode']],
                [
                    'uuid' => (string) Str::uuid(),
                    'nama_lengkap' => $dosen['nama'],
                    'email' => $dosen['email'],
                    'password' => Hash::make('password'),
                    'prodi_id' => $if->id,
                    'is_super_admin' => false,
                    'is_coordinator' => false,
                    'status_aktif' => true,
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | MATA KULIAH
        |--------------------------------------------------------------------------
        */

        Course::firstOrCreate(
            ['kode_mk' => 'IF2113'],
            ['nama_mk' => 'Dasar Pemrograman', 'prodi_id' => $if->id, 'sks' => 3]
        );

        Course::firstOrCreate(
            ['kode_mk' => 'IF2243'],
            ['nama_mk' => 'Rekayasa Perangkat Lunak', 'prodi_id' => $if->id, 'sks' => 3]
        );

        /*
        |--------------------------------------------------------------------------
        | PERIODE
        |--------------------------------------------------------------------------
        */

        Periode::firstOrCreate(
            ['nama_periode' => 'UTS Ganjil 2025/2026'],
            [
                'semester' => 'ganjil',
                'tahun_akademik' => '2025/2026',
                'tanggal_mulai' => now()->toDateString(),
                'tanggal_deadline' => now()->addMonth()->toDateString(),
                'status' => PeriodeStatus::Aktif->value,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | KATEGORI SOAL
        |--------------------------------------------------------------------------
        */

        $uts = Category::firstOrCreate(
            ['nama_kategori' => 'UTS'],
            ['deskripsi' => 'Ujian Tengah Semester']
        );

        $uas = Category::firstOrCreate(
            ['nama_kategori' => 'UAS'],
            ['deskripsi' => 'Ujian Akhir Semester']
        );

        /*
        |--------------------------------------------------------------------------
        | TEMPLATE SOAL
        |--------------------------------------------------------------------------
        */

        Template::firstOrCreate(
            ['nama_file' => 'Template_UTS_2025.docx'],
            [
                'nama_template' => 'Template UTS 2025',
                'kategori_id' => $uts->id,
                'category_id' => $uts->id,
                'file_path' => 'templates/Template_UTS_2025.docx',
                'versi' => '1.0',
                'is_active' => true,
            ]
        );

        Template::firstOrCreate(
            ['nama_file' => 'Template_UAS_2025.docx'],
            [
                'nama_template' => 'Template UAS 2025',
                'kategori_id' => $uas->id,
                'category_id' => $uas->id,
                'file_path' => 'templates/Template_UAS_2025.docx',
                'versi' => '1.0',
                'is_active' => true,
            ]
        );
    }
}
