<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Dosen dengan entry role "pic" di tabel ini mendapat SEMUA fitur PIC
        // (verifikasi soal) + fitur yang dulu disebut "Coordinator" (monitoring
        // progres verifikasi). Dosen tanpa entry di sini untuk periode aktif
        // hanya mendapat fitur dosen biasa.
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->foreignId('role_id')
                ->constrained('roles')
                ->cascadeOnDelete();
            $table->foreignId('periode_id')
                ->constrained('periode')
                ->cascadeOnDelete();
            $table->foreignId('assigned_by')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('Super Admin yang melakukan assignment');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'role_id', 'periode_id'], 'user_roles_unique_assignment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_roles');
    }
};
