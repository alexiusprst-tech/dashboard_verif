<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plo', function (Blueprint $table) {
            if (!Schema::hasColumn('plo', 'mata_kuliah_id')) {
                $table->foreignId('mata_kuliah_id')
                    ->nullable()
                    ->after('deskripsi')
                    ->constrained('courses')
                    ->nullOnDelete();
            }
        });

        foreach (['plo_kode_prodi_periode_unique', 'uq_plo', 'plo_unique_kode_prodi'] as $constraint) {
            try {
                DB::statement("ALTER TABLE plo DROP CONSTRAINT IF EXISTS {$constraint}");
            } catch (\Throwable $e) {
                // Ignore constraint drop errors if constraint doesn't exist
            }
        }
    }

    public function down(): void
    {
        Schema::table('plo', function (Blueprint $table) {
            if (Schema::hasColumn('plo', 'mata_kuliah_id')) {
                $table->dropForeign(['mata_kuliah_id']);
                $table->dropColumn('mata_kuliah_id');
            }
        });
    }
};

