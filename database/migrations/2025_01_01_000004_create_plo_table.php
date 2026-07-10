<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plo', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30);
            $table->text('deskripsi')->nullable();
            $table->foreignId('prodi_id')
                ->nullable()
                ->constrained('program_studi')
                ->nullOnDelete();
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->unique(['kode', 'prodi_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plo');
    }
};
