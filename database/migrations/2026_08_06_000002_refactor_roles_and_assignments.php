<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Refactor: Ganti konsep Coordinator+PIC dengan Koordinator MK + Verifikator.
 *
 * Perubahan:
 * 1. Tambah kolom is_koordinator_mk ke tabel users.
 * 2. Buat tabel penugasan_verifikator (per mata kuliah, bukan per dosen target).
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah kolom is_koordinator_mk ke users (menggantikan is_coordinator)
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_koordinator_mk')) {
                $table->boolean('is_koordinator_mk')
                    ->default(false)
                    ->after('is_coordinator')
                    ->comment('Dosen Koordinator Mata Kuliah — bisa upload soal & lihat status verifikasi');
            }
        });

        // 2. Migrasi data: is_coordinator → is_koordinator_mk
        DB::statement('UPDATE users SET is_koordinator_mk = is_coordinator WHERE is_coordinator = TRUE');

        // 3. Buat tabel penugasan_verifikator (Super Admin menentukan verifikator per mata kuliah)
        if (!Schema::hasTable('penugasan_verifikator')) {
            Schema::create('penugasan_verifikator', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')
                    ->constrained('courses')
                    ->cascadeOnDelete()
                    ->comment('Mata kuliah yang diverifikasi');
                $table->foreignId('dosen_id')
                    ->constrained('users')
                    ->cascadeOnDelete()
                    ->comment('Dosen yang ditugaskan sebagai verifikator');
                $table->foreignId('periode_id')
                    ->constrained('periode')
                    ->cascadeOnDelete()
                    ->comment('Periode verifikasi berlaku');
                $table->foreignId('assigned_by')
                    ->constrained('users')
                    ->cascadeOnDelete()
                    ->comment('Super Admin yang melakukan penugasan');
                $table->timestamp('assigned_at')->useCurrent();
                $table->timestamps();

                $table->unique(
                    ['course_id', 'dosen_id', 'periode_id'],
                    'penugasan_verifikator_unique'
                );
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('penugasan_verifikator');

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_koordinator_mk')) {
                $table->dropColumn('is_koordinator_mk');
            }
        });
    }
};
