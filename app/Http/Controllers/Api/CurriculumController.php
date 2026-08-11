<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CurriculumImportService;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class CurriculumController extends Controller
{
    protected CurriculumImportService $service;

    public function __construct(CurriculumImportService $service)
    {
        $this->service = $service;
    }

    public function previewImport(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
            'sheet' => 'nullable|string',
        ]);

        $file = $request->file('file');

        // Basic file type/size validation
        $ext = strtolower($file->getClientOriginalExtension());
        $mime = $file->getMimeType();
        $size = $file->getSize();
        if (!in_array($ext, ['xlsx', 'xls'])) {
            return response()->json(['success' => false, 'message' => 'Tipe file tidak didukung. Gunakan file .xlsx atau .xls'], 422);
        }
        if ($size > 10 * 1024 * 1024) { // 10MB
            return response()->json(['success' => false, 'message' => 'Ukuran file terlalu besar (max 10MB).'], 422);
        }

        try {
            $steps = ['courses', 'categories', 'plos', 'clos_mapping'];
            $result = [];
            $sheet = $request->input('sheet');
            foreach ($steps as $step) {
                $rows = $this->service->parseStepFile($step, $file, $sheet);
                $result[$step] = [
                    'total' => count($rows),
                    'sample' => array_slice($rows, 0, 10),
                ];
            }

            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function importWizard(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
            'curriculum.code' => 'required|string',
            'curriculum.name' => 'required|string',
        ]);

        $file = $request->file('file');

        $ext = strtolower($file->getClientOriginalExtension());
        $size = $file->getSize();
        if (!in_array($ext, ['xlsx', 'xls'])) {
            return response()->json(['success' => false, 'message' => 'Tipe file tidak didukung. Gunakan file .xlsx atau .xls'], 422);
        }
        if ($size > 10 * 1024 * 1024) { // 10MB
            return response()->json(['success' => false, 'message' => 'Ukuran file terlalu besar (max 10MB).'], 422);
        }
        $curriculum = $request->input('curriculum');

        try {
            // Parse all steps
            // check duplicate curriculum code
            $curriculum = $request->input('curriculum');
            $existing = \App\Models\Curriculum::where('code', trim($curriculum['code']))->first();
            if ($existing) {
                return response()->json(['success' => false, 'message' => 'Kode kurikulum sudah ada. Gunakan kode lain atau hapus kurikulum yang ada terlebih dahulu.'], 409);
            }

            $payload = [
                'curriculum' => $curriculum,
                'courses' => $this->service->parseStepFile('courses', $file, $request->input('sheet')),
                'categories' => $this->service->parseStepFile('categories', $file, $request->input('sheet')),
                'plos' => $this->service->parseStepFile('plos', $file, $request->input('sheet')),
                'clos_mapping' => $this->service->parseStepFile('clos_mapping', $file, $request->input('sheet')),
            ];

            $created = $this->service->importWizard($payload);

            return response()->json(['success' => true, 'data' => $created]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    public function template(Request $request, string $type)
    {
        try {
            $spreadsheet = $this->service->generateTemplate($type);
            $writer = new Xlsx($spreadsheet);
            $filename = "curriculum_template_{$type}.xlsx";

            return response()->streamDownload(function () use ($writer) {
                $writer->save('php://output');
            }, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
