<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plo', function (Blueprint $table) {
            // Tambah periode_id setelah prodi_id
            $table->foreignId('periode_id')
                ->nullable()
                ->after('prodi_id')
                ->constrained('periode')
                ->nullOnDelete()
                ->comment('Periode di mana PLO ini berlaku');

            // Drop unique constraint lama, ganti dengan yang baru
            $table->dropUnique('plo_unique_kode_prodi');
            $table->unique(['kode', 'prodi_id', 'periode_id'], 'plo_kode_prodi_periode_unique');
        });
    }

    public function down(): void
    {
        Schema::table('plo', function (Blueprint $table) {
            $table->dropUnique('plo_kode_prodi_periode_unique');
            $table->dropForeign(['periode_id']);
            $table->dropColumn('periode_id');

            // Restore unique constraint lama
            $table->unique(['kode', 'prodi_id'], 'plo_unique_kode_prodi');
        });
    }
};
