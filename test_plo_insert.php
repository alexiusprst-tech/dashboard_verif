<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Plo;
use App\Models\ProgramStudi;

echo "=== Test insert PLO tanpa nama_plo ===\n";

$prodi = ProgramStudi::first();
if (!$prodi) {
    echo "GAGAL: Tidak ada data program studi\n";
    exit(1);
}

try {
    $plo = Plo::create([
        'kode'     => 'PLO-TEST-' . time(),
        'deskripsi'=> 'Test PLO tanpa nama_plo',
        'prodi_id' => $prodi->id,
        'created_by'=> null,
    ]);
    echo "BERHASIL: PLO berhasil dibuat dengan ID {$plo->id}\n";
    echo "kode: {$plo->kode}\n";
    echo "nama_plo: " . ($plo->nama_plo ?? '(null - OK)') . "\n";
    echo "deskripsi: {$plo->deskripsi}\n";

    // Cleanup
    $plo->delete();
    echo "Cleanup: PLO test dihapus\n";
} catch (\Exception $e) {
    echo "GAGAL: " . $e->getMessage() . "\n";
}
