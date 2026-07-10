<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Semua request web diteruskan ke Blade shell React SPA.
| Routing halaman sepenuhnya dihandle oleh React Router di sisi client.
| API routes ada di routes/api.php (diproteksi Sanctum).
|--------------------------------------------------------------------------
*/

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
