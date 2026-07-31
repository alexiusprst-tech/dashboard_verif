<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Kolom tabel berita_acara ===\n";
$cols = DB::select("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name='berita_acara' ORDER BY ordinal_position");
foreach ($cols as $c) {
    echo "  {$c->column_name} (nullable: {$c->is_nullable})\n";
}
