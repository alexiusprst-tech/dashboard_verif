<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Periode;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\File;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\SimpleType\JcTable;

class BeritaAcaraEvaluasiGeneratorService
{
    /**
     * Get initial structured data for the generator form.
     */
    public function getDefaultInitialData(?int $courseId = null, ?int $periodeId = null, ?User $user = null): array
    {
        $periode = $periodeId ? Periode::find($periodeId) : Periode::where('status', 'aktif')->first();
        if (!$periode) {
            $periode = Periode::latest()->first();
        }

        $course = $courseId ? Course::with(['clo.plo', 'prodi'])->find($courseId) : null;
        if (!$course && Course::count() > 0) {
            $course = Course::with(['clo.plo', 'prodi'])->first();
        }

        // Find course coordinator if assigned
        $koordinator = null;
        if ($course && $periode) {
            $koordinatorAssign = \App\Models\PenugasanKoordinator::with('dosen')
                ->where('course_id', $course->id)
                ->where('periode_id', $periode->id)
                ->first();
            if ($koordinatorAssign && $koordinatorAssign->dosen) {
                $koordinator = $koordinatorAssign->dosen->nama_lengkap ?? $koordinatorAssign->dosen->name;
            }
        }

        $semesterText = $periode
            ? ucfirst($periode->semester) . ' ' . $periode->tahun_akademik
            : 'Ganjil 2026/2027';

        $evaluasiRows = [];
        if ($course && $course->clo->isNotEmpty()) {
            foreach ($course->clo as $clo) {
                $evaluasiRows[] = [
                    'bentuk_asesmen'   => 'UTS',
                    'clo'              => $clo->kode,
                    'no_soal'          => '1',
                    'catatan_evaluasi' => 'Sesuai',
                    'rekomendasi'      => '-',
                ];
            }
        } else {
            $evaluasiRows[] = [
                'bentuk_asesmen'   => 'UTS',
                'clo'              => 'CLO1',
                'no_soal'          => '1',
                'catatan_evaluasi' => 'Sesuai',
                'rekomendasi'      => '-',
            ];
        }

        return [
            'form_no'                  => '100-S1SI-001-R1',
            'no_dokumen'               => '100-S1SI-001-R1',
            'no_revisi'                => '00',
            'berlaku'                  => now()->format('d/m/Y'),
            'semester_tahun_akademik'  => $semesterText,
            'fakultas'                 => 'Rekayasa Industri',
            'nama_evaluator'           => $user ? ($user->nama_lengkap ?? $user->name) : 'Dr. Ir. Evaluator, M.T.',
            'kode_dosen'               => $user->kode_dosen ?? ($user->nip ?? 'EVA'),
            'program_studi'            => $course && $course->prodi ? $course->prodi->nama_prodi : 'S1 Sistem Informasi',
            'kode_mata_kuliah'         => $course->kode_mk ?? 'SI101',
            'nama_mata_kuliah'         => $course->nama_mk ?? 'Analisis Proses Bisnis',
            'program_studi_mk'         => $course && $course->prodi ? $course->prodi->nama_prodi : 'S1 Sistem Informasi',
            'dosen_koordinator'        => $koordinator ?? 'Dr. Dosen Koordinator, M.Kom.',
            'evaluasi'                 => $evaluasiRows,
            'kota'                     => 'Bandung',
            'tanggal'                  => now()->translatedFormat('d F Y'),
            'ttd' => [
                'evaluator_soal'    => $user ? ($user->nama_lengkap ?? $user->name) : 'Dr. Ir. Evaluator, M.T.',
                'dosen_koordinator' => $koordinator ?? 'Dr. Dosen Koordinator, M.Kom.',
                'ka_prodi'          => 'Dr. Hubbul Walidain, S.Kom., M.T.',
            ],
        ];
    }

