<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== Kolom SEBELUM perbaikan ===\n";
$cols = DB::select("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='berita_acara' ORDER BY ordinal_position");
foreach ($cols as $c) echo "  {$c->column_name}\n";

// Strategi: kolom lama (generated_by, tanggal_generate, status) = legacy
// Yang dibutuhkan model: verifier_id, generated_at

// 1. Tambah verifier_id jika belum ada
$hasCols = collect($cols)->pluck('column_name');

if (!$hasCols->contains('verifier_id')) {
    echo "\n>> Menambah kolom verifier_id...\n";
    // Cek generated_by ada tidak, untuk migrasi data
    if ($hasCols->contains('generated_by')) {
        DB::statement('ALTER TABLE berita_acara ADD COLUMN verifier_id BIGINT NULL');
        // Copy data dari generated_by ke verifier_id
        DB::statement('UPDATE berita_acara SET verifier_id = generated_by');
        // Buat NOT NULL jika ada data, atau tetap nullable
        echo "OK: kolom verifier_id ditambahkan dan diisi dari generated_by\n";
    } else {
        DB::statement('ALTER TABLE berita_acara ADD COLUMN verifier_id BIGINT NULL');
        echo "OK: kolom verifier_id ditambahkan (nullable)\n";
    }
} else {
    echo "INFO: verifier_id sudah ada\n";
}

// 2. Tambah generated_at jika belum ada (model menggunakannya)
if (!$hasCols->contains('generated_at')) {
    echo "\n>> Menambah kolom generated_at...\n";
    if ($hasCols->contains('tanggal_generate')) {
        DB::statement('ALTER TABLE berita_acara ADD COLUMN generated_at TIMESTAMP NULL');
        DB::statement('UPDATE berita_acara SET generated_at = tanggal_generate');
        echo "OK: kolom generated_at ditambahkan dan diisi dari tanggal_generate\n";
    } else {
        DB::statement('ALTER TABLE berita_acara ADD COLUMN generated_at TIMESTAMP NULL');
        echo "OK: kolom generated_at ditambahkan (nullable)\n";
    }
} else {
    echo "INFO: generated_at sudah ada\n";
}

// 3. Tambah file_docx jika belum ada (sudah ada dari fix sebelumnya, tapi cek lagi)
if (!$hasCols->contains('file_docx')) {
    echo "\n>> Menambah kolom file_docx...\n";
    DB::statement('ALTER TABLE berita_acara ADD COLUMN file_docx TEXT NULL');
    echo "OK: kolom file_docx ditambahkan\n";
} else {
    echo "INFO: file_docx sudah ada\n";
}

echo "\n=== Kolom SETELAH perbaikan ===\n";
$cols2 = DB::select("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='berita_acara' ORDER BY ordinal_position");
foreach ($cols2 as $c) echo "  {$c->column_name} (nullable: {$c->is_nullable})\n";
