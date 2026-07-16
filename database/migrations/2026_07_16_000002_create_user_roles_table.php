<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('Dosen yang diberi role');
            $table->foreignId('role_id')
                ->constrained('roles')
                ->cascadeOnDelete()
                ->comment('Role yang diberikan (e.g. pic)');
            $table->foreignId('periode_id')
                ->constrained('periode')
                ->cascadeOnDelete()
                ->comment('Periode di mana role ini berlaku');
            $table->foreignId('assigned_by')
                ->constrained('users')
                ->cascadeOnDelete()
                ->comment('Super Admin yang melakukan assignment');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamps();

            // Satu user hanya bisa punya satu role yang sama dalam satu periode
            $table->unique(
                ['user_id', 'role_id', 'periode_id'],
                'user_roles_unique_assignment'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_roles');
    }
};
