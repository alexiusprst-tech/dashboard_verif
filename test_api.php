<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Sanctum\Sanctum;

$user = User::first();
if (!$user) {
    echo "No users found in database" . PHP_EOL;
    exit(1);
}

$logFile = 'api_test_results_get_special.txt';
file_put_contents($logFile, "Acting as User: " . $user->email . "\n\n");

function simulateGet($uri, $queryParams = [], $user = null, $logFile) {
    $request = Request::create($uri, 'GET', $queryParams);
    $request->headers->set('Accept', 'application/json');
    
    if ($user) {
        Sanctum::actingAs($user);
    }
    
    try {
        $response = app()->handle($request);
        $log = "GET {$uri} with params " . json_encode($queryParams) . "\n";
        $log .= "Status: " . $response->getStatusCode() . "\n";
        $log .= "Content: " . $response->getContent() . "\n";
        $log .= "-----------------------------------\n";
        file_put_contents($logFile, $log, FILE_APPEND);
    } catch (\Exception $e) {
        $log = "Exception: " . $e->getMessage() . "\n";
        $log .= "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
        $log .= "-----------------------------------\n";
        file_put_contents($logFile, $log, FILE_APPEND);
    }
}

simulateGet('/api/plo', ['prodi_id' => 'undefined'], $user, $logFile);
simulateGet('/api/plo', ['prodi_id' => 'null'], $user, $logFile);
simulateGet('/api/plo', ['prodi_id' => null], $user, $logFile);
simulateGet('/api/plo', ['prodi_id' => 0], $user, $logFile);

echo "Done!" . PHP_EOL;
