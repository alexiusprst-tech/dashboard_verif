<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('verifications', function (Blueprint $table) {
            if (!Schema::hasColumn('verifications', 'catatan_clo')) {
                $table->json('catatan_clo')->nullable()->after('catatan');
            }
        });
    }

    public function down(): void
    {
        Schema::table('verifications', function (Blueprint $table) {
            if (Schema::hasColumn('verifications', 'catatan_clo')) {
                $table->dropColumn('catatan_clo');
            }
        });
    }
};
