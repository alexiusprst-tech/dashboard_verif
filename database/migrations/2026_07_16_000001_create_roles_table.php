<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('nama_role', 50)->unique()
                ->comment('Nama role dinamis: pic, dsb.');
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });

        // Seed role awal: pic
        DB::table('roles')->insert([
            'nama_role'  => 'pic',
            'deskripsi'  => 'Peer Internal Checker — memverifikasi soal dalam satu periode',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
