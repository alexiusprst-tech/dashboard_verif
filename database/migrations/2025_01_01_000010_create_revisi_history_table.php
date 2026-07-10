<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('revisi_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('soal_id')
                ->constrained('soal')
                ->cascadeOnDelete();
            $table->unsignedInteger('versi');
            $table->text('file_soal');
            $table->text('catatan_verifikator')->nullable();
            $table->foreignId('uploaded_by')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('revisi_history');
    }
};
