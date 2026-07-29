<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'tipe_dosen')) {
                $table->enum('tipe_dosen', ['biasa', 'lb'])
                    ->default('biasa')
                    ->after('is_coordinator')
                    ->comment('biasa = dosen tetap, lb = luar biasa (terikat semester)');
            }

            if (! Schema::hasColumn('users', 'semester_lb')) {
                $table->enum('semester_lb', ['ganjil', 'genap'])
                    ->nullable()
                    ->after('tipe_dosen')
                    ->comment('Hanya diisi jika tipe_dosen = lb. Menentukan semester kapan LB aktif.');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['tipe_dosen', 'semester_lb']);
        });
    }
};
