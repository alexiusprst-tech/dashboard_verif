<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plo', function (Blueprint $table) {
            $table->foreignId('mata_kuliah_id')
                ->nullable()
                ->after('deskripsi')
                ->constrained('courses')
                ->nullOnDelete();

            $table->dropUnique('plo_kode_prodi_periode_unique');
        });
    }

    public function down(): void
    {
        Schema::table('plo', function (Blueprint $table) {
            $table->unique(['kode', 'prodi_id', 'periode_id'], 'plo_kode_prodi_periode_unique');
            $table->dropForeign(['mata_kuliah_id']);
            $table->dropColumn('mata_kuliah_id');
        });
    }
};
