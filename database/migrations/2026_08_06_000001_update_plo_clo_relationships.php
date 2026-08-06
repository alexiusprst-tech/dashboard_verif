<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create course_clo pivot table if not exists
        if (!Schema::hasTable('course_clo')) {
            Schema::create('course_clo', function (Blueprint $table) {
                $table->id();
                $table->foreignId('course_id')
                    ->constrained('courses')
                    ->cascadeOnDelete();
                $table->foreignId('clo_id')
                    ->constrained('clo')
                    ->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['course_id', 'clo_id'], 'course_clo_unique');
            });
        }

        // 2. Migrate existing clo.mata_kuliah_id relations to course_clo pivot table if column exists
        if (Schema::hasColumn('clo', 'mata_kuliah_id')) {
            $existingRows = DB::table('clo')
                ->whereNotNull('mata_kuliah_id')
                ->get(['id as clo_id', 'mata_kuliah_id as course_id']);

            $now = now();
            foreach ($existingRows as $row) {
                DB::table('course_clo')->insertOrIgnore([
                    'course_id' => $row->course_id,
                    'clo_id' => $row->clo_id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // 3. Drop mata_kuliah_id from plo table
        Schema::table('plo', function (Blueprint $table) {
            if (Schema::hasColumn('plo', 'mata_kuliah_id')) {
                $table->dropForeign(['mata_kuliah_id']);
                $table->dropColumn('mata_kuliah_id');
            }
        });

        // 4. Drop mata_kuliah_id from clo table
        if (Schema::hasColumn('clo', 'mata_kuliah_id')) {
            // Drop any index referencing mata_kuliah_id before dropping the column
            // Use raw SQL to drop index only if it exists (SQLite-safe)
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
                // Ignore if index/constraint does not exist
            }

            Schema::table('clo', function (Blueprint $table) {
                try {
                    $table->dropForeign(['mata_kuliah_id']);
                } catch (\Throwable $e) {
                    // Ignore if foreign key constraint has another name
                }
                $table->dropColumn('mata_kuliah_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('clo', function (Blueprint $table) {
            if (!Schema::hasColumn('clo', 'mata_kuliah_id')) {
                $table->foreignId('mata_kuliah_id')
                    ->nullable()
                    ->constrained('courses')
                    ->nullOnDelete();
            }
        });

        Schema::table('plo', function (Blueprint $table) {
            if (!Schema::hasColumn('plo', 'mata_kuliah_id')) {
                $table->foreignId('mata_kuliah_id')
                    ->nullable()
                    ->constrained('courses')
                    ->nullOnDelete();
            }
        });

        Schema::dropIfExists('course_clo');
    }
};
