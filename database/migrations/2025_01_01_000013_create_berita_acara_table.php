<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('berita_acara', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_ba', 100)->unique();
            $table->foreignId('periode_id')
                ->constrained('periode')
                ->cascadeOnDelete();
            $table->foreignId('verifier_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->timestamp('generated_at')->nullable();
            $table->text('file_pdf')
                ->nullable()
                ->comment('path PDF hasil generate, dicache agar tidak render ulang tiap print');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('berita_acara');
    }
};
