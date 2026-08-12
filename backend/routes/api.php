<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\KoordinatorAssignmentController;
use App\Http\Controllers\SoalKategoriController;
use App\Http\Controllers\CourseCloAssignmentController;

/*
|--------------------------------------------------------------------------
| API Routes — Website Verifikator
|--------------------------------------------------------------------------
|
| Source: AGENTS.md Section 9
|
| WAJIB DITUTUP SEBELUM ENDPOINT ASSIGNMENT BARU:
| - /dev/switch-mode → tambahkan middleware super_admin (F-01, CRITICAL)
| - /penugasan-dosen (store/destroy) → tambahkan middleware super_admin (F-02, HIGH)
|
| Architecture: Route → Middleware → FormRequest → Controller → Service → Repository → Model
|
*/

// Authenticated user info
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
|--------------------------------------------------------------------------
| Koordinator Assignment Routes
|--------------------------------------------------------------------------
| Actor: SuperAdmin
| BR-03: Super Admin dapat menunjuk Koordinator.
| BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
*/
Route::middleware(['auth:sanctum'])->group(function () {
    // TODO: Add 'super_admin' middleware after it's created
    Route::get('/koordinator-assignments', [KoordinatorAssignmentController::class, 'index']);
    Route::post('/koordinator-assignments', [KoordinatorAssignmentController::class, 'store']);
    Route::put('/koordinator-assignments/{id}', [KoordinatorAssignmentController::class, 'update']);
});

/*
|--------------------------------------------------------------------------
| Soal Kategori Routes
|--------------------------------------------------------------------------
| Actor: SuperAdmin
| NEEDS CONFIRMATION: Tabel soal_kategori belum terkonfirmasi (AGENTS.md Section 8)
*/
Route::middleware(['auth:sanctum'])->group(function () {
    // TODO: Add 'super_admin' middleware after it's created
    Route::get('/soal-kategori', [SoalKategoriController::class, 'index']);
    Route::post('/soal-kategori', [SoalKategoriController::class, 'store']);
    Route::put('/soal-kategori/{id}', [SoalKategoriController::class, 'update']);
    Route::delete('/soal-kategori/{id}', [SoalKategoriController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| Course-CLO Assignment Routes
|--------------------------------------------------------------------------
| Actor: SuperAdmin
| Replaces closure route (audit finding C-01)
| Endpoint URL NOT changed (AGENTS.md Section 9)
*/
Route::middleware(['auth:sanctum'])->group(function () {
    // TODO: Add 'super_admin' middleware after it's created
    Route::post('/courses/{courseId}/clo', [CourseCloAssignmentController::class, 'store']);
});
