<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\SimpleType\Jc;
use PhpOffice\PhpWord\SimpleType\JcTable;
use Illuminate\Support\Facades\File;

class LembarSoalGeneratorService
{
    /**
     * Normalize and supply standard default values for Lembar Soal data.
     */
    public function formatData(array $input): array
    {
        return [
            'nama_evaluasi'    => $input['nama_evaluasi'] ?? '',
            'kode_nama_mk'     => $input['kode_nama_mk'] ?? '/',
            'kode_dosen'       => $input['kode_dosen'] ?? '',
            'tipe_ujian'       => $input['tipe_ujian'] ?? '',
            'tanggal_evaluasi' => $input['tanggal_evaluasi'] ?? '/ menit',
            'tipe_soal'        => $input['tipe_soal'] ?? 'Closed Book (120 minutes)',
            'form_no'          => $input['form_no'] ?? '100-S1SI-001-R1',
            'footer_text'      => $input['footer_text'] ?? 'Fakultas Rekayasa Industri – S1 Sistem Informasi',
            'petunjuk_pengerjaan' => !empty($input['petunjuk_pengerjaan']) && is_array($input['petunjuk_pengerjaan'])
                ? $input['petunjuk_pengerjaan']
                : [
                    '....',
                    '....',
                ],
            'plo' => !empty($input['plo']) && is_array($input['plo'])
                ? $input['plo']
                : [
                    [
                        'kode' => 'PLO1',
                        'deskripsi' => 'Mampu ....',
                        'clo' => [
                            [
                                'kode' => 'CLO1',
                                'deskripsi' => 'Mampu ....',
                                'bobot_lo' => '?? %',
                                'soal_text' => null,
                            ],
                        ],
                    ],
                ],
        ];
    }

    /**
     * Generate standard PDF document for Lembar Soal using DomPDF.
     */
    public function generatePdf(array $rawInput): \Barryvdh\DomPDF\PDF
    {
        $data = $this->formatData($rawInput);

        // Check for Telkom University logo and GD extension
        $logoPath = public_path('images/logo-telkom.png');
        $logoBase64 = '';
        if (extension_loaded('gd') && File::exists($logoPath)) {
            $logoData = file_get_contents($logoPath);
            $logoBase64 = 'data:image/png;base64,' . base64_encode($logoData);
        }

        $pdf = Pdf::loadView('templates.lembar-soal-pdf', [
            'data' => $data,
            'logoBase64' => $logoBase64,
        ]);

        $pdf->setPaper('a4', 'portrait');
        $pdf->setOption('isRemoteEnabled', true);
        $pdf->setOption('isHtml5ParserEnabled', true);

        return $pdf;
    }

