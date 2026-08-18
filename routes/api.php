<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PloController;
use App\Http\Controllers\Api\CloController;
use App\Http\Controllers\Api\PeriodeController;
use App\Http\Controllers\Api\KategoriController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\SoalController;
use App\Http\Controllers\Api\DosenController;
use App\Http\Controllers\Api\PenugasanController;
use App\Http\Controllers\Api\PenugasanDosenController;
use App\Http\Controllers\Api\VerifikasiController;
use App\Http\Controllers\Api\BeritaAcaraController;
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

    // Dev Switch Mode (Testing/Demo)
    Route::post('/dev/switch-mode', [\App\Http\Controllers\Api\DevController::class, 'switchMode']);
    Route::get('/dev/status', [\App\Http\Controllers\Api\DevController::class, 'status']);

    // PLO & CLO
    Route::apiResource('plo', PloController::class)->only(['index', 'show']);
    Route::middleware('koordinator_mk')->group(function () {
        Route::apiResource('plo', PloController::class)->only(['store', 'update', 'destroy']);
        Route::post('/plo/preview-import', [PloController::class, 'previewImport']);
        Route::post('/plo/import', [PloController::class, 'import']);
        Route::get('/plo/export', [PloController::class, 'export']);

        Route::apiResource('clo', CloController::class)->only(['store', 'update', 'destroy']);
        Route::post('/clo/preview-import', [CloController::class, 'previewImport']);
        Route::post('/clo/import', [CloController::class, 'import']);
        Route::get('/clo/export', [CloController::class, 'export']);

        // Curriculum import wizard
        Route::post('/curriculum/preview-import', [\App\Http\Controllers\Api\CurriculumController::class, 'previewImport']);
        Route::post('/curriculum/import-wizard', [\App\Http\Controllers\Api\CurriculumController::class, 'importWizard']);
        Route::get('/curriculum/template/{type}', [\App\Http\Controllers\Api\CurriculumController::class, 'template']);
    });

    Route::apiResource('clo', CloController::class)->only(['index', 'show']);

    // Program Studi & Courses helper
    Route::get('/program-studi', function () {
        return response()->json([
            'success' => true,
            'data' => \App\Models\ProgramStudi::orderBy('nama_prodi')->get()
        ]);
    });
    Route::get('/courses', function (Illuminate\Http\Request $request) {
        $prodiId = $request->query('prodi_id');
        $query = \App\Models\Course::withCount('clo')->with(['clo.plo']);
        if ($prodiId) {
            $query->where('prodi_id', $prodiId);
        }
        return response()->json([
            'success' => true,
            'data' => $query->orderBy('semester')->orderBy('nama_mk')->get()
        ]);
    });

    Route::get('/courses/{id}', function (int $id) {
        $course = \App\Models\Course::withCount('clo')->with(['clo.plo'])->find($id);
        if (!$course) {
            return response()->json(['success' => false, 'message' => 'Mata kuliah tidak ditemukan.'], 404);
        }
        return response()->json(['success' => true, 'data' => $course]);
    });

    // CLO Transfer List — all CLOs with assignment status for a specific course
    Route::get('/courses/{id}/clo', function (int $id) {
        $course = \App\Models\Course::find($id);
        if (!$course) {
            return response()->json(['success' => false, 'message' => 'Mata kuliah tidak ditemukan.'], 404);
        }

        $assignedCloIds = DB::table('course_clo')
            ->where('course_id', $id)
            ->pluck('clo_id')
            ->toArray();

        $allClos = \App\Models\Clo::with(['plo', 'courses'])
            ->orderBy('kode')
            ->get();

        $data = $allClos->map(function ($clo) use ($id, $assignedCloIds) {
            $isAssigned = in_array($clo->id, $assignedCloIds);
            return [
                'id' => $clo->id,
                'kode' => $clo->kode,
                'deskripsi' => $clo->deskripsi,
                'plo_id' => $clo->plo_id,
                'plo' => $clo->plo ? [
                    'id' => $clo->plo->id,
                    'kode' => $clo->plo->kode,
                    'deskripsi' => $clo->plo->deskripsi,
                ] : null,
                'mata_kuliah_id' => $isAssigned ? $id : null,
                'is_assigned' => $isAssigned,
                'courses_count' => $clo->courses->count(),
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    });

    // Bulk assign CLOs to a course (saves transfer list Many-to-Many)
    Route::post('/courses/{id}/clo', function (Illuminate\Http\Request $request, int $id) {
        $course = \App\Models\Course::findOrFail($id);
        $cloIds = $request->input('clo_ids', []);
        $course->clo()->sync($cloIds);
        return response()->json(['success' => true, 'message' => 'CLO berhasil disimpan.']);
    });

    // Periode (Super Admin)
    Route::get('/periode', [PeriodeController::class, 'index']);
    Route::get('/periode/{id}', [PeriodeController::class, 'show']);
    Route::post('/periode', [PeriodeController::class, 'store'])->middleware('super_admin');
    Route::put('/periode/{id}', [PeriodeController::class, 'update'])->middleware('super_admin');
    Route::delete('/periode/{id}', [PeriodeController::class, 'destroy'])->middleware('super_admin');
    Route::patch('/periode/{id}/activate', [PeriodeController::class, 'activate'])->middleware('super_admin');
    Route::patch('/periode/{id}/deactivate', [PeriodeController::class, 'deactivate'])->middleware('super_admin');

    // Kategori & Template (Super Admin)
    Route::get('/kategori', [KategoriController::class, 'index']);
    Route::get('/kategori/{id}', [KategoriController::class, 'show']);
    Route::post('/kategori', [KategoriController::class, 'store'])->middleware('super_admin');
    Route::put('/kategori/{id}', [KategoriController::class, 'update'])->middleware('super_admin');
    Route::delete('/kategori/{id}', [KategoriController::class, 'destroy'])->middleware('super_admin');

    Route::get('/templates', [TemplateController::class, 'index']);
    Route::post('/templates', [TemplateController::class, 'store'])->middleware('super_admin');
    Route::delete('/templates/{id}', [TemplateController::class, 'destroy'])->middleware('super_admin');

    // Template Berita Acara (Super Admin)
    Route::get('/template-ba', [\App\Http\Controllers\Api\TemplateBeritaAcaraController::class, 'index'])->middleware('super_admin');
    Route::get('/template-ba/active', [\App\Http\Controllers\Api\TemplateBeritaAcaraController::class, 'active']);
    Route::post('/template-ba', [\App\Http\Controllers\Api\TemplateBeritaAcaraController::class, 'store'])->middleware('super_admin');
    Route::put('/template-ba/{id}/activate', [\App\Http\Controllers\Api\TemplateBeritaAcaraController::class, 'activate'])->middleware('super_admin');
    Route::delete('/template-ba/{id}', [\App\Http\Controllers\Api\TemplateBeritaAcaraController::class, 'destroy'])->middleware('super_admin');
    Route::get('/template-ba/{id}/download', [\App\Http\Controllers\Api\TemplateBeritaAcaraController::class, 'download'])->middleware('super_admin');

    // Soal
    Route::get('/soal/{id}/timeline', [SoalController::class, 'timeline']);
    Route::get('/soal/{id}/revision-history', [SoalController::class, 'revisionHistory']);
    Route::get('/questions/{id}/revision-history', [SoalController::class, 'revisionHistory']);
    Route::apiResource('soal', SoalController::class);

    // Manajemen Dosen (GET: semua user terautentikasi, POST/PUT/DELETE: super_admin)
    Route::get('/dosen/search', [DosenController::class, 'search']);
    Route::get('/dosen', [DosenController::class, 'index']);
    Route::get('/dosen/{dosen}', [DosenController::class, 'show']);
    Route::post('/dosen', [DosenController::class, 'store'])->middleware('super_admin');
    Route::put('/dosen/{dosen}', [DosenController::class, 'update'])->middleware('super_admin');
    Route::patch('/dosen/{dosen}', [DosenController::class, 'update'])->middleware('super_admin');
    Route::delete('/dosen/{dosen}', [DosenController::class, 'destroy'])->middleware('super_admin');

    // Penugasan Koordinator MK (Super Admin)
    Route::get('/penugasan-koordinator', [\App\Http\Controllers\Api\PenugasanKoordinatorController::class, 'index']);
    Route::post('/penugasan-koordinator', [\App\Http\Controllers\Api\PenugasanKoordinatorController::class, 'store'])->middleware('super_admin');
    Route::delete('/penugasan-koordinator/{id}', [\App\Http\Controllers\Api\PenugasanKoordinatorController::class, 'destroy'])->middleware('super_admin');

    // Penugasan Verifikator (Super Admin)
    Route::get('/penugasan-verifikator', [\App\Http\Controllers\Api\PenugasanVerifikatorController::class, 'index']);
    Route::post('/penugasan-verifikator', [\App\Http\Controllers\Api\PenugasanVerifikatorController::class, 'store'])->middleware('super_admin');
    Route::delete('/penugasan-verifikator/{id}', [\App\Http\Controllers\Api\PenugasanVerifikatorController::class, 'destroy'])->middleware('super_admin');

    // Endpoints penugasan lama untuk backward compatibility
    Route::get('/penugasan', [\App\Http\Controllers\Api\PenugasanVerifikatorController::class, 'index']);
    Route::post('/penugasan', [\App\Http\Controllers\Api\PenugasanVerifikatorController::class, 'store'])->middleware('super_admin');
    Route::delete('/penugasan/{id}', [\App\Http\Controllers\Api\PenugasanVerifikatorController::class, 'destroy'])->middleware('super_admin');
    // Penugasan Dosen Target (PIC / Verifikator / Admin)
    Route::get('/penugasan-dosen', [PenugasanDosenController::class, 'index']);
    Route::post('/penugasan-dosen', [PenugasanDosenController::class, 'store']);
    Route::delete('/penugasan-dosen/{id}', [PenugasanDosenController::class, 'destroy']);

    // Verifikasi (Dosen Verifikator)
    Route::get('/verifikasi/tugas-saya', [VerifikasiController::class, 'tugasSaya'])->middleware('verifikator');
    Route::post('/soal/{soal}/verifikasi', [VerifikasiController::class, 'submit'])->middleware('verifikator');
    Route::get('/soal/{soal}/verifikasi/history', [VerifikasiController::class, 'history']);

    // Berita Acara
    Route::get('/berita-acara', [BeritaAcaraController::class, 'index']);
    Route::post('/berita-acara/generate', [BeritaAcaraController::class, 'generate']);
    Route::get('/berita-acara/{id}/print', [BeritaAcaraController::class, 'print']);
    Route::get('/berita-acara/{id}/download', [BeritaAcaraController::class, 'download']);

    // Notifikasi
    Route::get('/notifikasi', [NotifikasiController::class, 'index']);
    Route::get('/notifikasi/unread-count', [NotifikasiController::class, 'unreadCount']);
    Route::patch('/notifikasi/{id}/read', [NotifikasiController::class, 'read']);
    Route::patch('/notifikasi/read-all', [NotifikasiController::class, 'readAll']);

    // Dashboard
    Route::get('/dashboard/super-admin', [DashboardController::class, 'superAdmin'])->middleware('super_admin');
    Route::get('/dashboard/coordinator', [DashboardController::class, 'superAdmin'])->middleware('super_admin');
    Route::get('/dashboard/dosen', [DashboardController::class, 'dosen']);
    Route::get('/dashboard/upload-progress', [DashboardController::class, 'uploadProgress']);
    Route::get('/dashboard/verifikator', [DashboardController::class, 'pic'])->middleware('verifikator');
    Route::get('/dashboard/pic', [DashboardController::class, 'pic'])->middleware('verifikator');

    // Generator Template Lembar Soal (Dynamic DOCX & PDF)
    Route::get('/lembar-soal/course-structure/{id}', [\App\Http\Controllers\Api\LembarSoalGeneratorController::class, 'getCourseStructure']);
    Route::post('/lembar-soal/download-docx', [\App\Http\Controllers\Api\LembarSoalGeneratorController::class, 'downloadDocx']);
    Route::post('/lembar-soal/download-pdf', [\App\Http\Controllers\Api\LembarSoalGeneratorController::class, 'downloadPdf']);

    // Generator Berita Acara Evaluasi Soal (Dynamic DOCX & PDF)
    Route::get('/berita-acara-evaluasi/initial-data', [\App\Http\Controllers\Api\BeritaAcaraEvaluasiGeneratorController::class, 'getInitialData']);
    Route::post('/berita-acara-evaluasi/download-docx', [\App\Http\Controllers\Api\BeritaAcaraEvaluasiGeneratorController::class, 'downloadDocx']);
    Route::post('/berita-acara-evaluasi/download-pdf', [\App\Http\Controllers\Api\BeritaAcaraEvaluasiGeneratorController::class, 'downloadPdf']);
});
