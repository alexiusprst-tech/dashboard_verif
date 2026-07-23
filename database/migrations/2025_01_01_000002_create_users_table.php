<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('kode_dosen', 30)->unique()->comment('format huruf, contoh: DSN-SI-001');
            $table->string('nama_lengkap', 150);
            $table->string('email', 150)->unique();
            $table->string('password');
            $table->foreignId('prodi_id')
                ->nullable()
                ->constrained('program_studi')
                ->nullOnDelete();
            $table->enum('tipe_dosen', ['biasa', 'lb'])->default('biasa');
            $table->enum('semester_lb', ['ganjil', 'genap'])
                ->nullable()
                ->comment('hanya diisi jika tipe_dosen = lb, menentukan periode jenis apa dosen ini aktif');
            $table->boolean('is_super_admin')->default(false);
            $table->boolean('is_coordinator')->default(false);
            $table->boolean('status_aktif')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