    /**
     * Generate dynamic DOCX document matching the exact official exam template
     * (03_Template_Bank_Soal.docx — Telkom University "Lembar Soal" form).
     */
    public function generateDocx(array $rawInput): string
    {
        $data = $this->formatData($rawInput);

        $phpWord = new PhpWord();

        // Template default styling: Cambria 10pt everywhere except the title.
        $phpWord->setDefaultFontName('Cambria');
        $phpWord->setDefaultFontSize(10);
        $phpWord->setDefaultParagraphStyle([
            'spaceAfter' => 0,
            'lineHeight' => 1,
        ]);

        // Page margins taken from the template's sectPr (in twips):
        // top 431, bottom 431, left 1247, right 1247, header 431, footer 431.
        $section = $phpWord->addSection([
            'paperSize'    => 'A4',
            'orientation'  => 'portrait',
            'marginTop'    => 431,
            'marginBottom' => 431,
            'marginLeft'   => 1247,
            'marginRight'  => 1247,
            'headerHeight' => 431,
            'footerHeight' => 431,
        ]);

        // Font styles (matching template exactly)
        $fontRegular   = ['name' => 'Cambria', 'size' => 10];
        $fontBold      = ['name' => 'Cambria', 'size' => 10, 'bold' => true];
        $fontTitle     = ['name' => 'Cambria', 'size' => 14, 'bold' => true];
        $fontSmall     = ['name' => 'Cambria', 'size' => 10, 'color' => '000000'];
        $fontSoalBadge = ['name' => 'Cambria', 'size' => 10, 'highlight' => 'yellow'];

        $pCenter = ['alignment' => Jc::CENTER, 'spaceAfter' => 0];
        $pLeft   = ['alignment' => Jc::LEFT, 'spaceAfter' => 0];

        $borderStyle = ['borderSize' => 4, 'borderColor' => '000000'];

        // ─────────────────────────────────────────────────────────────
        // REPEATING HEADER / FOOTER (as in the template — not body text)
        // ─────────────────────────────────────────────────────────────
        $header = $section->addHeader();
        $header->addText('Form No : ' . $data['form_no'], $fontSmall, $pLeft);

        $footer = $section->addFooter();
        $footer->addText($data['footer_text'], $fontSmall, $pLeft);

        // ─────────────────────────────────────────────────────────────
        // 1. UNIFIED MAIN HEADER TABLE (widths from template tblGrid)
        // ─────────────────────────────────────────────────────────────
        $headerTable = $section->addTable(array_merge($borderStyle, [
            'alignment' => JcTable::CENTER,
            'width'     => 9588,
            'unit'      => 'dxa',
        ]));

        // Row 0: Logo cell (vMerge restart) | Title "LEMBAR SOAL" (gridSpan 4)
        $headerTable->addRow(521);
        $logoCell = $headerTable->addCell(1703, array_merge($borderStyle, [
            'vMerge' => 'restart',
            'valign' => 'center',
        ]));
        $logoPath = public_path('images/logo-telkom.png');
        if (File::exists($logoPath)) {
            $logoCell->addImage($logoPath, [
                'width'     => 74,
                'height'    => 25,
                'alignment' => Jc::CENTER,
            ]);
        } else {
            $logoCell->addText("TELKOM UNIVERSITY", $fontBold, $pCenter);
        }

        $titleCell = $headerTable->addCell(7885, array_merge($borderStyle, [
            'gridSpan' => 4,
            'valign'   => 'center',
        ]));
        $titleCell->addText('LEMBAR SOAL', $fontTitle, $pCenter);

        // Row 1: Logo (continue) | Nama Evaluasi | [val] | Kode dosen | [val]
        $headerTable->addRow(319);
        $headerTable->addCell(1703, array_merge($borderStyle, ['vMerge' => 'continue']));
        $headerTable->addCell(1717, array_merge($borderStyle, ['valign' => 'center']))
            ->addText('Nama Evaluasi', $fontRegular, $pLeft);
        $headerTable->addCell(2199, array_merge($borderStyle, ['valign' => 'center']))
            ->addText($data['nama_evaluasi'], $fontRegular, $pLeft);
        $headerTable->addCell(1559, array_merge($borderStyle, ['valign' => 'center']))
            ->addText('Kode dosen', $fontRegular, $pLeft);
        $headerTable->addCell(2410, array_merge($borderStyle, ['valign' => 'center']))
            ->addText($data['kode_dosen'], $fontRegular, $pLeft);

        // Row 2: Logo (continue) | Kode/Nama MK | [val] | Tipe Ujian | [val]
        $headerTable->addRow(319);
        $headerTable->addCell(1703, array_merge($borderStyle, ['vMerge' => 'continue']));
        $headerTable->addCell(1717, array_merge($borderStyle, ['valign' => 'center']))
            ->addText('Kode/Nama MK', $fontRegular, $pLeft);
        $headerTable->addCell(2199, array_merge($borderStyle, ['valign' => 'center']))
            ->addText($data['kode_nama_mk'], $fontBold, $pLeft);
        $headerTable->addCell(1559, array_merge($borderStyle, ['valign' => 'center']))
            ->addText('Tipe Ujian', $fontRegular, $pLeft);
        $headerTable->addCell(2410, array_merge($borderStyle, ['valign' => 'center']))
            ->addText($data['tipe_ujian'], $fontRegular, $pLeft);

        // Row 3: Logo (continue) | Tanggal Evaluasi | [val] | Tipe Soal | [val]
        $headerTable->addRow(319);
        $headerTable->addCell(1703, array_merge($borderStyle, ['vMerge' => 'continue']));
        $headerTable->addCell(1717, array_merge($borderStyle, ['valign' => 'center']))
            ->addText('Tanggal Evaluasi', $fontRegular, $pLeft);
        $headerTable->addCell(2199, array_merge($borderStyle, ['valign' => 'center']))
            ->addText($data['tanggal_evaluasi'], $fontBold, $pLeft);
        $headerTable->addCell(1559, array_merge($borderStyle, ['valign' => 'center']))
            ->addText('Tipe Soal', $fontRegular, $pLeft);
        $headerTable->addCell(2410, array_merge($borderStyle, ['valign' => 'center']))
            ->addText($data['tipe_soal'], $fontBold, $pLeft);

        $this->addSpacer($section);

        // ─────────────────────────────────────────────────────────────
        // 2. PETUNJUK PENGERJAAN TABLE (2 columns, widths 1710 / 7878)
        // ─────────────────────────────────────────────────────────────
        $petunjukTable = $section->addTable(array_merge($borderStyle, [
            'alignment' => JcTable::CENTER,
            'width'     => 9588,
            'unit'      => 'dxa',
        ]));
        $petunjukTable->addRow();
        $petunjukTable->addCell(1710, array_merge($borderStyle, ['valign' => 'center']))
            ->addText('Petunjuk Pengerjaan', $fontRegular, $pLeft);

        $petunjukRight = $petunjukTable->addCell(7878, array_merge($borderStyle, ['valign' => 'center']));
        foreach ($data['petunjuk_pengerjaan'] as $idx => $p) {
            $num = $idx + 1;
            $petunjukRight->addText("({$num}) {$p}", $fontRegular, ['spaceBefore' => 40, 'spaceAfter' => 40]);
        }

        $this->addSpacer($section);

        // ─────────────────────────────────────────────────────────────
        // 3. HIERARKI PLO → CLO → AREA SOAL
        // ─────────────────────────────────────────────────────────────
        $globalSoalNumber = 1;

        foreach ($data['plo'] as $plo) {
            // PLO Table (2 columns)
            $ploTable = $section->addTable(array_merge($borderStyle, [
                'alignment' => JcTable::CENTER,
                'width'     => 9588,
                'unit'      => 'dxa',
            ]));
            $ploTable->addRow();
            $ploTable->addCell(1710, array_merge($borderStyle, ['valign' => 'center']))
                ->addText('Program Learning Outcomes', $fontRegular, $pLeft);
            $ploTable->addCell(7878, array_merge($borderStyle, ['valign' => 'center']))
                ->addText("{$plo['kode']} – {$plo['deskripsi']}", $fontRegular, $pLeft);

            $this->addSpacer($section);

            // Loop CLO di dalam PLO ini (Setiap CLO = 1 Area Soal Terpisah)
            if (!empty($plo['clo']) && is_array($plo['clo'])) {
                foreach ($plo['clo'] as $clo) {
                    // CLO Header Table (widths 799 / 7655 / 1127)
                    $cloTable = $section->addTable(array_merge($borderStyle, [
                        'alignment' => JcTable::CENTER,
                        'width'     => 9581,
                        'unit'      => 'dxa',
                    ]));

                    // Row 1: Course Learning outcomes (gridSpan 2) | Bobot LO
                    $cloTable->addRow();
                    $cloTable->addCell(8454, array_merge($borderStyle, ['gridSpan' => 2, 'valign' => 'center']))
                        ->addText('Course Learning outcomes', $fontRegular, $pLeft);
                    $cloTable->addCell(1127, array_merge($borderStyle, ['valign' => 'center']))
                        ->addText('Bobot LO', $fontRegular, $pLeft);

                    // Row 2: [Kode CLO] | [Deskripsi CLO] | [Bobot LO %]
                    $cloTable->addRow();
                    $cloTable->addCell(799, array_merge($borderStyle, ['valign' => 'center']))
                        ->addText($clo['kode'], $fontRegular, $pCenter);
                    $cloTable->addCell(7655, array_merge($borderStyle, ['valign' => 'center']))
                        ->addText($clo['deskripsi'], $fontRegular, $pLeft);
                    $cloTable->addCell(1127, array_merge($borderStyle, ['valign' => 'center']))
                        ->addText($clo['bobot_lo'] ?? '?? %', $fontRegular, $pCenter);

                    // Area Soal Box (single cell, fixed height, yellow-highlighted badge)
                    $soalTable = $section->addTable(array_merge($borderStyle, [
                        'alignment' => JcTable::CENTER,
                        'width'     => 9581,
                        'unit'      => 'dxa',
                    ]));
                    $soalTable->addRow(2800); // height ~5cm, open space to write the question
                    $soalCell = $soalTable->addCell(9581, array_merge($borderStyle, ['valign' => 'top']));

                    // "Soal LO[x]" badge — yellow highlight, NOT bold (matches template)
                    $soalCell->addText(
                        "Soal LO{$globalSoalNumber}",
                        $fontSoalBadge,
                        ['alignment' => Jc::CENTER, 'spaceBefore' => 60, 'spaceAfter' => 120]
                    );

                    if (!empty($clo['soal_text'])) {
                        $soalCell->addText($clo['soal_text'], $fontRegular, $pLeft);
                    }

                    $this->addSpacer($section);
                    $globalSoalNumber++;
                }
            }
        }

        // Save DOCX to temporary file and return path
        $tempFile = tempnam(sys_get_temp_dir(), 'lembar_soal_') . '.docx';
        $objWriter = IOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);

        return $tempFile;
    }

    /**
     * Small spacer paragraph between tables, matching the template's tight
     * inter-table gap (a near-empty paragraph at ~5pt instead of a full
     * default-size line break).
     */
    private function addSpacer($section): void
    {
        $section->addText('', ['size' => 5], ['spaceAfter' => 0]);
    }
}