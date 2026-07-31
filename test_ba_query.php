<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\BeritaAcara;
use App\Models\User;

echo "=== Test query BeritaAcara dengan verifier_id ===\n";

try {
    // Simulasi query seperti yang dilakukan repository
    $result = BeritaAcara::where('periode_id', 1)
        ->where('verifier_id', 5)
        ->paginate(10);
    echo "BERHASIL: Query berhasil, total rows: {$result->total()}\n";
} catch (\Exception $e) {
    echo "GAGAL: " . $e->getMessage() . "\n";
}

echo "\n=== Test query tanpa filter verifier_id ===\n";
try {
    $result = BeritaAcara::paginate(5);
    echo "BERHASIL: Query semua BA, total: {$result->total()}\n";
} catch (\Exception $e) {
    echo "GAGAL: " . $e->getMessage() . "\n";
}