    /**
     * Sanitize and format raw input data.
     */
    public function formatData(array $raw): array
    {
        $evaluasi = [];
        if (!empty($raw['evaluasi']) && is_array($raw['evaluasi'])) {
            foreach ($raw['evaluasi'] as $item) {
                $evaluasi[] = [
                    'bentuk_asesmen'   => trim((string)($item['bentuk_asesmen'] ?? 'UTS')),
                    'clo'              => trim((string)($item['clo'] ?? 'CLO1')),
                    'no_soal'          => trim((string)($item['no_soal'] ?? '1')),
                    'catatan_evaluasi' => trim((string)($item['catatan_evaluasi'] ?? 'Sesuai')),
                    'rekomendasi'      => trim((string)($item['rekomendasi'] ?? '-')),
                ];
            }
        }

        if (empty($evaluasi)) {
            $evaluasi[] = [
                'bentuk_asesmen'   => 'UTS',
                'clo'              => 'CLO1',
                'no_soal'          => '1',
                'catatan_evaluasi' => 'Sesuai',
                'rekomendasi'      => '-',
            ];
        }

        return [
            'form_no'                 => $raw['form_no'] ?? '100-S1SI-001-R1',
            'no_dokumen'              => $raw['no_dokumen'] ?? '100-S1SI-001-R1',
            'no_revisi'               => $raw['no_revisi'] ?? '00',
            'berlaku'                 => $raw['berlaku'] ?? now()->format('d/m/Y'),
            'semester_tahun_akademik' => $raw['semester_tahun_akademik'] ?? 'Ganjil 2026/2027',
            'fakultas'                => $raw['fakultas'] ?? 'Rekayasa Industri',
            'nama_evaluator'          => $raw['nama_evaluator'] ?? '-',
            'kode_dosen'              => $raw['kode_dosen'] ?? '-',
            'program_studi'           => $raw['program_studi'] ?? 'S1 Sistem Informasi',
            'kode_mata_kuliah'        => $raw['kode_mata_kuliah'] ?? '-',
            'nama_mata_kuliah'        => $raw['nama_mata_kuliah'] ?? '-',
            'program_studi_mk'        => $raw['program_studi_mk'] ?? ($raw['program_studi'] ?? 'S1 Sistem Informasi'),
            'dosen_koordinator'       => $raw['dosen_koordinator'] ?? '-',
            'evaluasi'                => $evaluasi,
            'kota'                    => $raw['kota'] ?? 'Bandung',
            'tanggal'                 => $raw['tanggal'] ?? now()->translatedFormat('d F Y'),
            'ttd'                     => [
                'evaluator_soal'    => $raw['ttd']['evaluator_soal'] ?? ($raw['nama_evaluator'] ?? '-'),
                'dosen_koordinator' => $raw['ttd']['dosen_koordinator'] ?? ($raw['dosen_koordinator'] ?? '-'),
                'ka_prodi'          => $raw['ttd']['ka_prodi'] ?? 'Dr. Hubbul Walidain, S.Kom., M.T.',
            ],
        ];
    }

    /**
     * Generate standard PDF document for Berita Acara Evaluasi using DomPDF.
     */
    public function generatePdf(array $rawInput): \Barryvdh\DomPDF\PDF
    {
        $data = $this->formatData($rawInput);

        $logoPath = public_path('images/logo-telkom.png');
        $logoBase64 = '';
        if (extension_loaded('gd') && File::exists($logoPath)) {
            $logoData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
        }

        $pdf = Pdf::loadView('templates.berita-acara-evaluasi-pdf', [
            'data'       => $data,
            'logoBase64' => $logoBase64,
        ]);

        $pdf->setPaper('a4', 'portrait');
        $pdf->setOption('isRemoteEnabled', true);
        $pdf->setOption('isHtml5ParserEnabled', true);

        return $pdf;
    }

