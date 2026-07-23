<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PloController;
use App\Http\Controllers\Api\CloController;
use App\Http\Controllers\Api\PeriodeController;
use App\Http\Controllers\Api\KategoriController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\SoalController;
use App\Http\Controllers\Api\DosenController;
use App\Http\Controllers\Api\PenugasanController;
use App\Http\Controllers\Api\VerifikasiController;
use App\Http\Controllers\Api\BeritaAcaraController;
use App\Http\Controllers\Api\BroadcastController;
use App\Http\Controllers\Api\NotifikasiController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Berikut adalah daftar routes API untuk Sistem Verifikasi Soal.
| Semua request API menggunakan middleware auth:sanctum kecuali login.
|
*/

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // PLO & CLO
    Route::apiResource('plo', PloController::class);
    Route::apiResource('clo', CloController::class);

    // Program Studi & Courses helper
    Route::get('/program-studi', function () {
        return response()->json([
            'success' => true,
            'data' => \App\Models\ProgramStudi::orderBy('nama_prodi')->get()
        ]);
    });
    Route::get('/courses', function (Illuminate\Http\Request $request) {
        $prodiId = $request->query('prodi_id');
        $query = \App\Models\Course::query();
        if ($prodiId) {
            $query->where('prodi_id', $prodiId);
        }
        return response()->json([
            'success' => true,
            'data' => $query->orderBy('nama_mk')->get()
        ]);
    });

    // Periode
    Route::get('/periode', [PeriodeController::class, 'index']);
    Route::get('/periode/{id}', [PeriodeController::class, 'show']);
    Route::post('/periode', [PeriodeController::class, 'store'])->middleware('coordinator');
    Route::put('/periode/{id}', [PeriodeController::class, 'update'])->middleware('coordinator');
    Route::delete('/periode/{id}', [PeriodeController::class, 'destroy'])->middleware('coordinator');
    Route::patch('/periode/{id}/activate', [PeriodeController::class, 'activate'])->middleware('coordinator');

    // Kategori & Template
    Route::get('/kategori', [KategoriController::class, 'index']);
    Route::get('/kategori/{id}', [KategoriController::class, 'show']);
    Route::post('/kategori', [KategoriController::class, 'store'])->middleware('coordinator');
    Route::put('/kategori/{id}', [KategoriController::class, 'update'])->middleware('coordinator');
    Route::delete('/kategori/{id}', [KategoriController::class, 'destroy'])->middleware('coordinator');

    Route::get('/templates', [TemplateController::class, 'index']);
    Route::post('/templates', [TemplateController::class, 'store'])->middleware('coordinator');
    Route::delete('/templates/{id}', [TemplateController::class, 'destroy'])->middleware('coordinator');

    // Soal
    Route::apiResource('soal', SoalController::class);

    // Penugasan PIC
    Route::get('/penugasan', [PenugasanController::class, 'index']);
    Route::post('/penugasan', [PenugasanController::class, 'store'])->middleware('coordinator');
    Route::delete('/penugasan/{id}', [PenugasanController::class, 'destroy'])->middleware('coordinator');
    Route::get('/dosen/search', [DosenController::class, 'search'])->middleware('coordinator');

    // Verifikasi
    Route::get('/verifikasi/tugas-saya', [VerifikasiController::class, 'tugasSaya'])->middleware('pic_periode');
    Route::post('/soal/{soal}/verifikasi', [VerifikasiController::class, 'submit'])->middleware('pic_periode');
    Route::get('/soal/{soal}/verifikasi/history', [VerifikasiController::class, 'history']);

    // Berita Acara
    Route::get('/berita-acara', [BeritaAcaraController::class, 'index']);
    Route::post('/berita-acara/generate', [BeritaAcaraController::class, 'generate'])->middleware('coordinator');
    Route::get('/berita-acara/{id}/print', [BeritaAcaraController::class, 'print']);

    // Broadcast
    Route::get('/broadcast', [BroadcastController::class, 'index']);
    Route::post('/broadcast', [BroadcastController::class, 'store'])->middleware('coordinator');
    Route::patch('/broadcast/{id}/publish', [BroadcastController::class, 'publish'])->middleware('coordinator');
    Route::get('/broadcast/feed', [BroadcastController::class, 'feed']);

    // Notifikasi
    Route::get('/notifikasi', [NotifikasiController::class, 'index']);
    Route::patch('/notifikasi/{id}/read', [NotifikasiController::class, 'read']);
    Route::patch('/notifikasi/read-all', [NotifikasiController::class, 'readAll']);

    // Dashboard
    Route::get('/dashboard/coordinator', [DashboardController::class, 'superAdmin'])->middleware('coordinator');
    Route::get('/dashboard/dosen', [DashboardController::class, 'dosen']);
    Route::get('/dashboard/pic', [DashboardController::class, 'pic'])->middleware('pic_periode');
});
