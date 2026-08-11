<?php

namespace App\Services;

use App\Models\Clo;
use App\Models\Course;
use App\Models\Curriculum;
use App\Models\Plo;
use App\Services\ActivityLog\ActivityLogService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;

class CurriculumImportService
{
    protected ActivityLogService $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }

    public function generateTemplate(string $type): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => 'CCCCCC'],
                ],
            ],
        ];

        switch ($type) {
            case 'courses':
                $sheet->mergeCells('A1:E1');
                $sheet->setCellValue('A1', 'MATA KULIAH');
                $sheet->getStyle('A1:E1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '1F497D']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'D9E1F2']],
                ]);
                $sheet->getRowDimension(1)->setRowHeight(35);

                $headers = ['Semester', 'Kode', 'Nama MK (INA)', 'Nama MK (ENG)', 'SKS'];
                foreach ($headers as $colIndex => $headerText) {
                    $colLetter = chr(65 + $colIndex);
                    $sheet->setCellValue($colLetter . '2', $headerText);
                }
                $sheet->getStyle('A2:E2')->applyFromArray($headerStyle);
                $sheet->getRowDimension(2)->setRowHeight(25);

                $sampleData = [
                    [1, 'CS101', 'Pemrograman Web', 'Web Programming', 3],
                    [1, 'CS102', 'Algoritma & Struktur Data', 'Algorithms & Data Structures', 4],
                    [2, 'CS201', 'Basis Data', 'Databases', 3],
                ];
                foreach ($sampleData as $rowIndex => $row) {
                    $r = $rowIndex + 3;
                    $sheet->setCellValue("A{$r}", $row[0]);
                    $sheet->setCellValue("B{$r}", $row[1]);
                    $sheet->setCellValue("C{$r}", $row[2]);
                    $sheet->setCellValue("D{$r}", $row[3]);
                    $sheet->setCellValue("E{$r}", $row[4]);
                }
                foreach (range('A', 'E') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
                break;

            case 'course_categories':
                $sheet->setCellValue('A1', 'Kategori');
                $sheet->setCellValue('B1', 'Nama Mata Kuliah');
                $sheet->getStyle('A1:B1')->applyFromArray($headerStyle);
                $sheet->getRowDimension(1)->setRowHeight(28);

                $sampleData = [
                    ['MKWU', 'Pemrograman Web'],
                    ['MKWP', 'Algoritma & Struktur Data'],
                    ['MKPP', 'Basis Data'],
                ];
                foreach ($sampleData as $rowIndex => $row) {
                    $r = $rowIndex + 2;
                    $sheet->setCellValue("A{$r}", $row[0]);
                    $sheet->setCellValue("B{$r}", $row[1]);
                }
                $sheet->getColumnDimension('A')->setWidth(18);
                $sheet->getColumnDimension('B')->setWidth(40);
                break;

            case 'plos':
                $sheet->setCellValue('A1', 'KODE PLO');
                $sheet->setCellValue('B1', 'Program Learning Outcome / Capaian Pembelajaran Kuliah');
                $sheet->getStyle('A1:B1')->applyFromArray($headerStyle);
                $sheet->getRowDimension(1)->setRowHeight(28);

                $sampleData = [
                    ['PLO01', 'Mampu menerapkan pemikiran logis, kritis, sistematis, dan inovatif dalam pengembangan IPTEK.'],
                    ['PLO02', 'Mampu merancang dan mengimplementasikan perangkat lunak sesuai standar industri.'],
                ];
                foreach ($sampleData as $rowIndex => $row) {
                    $r = $rowIndex + 2;
                    $sheet->setCellValue("A{$r}", $row[0]);
                    $sheet->setCellValue("B{$r}", $row[1]);
                }
                $sheet->getColumnDimension('A')->setWidth(18);
                $sheet->getColumnDimension('B')->setWidth(80);
                break;

            case 'clos_mapping':
                $sheet->setCellValue('A1', 'PLO');
                $sheet->setCellValue('B1', 'Kode CLO');
                $sheet->setCellValue('C1', 'CLO');
                $sheet->setCellValue('D1', 'Bloom');
                $sheet->setCellValue('E1', 'MK');
                $sheet->getStyle('A1:E1')->applyFromArray($headerStyle);
                $sheet->getRowDimension(1)->setRowHeight(28);

                $sampleData = [
                    [
                        'plo' => 'PLO02',
                        'kode_clo' => 'PLO02-CLO02',
                        'clo' => 'Mampu mengembangkan solusi berbasis sistem informasi menggunakan metodologi pengembangan yang tepat',
                        'bloom' => '6 - Create',
                        'mk' => [
                            'Pemrograman Web',
                            'Algoritma & Struktur Data',
                            'Pengembangan Aplikasi Website',
                        ],
                    ],
                ];

                $row = 2;

                foreach ($sampleData as $data) {
                    $groupStart = $row;

                    foreach ($data['mk'] as $mk) {
                        $sheet->setCellValue("A{$row}", $data['plo']);
                        $sheet->setCellValue("B{$row}", $data['kode_clo']);
                        $sheet->setCellValue("C{$row}", $data['clo']);
                        $sheet->setCellValue("D{$row}", $data['bloom']);
                        $sheet->setCellValue("E{$row}", $mk);
                        $row++;
                    }

                    $groupEnd = $row - 1;

                    if ($groupEnd > $groupStart) {
                        foreach (['A', 'B', 'C', 'D'] as $col) {
                            $sheet->mergeCells("{$col}{$groupStart}:{$col}{$groupEnd}");
                        }
                    }

                    $sheet->getStyle("A{$groupStart}:D{$groupEnd}")->getAlignment()
                        ->setVertical(Alignment::VERTICAL_CENTER)
                        ->setHorizontal(Alignment::HORIZONTAL_CENTER);

                    $sheet->getStyle("C{$groupStart}:C{$groupEnd}")->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                        ->setWrapText(true);
                }

                $sheet->getColumnDimension('A')->setWidth(15);
                $sheet->getColumnDimension('B')->setWidth(20);
                $sheet->getColumnDimension('C')->setWidth(60);
                $sheet->getColumnDimension('D')->setWidth(15);
                $sheet->getColumnDimension('E')->setWidth(35);
                break;

            default:
                throw new \InvalidArgumentException("Tipe template tidak valid.");
        }

        return $spreadsheet;
    }

    public function parseStepFile(string $step, $file, ?string $sheetName = null): array
    {
        $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());

        // Try to find a worksheet that contains the expected headers for this step.
        $foundSheet = null;
        $foundSheetName = null;

        // If a sheet name is provided, try to use it first (case-insensitive)
        if ($sheetName) {
            foreach ($spreadsheet->getAllSheets() as $ws) {
                if (strtolower($ws->getTitle()) === strtolower($sheetName)) {
                    $patterns = $this->getPatternsForStep($step);
                    $headerInfo = $this->locateHeaderAndColumns($ws, $patterns['required'] ?? [], $patterns['optional'] ?? []);
                    if ($headerInfo['header_row']) {
                        $foundSheet = $ws;
                        $foundSheetName = $ws->getTitle();
                    } else {
                        throw new \InvalidArgumentException("Sheet '{$sheetName}' ditemukan tetapi header untuk langkah '{$step}' tidak sesuai template atau tidak lengkap.");
                    }
                    break;
                }
            }
            if (!$foundSheet) {
                throw new \InvalidArgumentException("Sheet bernama '{$sheetName}' tidak ditemukan di file.");
            }
        } else {
            foreach ($spreadsheet->getAllSheets() as $ws) {
                $highestRow = $ws->getHighestRow();
                $patterns = $this->getPatternsForStep($step);
                $headerInfo = $this->locateHeaderAndColumns($ws, $patterns['required'] ?? [], $patterns['optional'] ?? []);
                if ($headerInfo['header_row']) {
                    $foundSheet = $ws;
                    $foundSheetName = $ws->getTitle();
                    break;
                }
            }
        }

        if (!$foundSheet) {
            // Provide informative message listing headers found across sheets
            $sheetSummaries = [];
            foreach ($spreadsheet->getAllSheets() as $ws) {
                $sheetSummaries[] = $ws->getTitle() . ': ' . $this->formatFoundHeaders($ws);
            }
            throw new \InvalidArgumentException("Tidak menemukan header yang sesuai untuk langkah '{$step}'. Periksa sheet dan header kolom. Ditemukan pada sheets: " . implode(' | ', $sheetSummaries));
        }

        $sheet = $foundSheet;
        $highestRow = $sheet->getHighestRow();

        $rows = [];

        switch ($step) {
            case 'courses':
                $headerInfo = $this->locateHeaderAndColumns($sheet, [
                    'semester' => '/^(semester|smt)$/',
                    'code' => '/^(kode|code|kodemk|coursecode|kodematakuliah)$/',
                    'name_ina' => '/(namamk|namamatakuliah|namamkina|namaindonesia|coursename|matakuliah)/',
                    'sks' => '/^(sks|credits|credit|bobotsks|sksmk)$/',
                ], [
                    'name_eng' => '/(namamkeng|namamken|namainggris|englishname|coursenameen)/',
                ]);

                if (!$headerInfo['header_row']) {
                    throw new \InvalidArgumentException(
                        "Format header kolom file Mata Kuliah tidak sesuai template resmi. Kolom yang wajib ada: Semester, Kode, Nama MK (INA), SKS. Silakan unduh dan gunakan template yang disediakan."
                    );
                }

                $headerRow = $headerInfo['header_row'];
                $colMap = $headerInfo['col_map'];

                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {
                    $semester = isset($colMap['semester']) ? $this->getCellValue($sheet, $colMap['semester'], $r) : '';
                    $code = isset($colMap['code']) ? $this->getCellValue($sheet, $colMap['code'], $r) : '';
                    $nameIna = isset($colMap['name_ina']) ? $this->getCellValue($sheet, $colMap['name_ina'], $r) : '';
                    $nameEng = isset($colMap['name_eng']) ? $this->getCellValue($sheet, $colMap['name_eng'], $r) : '';
                    $sks = isset($colMap['sks']) ? $this->getCellValue($sheet, $colMap['sks'], $r) : '';

                    if ($semester === '' && $code === '' && $nameIna === '' && $nameEng === '' && $sks === '') {
                        continue;
                    }

                    if ($nameIna === '') {
                        throw new \InvalidArgumentException("Baris {$r}: Nama Mata Kuliah (INA) tidak boleh kosong.");
                    }

                    if ($semester !== '' && (!is_numeric($semester) || (int)$semester < 1 || (int)$semester > 14)) {
                        throw new \InvalidArgumentException("Baris {$r}: Semester harus berupa angka antara 1 sampai 14 (ditemukan: '{$semester}').");
                    }

                    if ($sks !== '' && (!is_numeric($sks) || (int)$sks < 1 || (int)$sks > 20)) {
                        throw new \InvalidArgumentException("Baris {$r}: SKS harus berupa angka positif (ditemukan: '{$sks}').");
                    }

                    $rows[] = [
                        'semester' => is_numeric($semester) ? (int)$semester : 1,
                        'code' => $code,
                        'name_ina' => $nameIna,
                        'name_eng' => $nameEng,
                        'sks' => is_numeric($sks) ? (int)$sks : 3,
                        'category' => null,
                    ];
                }

                if (empty($rows)) {
                    throw new \InvalidArgumentException("File Excel Mata Kuliah tidak memuat data yang valid atau baris data kosong.");
                }
                break;

            case 'categories':
                foreach ($sheet->getMergeCells() as $cells) {
                    $range = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::extractAllCellReferencesInRange($cells);
                    if (!empty($range)) {
                        $topLeftValue = $sheet->getCell($range[0])->getValue();
                        foreach ($range as $cellRef) {
                            $sheet->setCellValue($cellRef, $topLeftValue);
                        }
                    }
                }

                $headerInfo = $this->locateHeaderAndColumns($sheet, [
                    'category' => '/(kategori|category|kelompok|jenismk)/',
                    'course_name' => '/(namamatakuliah|namamk|matakuliah|coursename)/',
                ]);

                if (!$headerInfo['header_row']) {
                    throw new \InvalidArgumentException(
                        "Format header kolom file Kategori MK tidak sesuai template resmi. Kolom yang wajib ada: Kategori dan Nama Mata Kuliah. Silakan unduh dan gunakan template yang disediakan."
                    );
                }

                $headerRow = $headerInfo['header_row'];
                $colMap = $headerInfo['col_map'];
                $lastCategory = '';

                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {
                    $cellCat = $this->getCellValue($sheet, $colMap['category'], $r);
                    $courseName = $this->getCellValue($sheet, $colMap['course_name'], $r);

                    if ($cellCat === '' && $courseName === '') {
                        continue;
                    }

                    if ($cellCat !== '') $lastCategory = $cellCat;
                    $category = $cellCat !== '' ? $cellCat : $lastCategory;

                    if ($courseName !== '') {
                        if ($category === '') {
                            throw new \InvalidArgumentException("Baris {$r}: Kategori untuk mata kuliah '{$courseName}' tidak boleh kosong.");
                        }

                        $rows[] = [
                            'category' => strtoupper($category),
                            'course_name' => $courseName,
                        ];
                    }
                }

                if (empty($rows)) {
                    throw new \InvalidArgumentException("File Excel Kategori Mata Kuliah tidak memuat data yang valid atau baris data kosong.");
                }
                break;

            case 'plos':
                $headerInfo = $this->locateHeaderAndColumns($sheet, [
                    'code' => '/(kodeplo|plocode|kodecpl|plo|cpl)/',
                    'description' => '/(programlearningoutcome|capaianpembelajaran|deskripsi|description|learningoutcome)/',
                ]);

                if (!$headerInfo['header_row']) {
                    throw new \InvalidArgumentException(
                        "Format header kolom file PLO tidak sesuai template resmi. Kolom yang wajib ada: KODE PLO dan Program Learning Outcome / Capaian Pembelajaran Kuliah. Silakan unduh dan gunakan template yang disediakan."
                    );
                }

                $headerRow = $headerInfo['header_row'];
                $colMap = $headerInfo['col_map'];

                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {
                    $code = $this->getCellValue($sheet, $colMap['code'], $r);
                    $description = $this->getCellValue($sheet, $colMap['description'], $r);

                    if ($code === '' && $description === '') {
                        continue;
                    }

                    if ($code === '') {
                        throw new \InvalidArgumentException("Baris {$r}: Kode PLO tidak boleh kosong.");
                    }
                    if ($description === '') {
                        throw new \InvalidArgumentException("Baris {$r}: Deskripsi untuk PLO '{$code}' tidak boleh kosong.");
                    }

                    $rows[] = [
                        'code' => strtoupper($code),
                        'description' => $description,
                    ];
                }

                if (empty($rows)) {
                    throw new \InvalidArgumentException("File Excel PLO tidak memuat data yang valid atau baris data kosong.");
                }
                break;

            case 'clos_mapping':
                foreach ($sheet->getMergeCells() as $cells) {
                    $range = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::extractAllCellReferencesInRange($cells);
                    if (!empty($range)) {
                        $topLeftValue = $sheet->getCell($range[0])->getValue();
                        foreach ($range as $cellRef) {
                            $sheet->setCellValue($cellRef, $topLeftValue);
                        }
                    }
                }

                $headerInfo = $this->locateHeaderAndColumns($sheet, [
                    'plo' => '/^(plo|kodeplo|plocode|cpl|kodecpl)$/',
                    'clo_code' => '/(kodeclo|clocode|kodecpmk|clonumber|kode_clo)/',
                    'description' => '/(^clo$|deskripsiclo|deskripsicpmk|capaianpembelajaran|deskripsi|description)/',
                    'bloom' => '/(bloom|levelbloom|taksonomi|bloomlevel)/',
                    'course_name' => '/^(mk|namamk|namamatakuliah|matakuliah|course|coursename)$/',
                ]);

                if (!$headerInfo['header_row']) {
                    throw new \InvalidArgumentException(
                        "Format header kolom file CLO & Pemetaan tidak sesuai template resmi. Kolom yang wajib ada: PLO, Kode CLO, CLO, Bloom, dan MK. Silakan unduh dan gunakan template yang disediakan."
                    );
                }

                $headerRow = $headerInfo['header_row'];
                $colMap = $headerInfo['col_map'];

                $lastPloCode = '';
                $lastCloCode = '';
                $lastDescription = '';
                $lastBloom = '';
                $lastCourseName = '';

                for ($r = $headerRow + 1; $r <= $highestRow; $r++) {
                    $cellPlo = $this->getCellValue($sheet, $colMap['plo'], $r);
                    $cellClo = $this->getCellValue($sheet, $colMap['clo_code'], $r);
                    $cellDesc = $this->getCellValue($sheet, $colMap['description'], $r);
                    $cellBloom = $this->getCellValue($sheet, $colMap['bloom'], $r);
                    $cellCourse = $this->getCellValue($sheet, $colMap['course_name'], $r);

                    if ($cellPlo === '' && $cellClo === '' && $cellDesc === '' && $cellBloom === '' && $cellCourse === '') {
                        continue;
                    }

                    if ($cellPlo !== '') $lastPloCode = $cellPlo;
                    if ($cellClo !== '') $lastCloCode = $cellClo;
                    if ($cellDesc !== '') $lastDescription = $cellDesc;
                    if ($cellBloom !== '') $lastBloom = $cellBloom;
                    if ($cellCourse !== '') $lastCourseName = $cellCourse;

                    $rawPloCode = $cellPlo !== '' ? $cellPlo : $lastPloCode;
                    $rawCloCode = $cellClo !== '' ? $cellClo : $lastCloCode;
                    $cloDescription = $cellDesc !== '' ? $cellDesc : $lastDescription;
                    $bloom = $cellBloom !== '' ? $cellBloom : $lastBloom;
                    $courseName = $cellCourse !== '' ? $cellCourse : $lastCourseName;

                    if ($courseName === '') {
                        throw new \InvalidArgumentException("Baris {$r}: Nama Mata Kuliah (MK) pada pemetaan CLO tidak boleh kosong.");
                    }
                    if ($rawCloCode === '') {
                        throw new \InvalidArgumentException("Baris {$r}: Kode CLO tidak boleh kosong.");
                    }

                    $extracted = $this->extractCloCodeParts($rawCloCode, $rawPloCode);

                    $rows[] = [
                        'plo_code' => $extracted['plo_code'],
                        'clo_code' => $rawCloCode,
                        'description' => $cloDescription,
                        'bloom' => strtoupper($bloom),
                        'course_name' => $courseName,
                    ];
                }

                if (empty($rows)) {
                    throw new \InvalidArgumentException("File Excel CLO & Pemetaan tidak memuat data yang valid atau baris data kosong.");
                }
                break;

            default:
                throw new \InvalidArgumentException("Step tidak valid.");
        }

        return $rows;
    }

    protected function getCellValue(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, int|string $col, int $row): string
    {
        $colLetter = is_numeric($col) ? \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex((int)$col) : (string)$col;
        return trim((string) $sheet->getCell("{$colLetter}{$row}")->getValue());
    }

    protected function locateHeaderAndColumns(
        \PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet,
        array $requiredPatterns,
        array $optionalPatterns = [],
        int $maxHeaderRows = 3,
        int $maxCols = 15
    ): array {
        for ($row = 1; $row <= $maxHeaderRows; $row++) {
            $colMap = [];
            for ($col = 1; $col <= $maxCols; $col++) {
                $val = $this->getCellValue($sheet, $col, $row);
                if ($val === '') continue;

                $normalized = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $val));

                foreach ($requiredPatterns as $key => $pattern) {
                    if (!isset($colMap[$key]) && preg_match($pattern, $normalized)) {
                        $colMap[$key] = $col;
                    }
                }

                foreach ($optionalPatterns as $key => $pattern) {
                    if (!isset($colMap[$key]) && preg_match($pattern, $normalized)) {
                        $colMap[$key] = $col;
                    }
                }
            }

            $allFound = true;
            foreach (array_keys($requiredPatterns) as $key) {
                if (!isset($colMap[$key])) {
                    $allFound = false;
                    break;
                }
            }

            if ($allFound) {
                return [
                    'header_row' => $row,
                    'col_map' => $colMap,
                ];
            }
        }

        return [
            'header_row' => null,
            'col_map' => [],
        ];
    }

    /**
     * Return the required/optional patterns for a parsing step.
     */
    protected function getPatternsForStep(string $step): array
    {
        switch ($step) {
            case 'courses':
                return [
                    'required' => [
                        'semester' => '/^(semester|smt)$/',
                        'code' => '/^(kode|code|kodemk|coursecode|kodematakuliah)$/',
                        'name_ina' => '/(namamk|namamatakuliah|namamkina|namaindonesia|coursename|matakuliah)/',
                        'sks' => '/^(sks|credits|credit|bobotsks|sksmk)$/',
                    ],
                    'optional' => [
                        'name_eng' => '/(namamkeng|namamken|namainggris|englishname|coursenameen)/',
                    ],
                ];
            case 'categories':
                return [
                    'required' => [
                        'category' => '/(kategori|category|kelompok|jenismk)/',
                        'course_name' => '/(namamatakuliah|namamk|matakuliah|coursename)/',
                    ],
                    'optional' => [],
                ];
            case 'plos':
                return [
                    'required' => [
                        'code' => '/(kodeplo|plocode|kodecpl|plo|cpl)/',
                        'description' => '/(programlearningoutcome|capaianpembelajaran|deskripsi|description|learningoutcome)/',
                    ],
                    'optional' => [],
                ];
            case 'clos_mapping':
                return [
                    'required' => [
                        'plo' => '/^(plo|kodeplo|plocode|cpl|kodecpl)$/',
                        'clo_code' => '/(kodeclo|clocode|kodecpmk|clonumber|kode_clo)/',
                        'description' => '/(^clo$|deskripsiclo|deskripsicpmk|capaianpembelajaran|deskripsi|description)/',
                        'bloom' => '/(bloom|levelbloom|taksonomi|bloomlevel)/',
                        'course_name' => '/^(mk|namamk|namamatakuliah|matakuliah|course|coursename)$/',
                    ],
                    'optional' => [],
                ];
            default:
                return ['required' => [], 'optional' => []];
        }
    }

    protected function formatFoundHeaders(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet, int $maxRows = 2, int $maxCols = 8): string
    {
        $headers = [];
        for ($r = 1; $r <= $maxRows; $r++) {
            $rowVals = [];
            for ($c = 1; $c <= $maxCols; $c++) {
                $val = $this->getCellValue($sheet, $c, $r);
                if ($val !== '') {
                    $rowVals[] = $val;
                }
            }
            if (!empty($rowVals)) {
                $headers[] = 'Baris ' . $r . ': [' . implode(', ', $rowVals) . ']';
            }
        }

        return !empty($headers) ? implode('; ', $headers) : '(File kosong / tidak ada teks)';
    }

    public function importWizard(array $payload)
    {
        return DB::transaction(function () use ($payload) {
            $curriculum = Curriculum::create([
                'code' => trim($payload['curriculum']['code']),
                'name' => trim($payload['curriculum']['name']),
            ]);

            $courseMapByName = [];
            $courseMapByCode = [];

            $coursesData = $payload['courses'] ?? [];
            $categoriesData = $payload['categories'] ?? [];

            $categoryLookup = [];
            foreach ($categoriesData as $catRow) {
                $cName = strtolower(trim($catRow['course_name'] ?? ''));
                if ($cName !== '') {
                    $categoryLookup[$cName] = $catRow['category'] ?? null;
                }
            }

            $usedCourseCodes = [];
            foreach ($coursesData as $c) {
                $cNameIna = trim($c['name_ina'] ?? $c['course_name'] ?? '');
                $cNameKey = strtolower($cNameIna);
                $category = $categoryLookup[$cNameKey] ?? $c['category'] ?? 'MKWP';

                $rawCode = trim((string)($c['code'] ?? $c['course_code'] ?? ''));
                if ($rawCode === '' || $rawCode === '-') {
                    $slug = strtoupper(\Illuminate\Support\Str::slug($cNameIna, '_'));
                    $rawCode = $slug !== '' ? 'MK_' . $slug : 'MK_' . (count($usedCourseCodes) + 1);
                }

                $finalCode = $rawCode;
                $counter = 1;
                while (
                    Course::where('curriculum_id', $curriculum->id)->where('course_code', $finalCode)->exists() ||
                    isset($usedCourseCodes[strtolower($finalCode)])
                ) {
                    $finalCode = $rawCode . '_' . $counter;
                    $counter++;
                }
                $usedCourseCodes[strtolower($finalCode)] = true;

                $course = Course::create([
                    'curriculum_id' => $curriculum->id,
                    'course_code' => $finalCode,
                    'course_name' => $cNameIna,
                    'course_name_en' => $c['name_eng'] ?? $c['course_name_en'] ?? null,
                    'credits' => (int)($c['sks'] ?? $c['credits'] ?? 3),
                    'semester' => (int)($c['semester'] ?? 1),
                    'category' => $category,
                ]);

                $courseMapByName[$cNameKey] = $course;
                $courseMapByCode[strtolower(trim($finalCode))] = $course;
                if ($rawCode !== $finalCode) {
                    $courseMapByCode[strtolower(trim($rawCode))] = $course;
                }
            }

            $ploMapByCode = [];
            $plosData = $payload['plos'] ?? [];
            $usedPloCodes = [];

            foreach ($plosData as $p) {
                $rawPloCode = strtoupper(trim((string)($p['code'] ?? $p['plo_code'] ?? '')));
                if ($rawPloCode === '' || $rawPloCode === '-') {
                    $rawPloCode = 'PLO_' . (count($usedPloCodes) + 1);
                }

                $finalPloCode = $rawPloCode;
                $counter = 1;
                while (Plo::where('curriculum_id', $curriculum->id)->where('code', $finalPloCode)->exists() || isset($usedPloCodes[$finalPloCode])) {
                    $finalPloCode = $rawPloCode . '_' . $counter;
                    $counter++;
                }
                $usedPloCodes[$finalPloCode] = true;

                $plo = Plo::create([
                    'curriculum_id' => $curriculum->id,
                    'code' => $finalPloCode,
                    'description' => $p['description'] ?? '',
                    'category' => $p['category'] ?? 'Umum',
                ]);

                $ploMapByCode[$finalPloCode] = $plo;
                if ($rawPloCode !== $finalPloCode) {
                    $ploMapByCode[$rawPloCode] = $plo;
                }
            }

            $closMappingData = $payload['clos_mapping'] ?? [];
            $closByCourseId = [];

            foreach ($closMappingData as $cloRow) {
                $cNameKey = strtolower(trim($cloRow['course_name'] ?? ''));
                $targetCourse = $courseMapByName[$cNameKey] ?? null;

                if (!$targetCourse && isset($cloRow['course_code'])) {
                    $targetCourse = $courseMapByCode[strtolower(trim($cloRow['course_code']))] ?? null;
                }

                if ($targetCourse) {
                    $closByCourseId[$targetCourse->id][] = $cloRow;
                }
            }

            foreach ($closByCourseId as $courseId => $cloRows) {
                $course = Course::find($courseId);
                foreach ($cloRows as $cloRow) {
                    $rawCloCode = trim($cloRow['clo_code'] ?? $cloRow['clo_number'] ?? 'CLO1');
                    $rawPloCode = trim($cloRow['plo_code'] ?? '');
                    $extracted = $this->extractCloCodeParts($rawCloCode, $rawPloCode);

                    $clo = Clo::firstOrCreate([
                        'kode' => $extracted['clo_code'],
                    ], [
                        'deskripsi' => $cloRow['description'] ?? '',
                        'bloom' => $cloRow['bloom'] ?? null,
                    ]);

                    if (!$clo->bloom && !empty($cloRow['bloom'])) {
                        $clo->update(['bloom' => strtoupper($cloRow['bloom'])]);
                    }
                    if ((!$clo->deskripsi || $clo->deskripsi === '') && !empty($cloRow['description'])) {
                        $clo->update(['deskripsi' => $cloRow['description']]);
                    }

                    if ($course) {
                        $course->clo()->syncWithoutDetaching([$clo->id]);
                    }

                    $ploCode = $extracted['plo_code'];
                    $targetPlo = $ploMapByCode[$ploCode] ?? null;

                    if ($targetPlo) {
                        // set plo relation on clo if model supports plo_id
                        if (in_array('plo_id', $clo->getFillable())) {
                            $clo->plo_id = $targetPlo->id;
                            $clo->save();
                        }
                    }
                }
            }

            $userId = Auth::id();
            $this->activityLogService->log(
                $userId,
                'IMPORT',
                'CURRICULUM',
                "Mengimpor Kurikulum {$curriculum->code} ({$curriculum->name}) beserta Mata Kuliah, PLO, dan Pemetaan CLO melalui Wizard",
                [
                    'curriculum_id' => $curriculum->id,
                    'code' => $curriculum->code,
                    'name' => $curriculum->name,
                    'total_courses' => count($coursesData),
                    'total_plos' => count($plosData),
                    'total_clos_mapping' => count($closMappingData),
                ]
            );

            return Curriculum::with(['courses.clos.plos', 'plos'])->find($curriculum->id);
        });
    }

    protected function extractCloCodeParts(string $rawCloCode, string $rawPloCode = ''): array
    {
        $rawCloCode = trim($rawCloCode);
        $rawPloCode = trim($rawPloCode);

        if (str_contains($rawCloCode, '-')) {
            $parts = explode('-', $rawCloCode, 2);
            $extractedPlo = strtoupper(trim($parts[0]));
            $extractedClo = trim($parts[1]);

            $finalPloCode = $rawPloCode !== '' ? strtoupper($rawPloCode) : $extractedPlo;
            $finalCloNumber = $extractedClo !== '' ? $extractedClo : $rawCloCode;

            return [
                'plo_code' => $finalPloCode,
                'clo_code' => $finalCloNumber,
            ];
        }

        return [
            'plo_code' => strtoupper($rawPloCode),
            'clo_code' => $rawCloCode,
        ];
    }
}
