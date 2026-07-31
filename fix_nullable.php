<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Membuat nama_plo dan periode_id nullable di tabel plo ===\n";
DB::statement('ALTER TABLE plo ALTER COLUMN nama_plo DROP NOT NULL');
DB::statement('ALTER TABLE plo ALTER COLUMN periode_id DROP NOT NULL');
echo "OK: plo.nama_plo dan plo.periode_id sekarang nullable\n";

echo "\n=== Membuat nama_clo, periode_id, plo_id nullable di tabel clo ===\n";
DB::statement('ALTER TABLE clo ALTER COLUMN nama_clo DROP NOT NULL');
DB::statement('ALTER TABLE clo ALTER COLUMN periode_id DROP NOT NULL');
echo "OK: clo.nama_clo dan clo.periode_id sekarang nullable\n";

echo "\n=== Verifikasi ulang kolom PLO ===\n";
$ploCols = DB::select("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='plo' ORDER BY ordinal_position");
foreach ($ploCols as $c) {
    echo "{$c->column_name} | Nullable: {$c->is_nullable}\n";
}

echo "\n=== Verifikasi ulang kolom CLO ===\n";
$cloCols = DB::select("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='clo' ORDER BY ordinal_position");
foreach ($cloCols as $c) {
    echo "{$c->column_name} | Nullable: {$c->is_nullable}\n";
}
