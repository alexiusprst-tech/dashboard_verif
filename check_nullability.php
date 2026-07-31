<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== Checking PLO columns ===\n";
$ploCols = DB::select("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name='plo'");
foreach ($ploCols as $c) {
    echo "{$c->column_name} | Nullable: {$c->is_nullable} | Default: {$c->column_default}\n";
}

echo "\n=== Checking CLO columns ===\n";
$cloCols = DB::select("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name='clo'");
foreach ($cloCols as $c) {
    echo "{$c->column_name} | Nullable: {$c->is_nullable} | Default: {$c->column_default}\n";
}
