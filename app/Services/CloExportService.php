<?php

namespace App\Services;

use App\Models\Clo;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CloExportService
{
    public function export(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('CLO');

        $headers = ['kode_mk', 'kode_clo', 'deskripsi', 'kode_plo'];
        $sheet->fromArray($headers, null, 'A1');

        $clos = Clo::with(['plo', 'courses'])
            ->orderBy('kode')
            ->get();

        $row = 2;
        foreach ($clos as $clo) {
            $course = $clo->courses->first();
            $sheet->setCellValue("A{$row}", $course?->kode_mk ?? '');
            $sheet->setCellValue("B{$row}", $clo->kode);
            $sheet->setCellValue("C{$row}", $clo->deskripsi);
            $sheet->setCellValue("D{$row}", $clo->plo?->kode ?? '');
            $row++;
        }

        $writer = new Xlsx($spreadsheet);

        return new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="clo_export_' . now()->format('Ymd') . '.xlsx"',
        ]);
    }
}
