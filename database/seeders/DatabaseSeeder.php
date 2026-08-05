<?php

namespace Database\Seeders;

use App\Enums\PeriodeStatus;
use App\Models\Category;
use App\Models\Course;
use App\Models\Periode;
use App\Models\ProgramStudi;
use App\Models\Role;
use App\Models\Template;
use App\Models\User;
use App\Models\UserRole;
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
                'prodi_id' => $si->id,
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
                'prodi_id' => $si->id,
                'is_super_admin' => false,
                'is_coordinator' => true,
                'status_aktif' => true,
            ]
        );

        // PIC (Person in Charge / Verifikator)
        User::updateOrCreate(
            ['kode_dosen' => 'PIC001'],
            [
                'uuid' => (string) Str::uuid(),
                'nama_lengkap' => 'PIC Verifikator Soal',
                'email' => 'pic@telkomuniversity.ac.id',
                'password' => Hash::make('password'),
                'prodi_id' => $si->id,
                'is_super_admin' => false,
                'is_coordinator' => false,
                'status_aktif' => true,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | DOSEN
        |--------------------------------------------------------------------------
        | Data dosen nyata di-seed melalui DosenSeeder.
        | Gunakan updateOrCreate berbasis kode_dosen agar aman dijalankan ulang.
        |--------------------------------------------------------------------------
        */

        $this->call(DosenSeeder::class);

        /*
        |--------------------------------------------------------------------------
        | MATA KULIAH
        |--------------------------------------------------------------------------
        */

        $if2113 = Course::firstOrCreate(
            ['kode_mk' => 'IF2113'],
            ['nama_mk' => 'Dasar Pemrograman', 'prodi_id' => $si->id, 'sks' => 3]
        );

        $if2243 = Course::firstOrCreate(
            ['kode_mk' => 'IF2243'],
            ['nama_mk' => 'Rekayasa Perangkat Lunak', 'prodi_id' => $si->id, 'sks' => 3]
        );

        /*
        |--------------------------------------------------------------------------
        | PERIODE
        |--------------------------------------------------------------------------
        */

        $periode = Periode::firstOrCreate(
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
        | PEMETAAN DOSEN MATKUL
        |--------------------------------------------------------------------------
        */

        $admin     = User::where('is_super_admin', true)->first();
        // Ambil dua dosen pertama berdasarkan kode_dosen nyata untuk contoh pemetaan.
        $dosen1User = User::where('kode_dosen', 'QLB')->first();
        $dosen2User = User::where('kode_dosen', 'SHC')->first();

        if ($if2113 && $if2243 && $periode && $admin) {
            if ($dosen1User) {
                DB::table('dosen_mata_kuliah')->updateOrInsert(
                    ['dosen_id' => $dosen1User->id, 'mata_kuliah_id' => $if2113->id, 'periode_id' => $periode->id],
                    ['created_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()]
                );
            }
            if ($dosen2User) {
                DB::table('dosen_mata_kuliah')->updateOrInsert(
                    ['dosen_id' => $dosen2User->id, 'mata_kuliah_id' => $if2243->id, 'periode_id' => $periode->id],
                    ['created_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }

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

        /*
        |--------------------------------------------------------------------------
        | PENUGASAN PIC
        |--------------------------------------------------------------------------
        | Assign PIC khusus (pic@telkomuniversity.ac.id) & Dosen terpilih sebagai PIC.
        | Coordinator TIDAK dimasukkan di sini agar terpisah sepenuhnya.
        |--------------------------------------------------------------------------
        */

        $picRole = Role::where('nama_role', 'pic')->first();

        if ($picRole && $periode && $admin) {
            // Gunakan kode_dosen nyata sebagai referensi PIC.
            $picCandidates = User::whereIn('kode_dosen', [
                'PIC001',
                'QLB',
            ])->get();

            foreach ($picCandidates as $user) {
                UserRole::firstOrCreate(
                    [
                        'user_id'    => $user->id,
                        'role_id'    => $picRole->id,
                        'periode_id' => $periode->id,
                    ],
                    [
                        'assigned_by' => $admin->id,
                        'assigned_at' => now(),
                    ]
                );
            }
        }
    }
}
