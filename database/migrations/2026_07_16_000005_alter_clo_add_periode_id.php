<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clo', function (Blueprint $table) {
            // Tambah periode_id setelah plo_id
            $table->foreignId('periode_id')
                ->nullable()
                ->after('plo_id')
                ->constrained('periode')
                ->nullOnDelete()
                ->comment('Periode di mana CLO ini berlaku');

            // Drop unique constraint lama, ganti dengan yang baru
            $table->dropUnique('clo_unique_kode_mata_kuliah');
            $table->unique(['kode', 'mata_kuliah_id', 'periode_id'], 'clo_kode_mk_periode_unique');
        });
    }

    public function down(): void
    {
        Schema::table('clo', function (Blueprint $table) {
            $table->dropUnique('clo_kode_mk_periode_unique');
            $table->dropForeign(['periode_id']);
            $table->dropColumn('periode_id');

            // Restore unique constraint lama
            $table->unique(['kode', 'mata_kuliah_id'], 'clo_unique_kode_mata_kuliah');
        });
    }
};
