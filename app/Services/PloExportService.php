<?php

namespace App\Services;

use App\Models\Plo;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PloExportService
{
    public function export(): StreamedResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('PLO');

        $headers = ['kode_plo', 'deskripsi', 'kode_prodi'];
        $sheet->fromArray($headers, null, 'A1');

        $plos = Plo::with('programStudi')
            ->orderBy('prodi_id')
            ->orderBy('kode')
            ->get();

        $row = 2;
        foreach ($plos as $plo) {
            $sheet->setCellValue("A{$row}", $plo->kode);
            $sheet->setCellValue("B{$row}", $plo->deskripsi);
            $sheet->setCellValue("C{$row}", $plo->programStudi?->kode_prodi ?? '');
            $row++;
        }

        $writer = new Xlsx($spreadsheet);

        return new StreamedResponse(function () use ($writer) {
            $writer->save('php://output');
        }, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="plo_export_' . now()->format('Ymd') . '.xlsx"',
        ]);
    }
}
