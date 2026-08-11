<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel koordinator_assignments — Assignment Koordinator per Semester/Periode.
 *
 * Business Rules:
 * - BR-02: Koordinator dapat berubah setiap semester.
 * - BR-03: Super Admin dapat menunjuk Koordinator.
 * - BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
 *
 * Menggantikan pendekatan boolean is_koordinator_mk pada tabel users
 * dengan assignment dinamis per periode.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('koordinator_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('Dosen yang ditunjuk sebagai Koordinator');
            $table->foreignId('periode_id')
                ->constrained('periode')
                ->cascadeOnDelete()
                ->comment('Periode/semester assignment');
            $table->foreignId('assigned_by')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('Super Admin yang melakukan penugasan');
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();

            // Satu user hanya satu assignment Koordinator per periode
            $table->unique(
                ['user_id', 'periode_id'],
                'koordinator_assignment_unique'
            );

            $table->index('periode_id', 'koordinator_assignment_periode_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('koordinator_assignments');
    }
};
