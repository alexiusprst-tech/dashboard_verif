<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('soal_id')
                ->constrained('soal')
                ->cascadeOnDelete();
            $table->foreignId('verifier_id')
                ->constrained('users')
                ->cascadeOnDelete();
            // Membedakan verifikasi oleh PIC vs Coordinator dalam satu tabel
            $table->enum('tipe_verifikator', ['pic', 'coordinator'])->default('pic');
            $table->enum('status', ['approved', 'revisi', 'rejected']);
            $table->text('catatan')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['soal_id', 'tipe_verifikator']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verifications');
    }
};