    /**
     * Generate dynamic DOCX document matching the exact official template.
     */
    public function generateDocx(array $rawInput): string
    {
        $data = $this->formatData($rawInput);

        $phpWord = new PhpWord();
        $phpWord->setDefaultFontName('Cambria');
        $phpWord->setDefaultFontSize(10);
        $phpWord->setDefaultParagraphStyle([
            'spaceAfter' => 0,
            'lineHeight' => 1.15,
        ]);

        $section = $phpWord->addSection([
            'paperSize'    => 'A4',
            'orientation'  => 'portrait',
            'marginTop'    => 567, // ~1 cm
            'marginBottom' => 567,
            'marginLeft'   => 850, // ~1.5 cm
            'marginRight'  => 850,
            'headerHeight' => 431,
            'footerHeight' => 431,
        ]);

        // Fonts
        $fontRegular   = ['name' => 'Cambria', 'size' => 9.5];
        $fontBold      = ['name' => 'Cambria', 'size' => 9.5, 'bold' => true];
        $fontTitle     = ['name' => 'Cambria', 'size' => 11, 'bold' => true];
        $fontSmall     = ['name' => 'Cambria', 'size' => 8.5];
        $fontSmallBold = ['name' => 'Cambria', 'size' => 8.5, 'bold' => true];

        $pCenter = ['alignment' => Jc::CENTER, 'spaceAfter' => 0, 'lineHeight' => 1.15];
        $pLeft   = ['alignment' => Jc::LEFT, 'spaceAfter' => 0, 'lineHeight' => 1.15];
        $pRight  = ['alignment' => Jc::RIGHT, 'spaceAfter' => 0, 'lineHeight' => 1.15];
        $pJust   = ['alignment' => Jc::BOTH, 'spaceAfter' => 0, 'lineHeight' => 1.25];

        $borderStyle = ['borderSize' => 4, 'borderColor' => '000000'];

        // Header Form No Top Outside
        $header = $section->addHeader();
        $header->addText('Form No : ' . $data['form_no'], $fontSmall, $pLeft);

        // 1. Table Header Utama
        $headerTable = $section->addTable(array_merge($borderStyle, [
            'alignment' => JcTable::CENTER,
            'width'     => 9800,
            'unit'      => 'dxa',
        ]));

        // Row 0
        $headerTable->addRow(280);
        // Col 1: Logo
        $logoCell = $headerTable->addCell(1900, array_merge($borderStyle, ['vMerge' => 'restart', 'valign' => 'center']));
        $logoPath = public_path('images/logo-telkom.png');
        if (File::exists($logoPath)) {
            $logoCell->addImage($logoPath, [
                'width'     => 80,
                'height'    => 28,
                'alignment' => Jc::CENTER,
            ]);
        } else {
            $logoCell->addText('TELKOM UNIVERSITY', $fontSmallBold, $pCenter);
        }
        // Col 2: Univ Address
        $univCell = $headerTable->addCell(4100, array_merge($borderStyle, ['vMerge' => 'restart', 'valign' => 'center']));
        $univCell->addText('UNIVERSITAS TELKOM', $fontBold, $pLeft);
        $univCell->addText('Jl. Telekomunikasi No. 1, Terusan Buahbatu - Bojongsoang, Dayeuhkolot, Bandung 40257', $fontSmall, $pLeft);
        // Col 3 & 4: Meta
        $headerTable->addCell(1800, array_merge($borderStyle, ['valign' => 'center']))->addText('No. Dokumen', $fontSmall, $pLeft);
        $headerTable->addCell(2000, array_merge($borderStyle, ['valign' => 'center']))->addText($data['no_dokumen'], $fontSmall, $pLeft);

        // Row 1
        $headerTable->addRow(240);
        $headerTable->addCell(1900, array_merge($borderStyle, ['vMerge' => 'continue']));
        $headerTable->addCell(4100, array_merge($borderStyle, ['vMerge' => 'continue']));
        $headerTable->addCell(1800, array_merge($borderStyle, ['valign' => 'center']))->addText('No. Revisi', $fontSmall, $pLeft);
        $headerTable->addCell(2000, array_merge($borderStyle, ['valign' => 'center']))->addText($data['no_revisi'], $fontSmall, $pLeft);

        // Row 2
        $headerTable->addRow(240);
        $headerTable->addCell(1900, array_merge($borderStyle, ['vMerge' => 'continue']));
        $headerTable->addCell(4100, array_merge($borderStyle, ['vMerge' => 'continue']));
        $headerTable->addCell(1800, array_merge($borderStyle, ['valign' => 'center']))->addText('Berlaku', $fontSmall, $pLeft);
        $headerTable->addCell(2000, array_merge($borderStyle, ['valign' => 'center']))->addText($data['berlaku'], $fontSmall, $pLeft);

        // Row 3
        $headerTable->addRow(240);
        $headerTable->addCell(1900, array_merge($borderStyle, ['vMerge' => 'continue']));
        $headerTable->addCell(4100, array_merge($borderStyle, ['vMerge' => 'continue']));
        $headerTable->addCell(1800, array_merge($borderStyle, ['valign' => 'center']))->addText('Halaman', $fontSmall, $pLeft);
        $headerTable->addCell(2000, array_merge($borderStyle, ['valign' => 'center']))->addText('1 dari 1', $fontSmall, $pLeft);

        // Row 4: Sub Header
        $headerTable->addRow(320);
        $subHeaderCell = $headerTable->addCell(9800, array_merge($borderStyle, ['gridSpan' => 4, 'valign' => 'center']));
        $subHeaderCell->addText('BERITA ACARA VERIFIKASI SOAL ASESMEN', $fontBold, $pCenter);
        $subHeaderCell->addText('OBE SEMESTER ' . strtoupper($data['semester_tahun_akademik']), $fontBold, $pCenter);

        $section->addTextBreak(1, ['size' => 4]);

        // 2. Judul Dokumen
        $section->addText('BERITA ACARA EVALUASI KESESUAIAN SOAL ASESMEN', $fontTitle, $pCenter);
        $section->addText('DENGAN CLO MATA KULIAH', $fontTitle, $pCenter);

        $section->addTextBreak(1, ['size' => 6]);

        // Helper table for key-values
        $kvTableStyle = ['alignment' => JcTable::CENTER, 'width' => 9800, 'unit' => 'dxa'];

        // 3. Data Akademik
        $akademikTable = $section->addTable($kvTableStyle);
        $this->addKvRow($akademikTable, 'Semester/Tahun Akademik', $data['semester_tahun_akademik'], $fontRegular);
        $this->addKvRow($akademikTable, 'Fakultas', $data['fakultas'], $fontRegular);

        $section->addTextBreak(1, ['size' => 4]);

        // 4. Data Evaluator
        $section->addText('Saya sebagai evaluator', $fontBold, $pLeft);
        $evaluatorTable = $section->addTable($kvTableStyle);
        $this->addKvRow($evaluatorTable, 'Nama Evaluator', $data['nama_evaluator'], $fontRegular);
        $this->addKvRow($evaluatorTable, 'Kode Dosen', $data['kode_dosen'], $fontRegular);
        $this->addKvRow($evaluatorTable, 'Program Studi', $data['program_studi'], $fontRegular);

        $section->addTextBreak(1, ['size' => 4]);

        // 5. Pernyataan Evaluasi
        $section->addText('Menyatakan bahwa telah dilakukan evaluasi kesesuaian antara soal ujian dengan CLO yang diajukan untuk mata kuliah sebagai berikut.', $fontRegular, $pJust);

        $section->addTextBreak(1, ['size' => 4]);

        // 6. Data Mata Kuliah
        $mkTable = $section->addTable($kvTableStyle);
        $this->addKvRow($mkTable, 'Kode Mata Kuliah', $data['kode_mata_kuliah'], $fontRegular);
        $this->addKvRow($mkTable, 'Nama Mata Kuliah', $data['nama_mata_kuliah'], $fontRegular);
        $this->addKvRow($mkTable, 'Program Studi', $data['program_studi_mk'], $fontRegular);
        $this->addKvRow($mkTable, 'Dosen Koordinator', $data['dosen_koordinator'], $fontRegular);

        $section->addTextBreak(1, ['size' => 4]);

        // 7. Tabel Hasil Evaluasi
        $section->addText('Dengan hasil evaluasi sebagai berikut:', $fontBold, $pLeft);

        $evalTable = $section->addTable(array_merge($borderStyle, [
            'alignment' => JcTable::CENTER,
            'width'     => 9800,
            'unit'      => 'dxa',
        ]));

        // Header Table Evaluasi
        $evalTable->addRow(300, ['tblHeader' => true]);
        $evalTable->addCell(1600, array_merge($borderStyle, ['bgColor' => 'F2F2F2', 'valign' => 'center']))->addText('Bentuk Asesmen', $fontBold, $pCenter);
        $evalTable->addCell(1200, array_merge($borderStyle, ['bgColor' => 'F2F2F2', 'valign' => 'center']))->addText('CLO', $fontBold, $pCenter);
        $evalTable->addCell(1000, array_merge($borderStyle, ['bgColor' => 'F2F2F2', 'valign' => 'center']))->addText('No. Soal', $fontBold, $pCenter);
        $evalTable->addCell(3000, array_merge($borderStyle, ['bgColor' => 'F2F2F2', 'valign' => 'center']))->addText('Catatan Evaluasi', $fontBold, $pCenter);
        $evalTable->addCell(3000, array_merge($borderStyle, ['bgColor' => 'F2F2F2', 'valign' => 'center']))->addText('Rekomendasi Soal Terhadap CLO (Jika ada)', $fontBold, $pCenter);

        // Data Rows
        foreach ($data['evaluasi'] as $row) {
            $evalTable->addRow(260);
            $evalTable->addCell(1600, array_merge($borderStyle, ['valign' => 'top']))->addText($row['bentuk_asesmen'], $fontRegular, $pCenter);
            $evalTable->addCell(1200, array_merge($borderStyle, ['valign' => 'top']))->addText($row['clo'], $fontBold, $pCenter);
            $evalTable->addCell(1000, array_merge($borderStyle, ['valign' => 'top']))->addText($row['no_soal'], $fontRegular, $pCenter);
            $evalTable->addCell(3000, array_merge($borderStyle, ['valign' => 'top']))->addText($row['catatan_evaluasi'], $fontRegular, $pLeft);
            $evalTable->addCell(3000, array_merge($borderStyle, ['valign' => 'top']))->addText($row['rekomendasi'], $fontRegular, $pLeft);
        }

        $section->addTextBreak(1, ['size' => 4]);

        // 8. Pernyataan Hasil
        $section->addText('Berdasarkan hasil evaluasi tersebut, maka soal asesmen perlu diperbaiki sesuai/sudah sesuai* dengan catatan di atas.', $fontRegular, $pLeft);
        $section->addText('*) Coret yang tidak perlu', $fontSmall, $pLeft);

        $section->addTextBreak(1, ['size' => 8]);

        // 9. Tanggal Dokumen
        $section->addText(($data['kota'] ?? 'Bandung') . ', ' . $data['tanggal'], $fontRegular, $pRight);

        $section->addTextBreak(1, ['size' => 4]);

        // 10. Tabel Tanda Tangan
        $ttdTable = $section->addTable([
            'alignment' => JcTable::CENTER,
            'width'     => 9800,
            'unit'      => 'dxa',
        ]);

        $ttdTable->addRow(250);
        $ttdTable->addCell(3266, ['valign' => 'top'])->addText('Evaluator Soal,', $fontRegular, $pCenter);
        $ttdTable->addCell(3266, ['valign' => 'top'])->addText('Dosen Koordinator,', $fontRegular, $pCenter);
        $ttdTable->addCell(3266, ['valign' => 'top'])->addText('Ka. Prodi,', $fontRegular, $pCenter);

        $ttdTable->addRow(900); // Space for signatures
        $ttdTable->addCell(3266)->addText('', $fontRegular);
        $ttdTable->addCell(3266)->addText('', $fontRegular);
        $ttdTable->addCell(3266)->addText('', $fontRegular);

        $ttdTable->addRow(250);
        $ttdTable->addCell(3266, ['valign' => 'bottom'])->addText($data['ttd']['evaluator_soal'], $fontBold, $pCenter);
        $ttdTable->addCell(3266, ['valign' => 'bottom'])->addText($data['ttd']['dosen_koordinator'], $fontBold, $pCenter);
        $ttdTable->addCell(3266, ['valign' => 'bottom'])->addText($data['ttd']['ka_prodi'], $fontBold, $pCenter);

        // Save to temporary file
        $tempPath = storage_path('app/temp_ba_evaluasi_' . uniqid() . '.docx');
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempPath);

        return $tempPath;
    }

    /**
     * Helper to add a 3-column Key-Value row without borders.
     */
    private function addKvRow($table, string $label, string $value, array $fontStyle): void
    {
        $table->addRow(220);
        $table->addCell(2700, ['valign' => 'center'])->addText($label, $fontStyle, ['spaceAfter' => 0]);
        $table->addCell(250, ['valign' => 'center'])->addText(':', $fontStyle, ['alignment' => Jc::CENTER, 'spaceAfter' => 0]);
        $table->addCell(6850, ['valign' => 'center'])->addText($value, $fontStyle, ['spaceAfter' => 0]);
    }
}
