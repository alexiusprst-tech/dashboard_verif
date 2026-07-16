<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dosen_mata_kuliah', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dosen_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('Dosen yang mengampu');
            $table->foreignId('mata_kuliah_id')
                ->constrained('courses')
                ->cascadeOnDelete()
                ->comment('Mata kuliah yang diampu');
            $table->foreignId('periode_id')
                ->constrained('periode')
                ->cascadeOnDelete()
                ->comment('Periode di mana pemetaan ini berlaku');
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Super Admin yang membuat pemetaan');
            $table->timestamps();

            // Satu dosen tidak bisa diampu dua kali untuk matkul yang sama di periode yang sama
            $table->unique(
                ['dosen_id', 'mata_kuliah_id', 'periode_id'],
                'dosen_mk_unique_per_periode'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dosen_mata_kuliah');
    }
};
