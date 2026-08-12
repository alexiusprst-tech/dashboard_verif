<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\Semester;
use App\Models\Plo;
use App\Models\Clo;
use App\Models\SoalKategori;
use App\Models\KoordinatorAssignment;
use App\Models\PenugasanVerifikator;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Users
        $superadmin = User::firstOrCreate(['email' => 'superadmin@verifikator.com'], [
            'name' => 'Super Admin',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
        ]);

        $koordinator = User::firstOrCreate(['email' => 'koordinator@verifikator.com'], [
            'name' => 'Koordinator Dosen',
            'password' => Hash::make('password'),
            'role' => 'koordinator',
        ]);

        $verifikator = User::firstOrCreate(['email' => 'verifikator@verifikator.com'], [
            'name' => 'Verifikator Dosen',
            'password' => Hash::make('password'),
            'role' => 'verifikator',
        ]);

        // 2. Semester Aktif
        $semester = Semester::firstOrCreate(['name' => 'Ganjil 2026/2027'], [
            'is_active' => true,
        ]);

        // 3. Mata Kuliah
        $course = Course::firstOrCreate(['code' => 'IS101'], [
            'name' => 'Sistem Informasi Dasar',
        ]);

        // 4. PLO & CLO
        $plo = Plo::firstOrCreate(['code' => 'PLO-1'], [
            'description' => 'Mampu menganalisis masalah IS.',
        ]);

        $clo = Clo::firstOrCreate(['code' => 'CLO-1', 'course_id' => $course->id], [
            'plo_id' => $plo->id,
            'description' => 'Memahami konsep dasar.',
        ]);

        // 5. Assignment Koordinator (Course + Semester + Koordinator)
        KoordinatorAssignment::firstOrCreate([
            'course_id' => $course->id,
            'semester_id' => $semester->id,
        ], [
            'user_id' => $koordinator->id,
            'assigned_by' => $superadmin->id,
        ]);

        // 6. Assignment Verifikator
        PenugasanVerifikator::firstOrCreate([
            'course_id' => $course->id,
            'user_id' => $verifikator->id,
        ], [
            'assigned_by' => $superadmin->id,
        ]);

        // 7. Kategori Soal
        SoalKategori::firstOrCreate(['name' => 'Ujian Tengah Semester']);
        SoalKategori::firstOrCreate(['name' => 'Ujian Akhir Semester']);
    }
}
