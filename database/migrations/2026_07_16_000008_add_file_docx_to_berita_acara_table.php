<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('berita_acara', function (Blueprint $table) {
            $table->text('file_docx')->nullable()->after('file_pdf');
        });
    }

    public function down(): void
    {
        Schema::table('berita_acara', function (Blueprint $table) {
            $table->dropColumn('file_docx');
        });
    }
};
