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
                ->cascadeOnDelete();
            $table->foreignId('mata_kuliah_id')
                ->constrained('courses')
                ->cascadeOnDelete();
            $table->foreignId('periode_id')
                ->constrained('periode')
                ->cascadeOnDelete();
            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('Super Admin yang membuat pemetaan');
            $table->timestamps();

            $table->unique(
                ['dosen_id', 'mata_kuliah_id', 'periode_id'],
                'dosen_mk_unique_mapping'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dosen_mata_kuliah');
    }
};
