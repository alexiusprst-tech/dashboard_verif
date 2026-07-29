<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Hanya ada satu jenis verifikator (dosen dengan role pic aktif).
        // Tidak ada lagi lapis approval Coordinator terpisah — fitur
        // monitoring yang dulu milik Coordinator sudah melebur jadi
        // bagian dari akses role pic (lihat tabel user_roles).
        Schema::create('verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('soal_id')
                ->constrained('soal')
                ->cascadeOnDelete();
            $table->foreignId('verifier_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('dosen dengan role pic aktif di periode terkait');
            $table->enum('tipe_verifikator', ['pic', 'coordinator'])->default('pic');
            $table->enum('status', ['approved', 'revisi', 'rejected']);
            $table->text('catatan')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['soal_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verifications');
    }
};
