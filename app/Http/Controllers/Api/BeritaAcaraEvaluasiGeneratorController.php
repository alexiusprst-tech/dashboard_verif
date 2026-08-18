<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BeritaAcaraEvaluasiGeneratorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BeritaAcaraEvaluasiGeneratorController extends Controller
{
    protected BeritaAcaraEvaluasiGeneratorService $generatorService;

    public function __construct(BeritaAcaraEvaluasiGeneratorService $generatorService)
    {
        $this->generatorService = $generatorService;
    }

    /**
     * Get initial autofill data for the generator form.
     */
    public function getInitialData(Request $request): JsonResponse
    {
        $courseId = $request->query('mata_kuliah_id') ? (int)$request->query('mata_kuliah_id') : null;
        $periodeId = $request->query('periode_id') ? (int)$request->query('periode_id') : null;

        $data = $this->generatorService->getDefaultInitialData($courseId, $periodeId, $request->user());

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /**
     * Download generated PDF document on-the-fly.
     */
    public function downloadPdf(Request $request)
    {
        $input = $request->all();
        $pdf = $this->generatorService->generatePdf($input);

        $kodeMk = preg_replace('/[^A-Za-z0-9_\-]/', '_', $input['kode_mata_kuliah'] ?? 'MK');
        $fileName = 'Berita_Acara_Evaluasi_' . $kodeMk . '_' . date('Ymd_His') . '.pdf';

        return $pdf->stream($fileName);
    }

    /**
     * Download generated DOCX document on-the-fly.
     */
    public function downloadDocx(Request $request): BinaryFileResponse
    {
        $input = $request->all();
        $filePath = $this->generatorService->generateDocx($input);

        $kodeMk = preg_replace('/[^A-Za-z0-9_\-]/', '_', $input['kode_mata_kuliah'] ?? 'MK');
        $fileName = 'Berita_Acara_Evaluasi_' . $kodeMk . '_' . date('Ymd_His') . '.docx';

        return response()->download($filePath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ])->deleteFileAfterSend(true);
    }
}
