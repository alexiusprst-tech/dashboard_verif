<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('soal', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('dosen_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('mata_kuliah_id')
                ->constrained('courses')
                ->cascadeOnDelete();
            $table->foreignId('clo_id')
                ->constrained('clo')
                ->cascadeOnDelete();
            $table->foreignId('periode_id')
                ->constrained('periode')
                ->cascadeOnDelete();
            // kategori diambil relasional lewat template_id -> templates.kategori_id
            $table->foreignId('template_id')
                ->nullable()
                ->constrained('templates')
                ->nullOnDelete();
            $table->string('judul_soal', 255);
            $table->text('file_soal');
            $table->unsignedInteger('versi')->default(1);
            $table->enum('status', [
                'draft', 'submitted', 'in_review', 'revisi', 'approved', 'rejected',
            ])->default('draft');
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['periode_id', 'status']);
            $table->index(['dosen_id', 'periode_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('soal');
    }
};
