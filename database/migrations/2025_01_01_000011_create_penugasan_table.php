<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penugasan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')
                ->constrained('periode')
                ->cascadeOnDelete();
            $table->foreignId('verifier_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('dosen yang ditugaskan menjadi PIC');
            $table->foreignId('target_dosen_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('dosen yang soalnya diverifikasi');
            $table->foreignId('assigned_by')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('super admin yang melakukan assignment');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamps();

            // Mencegah Super Admin assign PIC yang sama untuk target dosen
            // yang sama, dua kali dalam periode yang sama
            $table->unique(
                ['periode_id', 'verifier_id', 'target_dosen_id'],
                'penugasan_unique_assignment'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penugasan');
    }
};
