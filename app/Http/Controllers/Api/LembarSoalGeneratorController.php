<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Periode;
use App\Models\Plo;
use App\Models\Clo;
use App\Services\LembarSoalGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class LembarSoalGeneratorController extends Controller
{
    protected LembarSoalGeneratorService $generatorService;

    public function __construct(LembarSoalGeneratorService $generatorService)
    {
        $this->generatorService = $generatorService;
    }

    /**
     * Fetch course structure including mapped PLO & CLOs to auto-populate the generator.
     */
    public function getCourseStructure(Request $request, int $id): JsonResponse
    {
        $course = Course::with('programStudi')->findOrFail($id);
        $user = $request->user();

        // Get all CLOs associated with this course, with their parent PLO
        $clos = Clo::with('plo')
            ->whereHas('courses', function ($q) use ($id) {
                $q->where('courses.id', $id);
            })
            ->get();

        // Group CLOs by PLO
        $ploMap = [];
        foreach ($clos as $clo) {
            $plo = $clo->plo;
            if (!$plo) continue;

            if (!isset($ploMap[$plo->id])) {
                $ploMap[$plo->id] = [
                    'id' => $plo->id,
                    'kode' => $plo->kode,
                    'deskripsi' => $plo->deskripsi,
                    'clo' => [],
                ];
            }

            $ploMap[$plo->id]['clo'][] = [
                'id' => $clo->id,
                'kode' => $clo->kode,
                'deskripsi' => $clo->deskripsi,
                'bobot_lo' => '0%',
            ];
        }

        // Evenly distribute default bobot if CLOs exist
        $totalCloCount = $clos->count();
        if ($totalCloCount > 0) {
            $defaultWeight = round(100 / $totalCloCount);
            $cumulative = 0;
            $index = 0;
            foreach ($ploMap as &$p) {
                foreach ($p['clo'] as &$c) {
                    $index++;
                    if ($index === $totalCloCount) {
                        $w = 100 - $cumulative;
                    } else {
                        $w = $defaultWeight;
                        $cumulative += $w;
                    }
                    $c['bobot_lo'] = "{$w}%";
                }
            }
        }

        // Active period
        $activePeriode = Periode::where('status', 'aktif')->first();

        return response()->json([
            'success' => true,
            'data' => [
                'course' => [
                    'id' => $course->id,
                    'kode_mk' => $course->kode_mk,
                    'nama_mk' => $course->nama_mk,
                    'sks' => $course->sks,
                    'kode_nama_mk' => "{$course->kode_mk} / {$course->nama_mk}",
                ],
                'kode_dosen' => $user->kode_dosen ?? $user->name ?? 'D001',
                'periode_nama' => $activePeriode->nama_periode ?? 'Semester Ganjil 2026/2027',
                'plo_structure' => array_values($ploMap),
            ],
        ]);
    }

    /**
     * Download dynamic Lembar Soal in DOCX format (on-the-fly).
     */
    public function downloadDocx(Request $request): BinaryFileResponse
    {
        $input = $request->all();
        $filePath = $this->generatorService->generateDocx($input);

        $kodeMk = preg_replace('/[^A-Za-z0-9_\-]/', '_', $input['kode_nama_mk'] ?? 'MataKuliah');
        $tipeUjian = preg_replace('/[^A-Za-z0-9_\-]/', '_', $input['tipe_ujian'] ?? 'UTS');
        $fileName = "Lembar_Soal_{$tipeUjian}_{$kodeMk}.docx";

        return response()->download($filePath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Download dynamic Lembar Soal in PDF format (on-the-fly).
     */
    public function downloadPdf(Request $request): Response
    {
        $input = $request->all();
        $pdf = $this->generatorService->generatePdf($input);

        $kodeMk = preg_replace('/[^A-Za-z0-9_\-]/', '_', $input['kode_nama_mk'] ?? 'MataKuliah');
        $tipeUjian = preg_replace('/[^A-Za-z0-9_\-]/', '_', $input['tipe_ujian'] ?? 'UTS');
        $fileName = "Lembar_Soal_{$tipeUjian}_{$kodeMk}.pdf";

        return $pdf->download($fileName);
    }
}
