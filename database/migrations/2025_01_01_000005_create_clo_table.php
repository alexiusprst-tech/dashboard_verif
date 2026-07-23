<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clo', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 30);
            $table->text('deskripsi')->nullable();
            $table->foreignId('mata_kuliah_id')
                ->constrained('courses')
                ->cascadeOnDelete();
            $table->foreignId('plo_id')
                ->constrained('plo')
                ->cascadeOnDelete();
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->unique(
                ['kode', 'mata_kuliah_id'],
                'clo_unique_kode_mata_kuliah'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clo');
    }
};
