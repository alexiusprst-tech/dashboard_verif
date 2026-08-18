<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('penugasan_koordinator')) {
            Schema::create('penugasan_koordinator', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')
                    ->constrained('courses')
                    ->cascadeOnDelete()
                    ->comment('Mata kuliah yang dikoordinasikan');
                $table->foreignId('dosen_id')
                    ->constrained('users')
                    ->cascadeOnDelete()
                    ->comment('Dosen yang ditugaskan sebagai Koordinator MK');
                $table->foreignId('periode_id')
                    ->constrained('periode')
                    ->cascadeOnDelete()
                    ->comment('Periode akademik penugasan');
                $table->foreignId('assigned_by')
                    ->constrained('users')
                    ->cascadeOnDelete()
                    ->comment('Super Admin yang melakukan penugasan');
                $table->timestamp('assigned_at')->useCurrent();
                $table->timestamps();

                $table->unique(
                    ['course_id', 'dosen_id', 'periode_id'],
                    'penugasan_koordinator_unique'
                );
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('penugasan_koordinator');
    }
};
