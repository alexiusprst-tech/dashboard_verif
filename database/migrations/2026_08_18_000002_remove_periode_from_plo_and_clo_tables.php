<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Remove periode_id from plo table
        if (Schema::hasColumn('plo', 'periode_id')) {
            $driver = DB::getDriverName();
            try {
                if ($driver === 'sqlite') {
                    DB::unprepared('DROP INDEX IF EXISTS "plo_kode_prodi_periode_unique"');
                } elseif ($driver === 'pgsql') {
                    DB::unprepared('ALTER TABLE plo DROP CONSTRAINT IF EXISTS plo_kode_prodi_periode_unique CASCADE');
                } else {
                    DB::unprepared('DROP INDEX IF EXISTS plo_kode_prodi_periode_unique');
                }
            } catch (\Throwable $e) {
                // Ignore if constraint does not exist
            }

            Schema::table('plo', function (Blueprint $table) {
                try {
                    $table->dropForeign(['periode_id']);
                } catch (\Throwable $e) {}

                $table->dropColumn('periode_id');

                // Re-add unique constraint for (kode, prodi_id) if not exists
                try {
                    $table->unique(['kode', 'prodi_id'], 'plo_unique_kode_prodi');
                } catch (\Throwable $e) {}
            });
        }

        // 2. Remove periode_id from clo table
        if (Schema::hasColumn('clo', 'periode_id')) {
            $driver = DB::getDriverName();
            try {
                if ($driver === 'sqlite') {
                    DB::unprepared('DROP INDEX IF EXISTS "clo_kode_mk_periode_unique"');
                } elseif ($driver === 'pgsql') {
                    DB::unprepared('ALTER TABLE clo DROP CONSTRAINT IF EXISTS clo_kode_mk_periode_unique CASCADE');
                } else {
                    DB::unprepared('DROP INDEX IF EXISTS clo_kode_mk_periode_unique');
                }
            } catch (\Throwable $e) {
                // Ignore if constraint does not exist
            }

            Schema::table('clo', function (Blueprint $table) {
                try {
                    $table->dropForeign(['periode_id']);
                } catch (\Throwable $e) {}

                $table->dropColumn('periode_id');

                // Re-add unique constraint for (kode, plo_id) if not exists
                try {
                    $table->unique(['kode', 'plo_id'], 'clo_unique_kode_plo');
                } catch (\Throwable $e) {}
            });
        }
    }

    public function down(): void
    {
        Schema::table('plo', function (Blueprint $table) {
            if (!Schema::hasColumn('plo', 'periode_id')) {
                $table->foreignId('periode_id')
                    ->nullable()
                    ->after('prodi_id')
                    ->constrained('periode')
                    ->nullOnDelete();
            }
        });

        Schema::table('clo', function (Blueprint $table) {
            if (!Schema::hasColumn('clo', 'periode_id')) {
                $table->foreignId('periode_id')
                    ->nullable()
                    ->after('plo_id')
                    ->constrained('periode')
                    ->nullOnDelete();
            }
        });
    }
};
