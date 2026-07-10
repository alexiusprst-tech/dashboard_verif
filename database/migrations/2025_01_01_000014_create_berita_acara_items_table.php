<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel snapshot: dibuat SEKALI saat berita_acara digenerate.
        // status_snapshot & catatan_snapshot adalah salinan data pada
        // saat itu, sehingga BA yang sudah dicetak tidak ikut berubah
        // meskipun soal terkait direvisi lagi setelahnya.
        Schema::create('berita_acara_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('berita_acara_id')
                ->constrained('berita_acara')
                ->cascadeOnDelete();
            $table->foreignId('soal_id')
                ->constrained('soal')
                ->cascadeOnDelete();
            $table->foreignId('verification_id')
                ->constrained('verifications')
                ->cascadeOnDelete();
            $table->enum('status_snapshot', ['approved', 'revisi', 'rejected']);
            $table->text('catatan_snapshot')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('berita_acara_items');
    }
};
