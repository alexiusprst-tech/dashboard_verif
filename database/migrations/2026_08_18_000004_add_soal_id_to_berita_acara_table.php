<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('berita_acara', function (Blueprint $table) {
            $table->foreignId('soal_id')
                ->nullable()
                ->after('nomor_ba')
                ->constrained('soal')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('berita_acara', function (Blueprint $table) {
            $table->dropForeign(['soal_id']);
            $table->dropColumn('soal_id');
        });
    }
};
