<?php

namespace App\Services;

use App\Models\Clo;
use App\Models\Course;
use App\Models\Plo;
use App\Models\ProgramStudi;
use App\Models\User;
use App\Exceptions\BusinessException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class CloImportService
{
    protected ActivityLogService $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }

    public function preview(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getPathname());
        $sheet = $spreadsheet->getActiveSheet();
        $rows = $sheet->toArray(null, true, true, true);

        if (count($rows) < 2) {
            throw new BusinessException('File Excel tidak berisi data.');
        }

        $headers = array_map('strtolower', array_map('trim', $rows[1]));
        $expected = ['kode_mk', 'kode_clo', 'deskripsi', 'kode_plo'];
        foreach ($expected as $index => $header) {
            $col = chr(ord('A') + $index);
            if (!isset($headers[$col]) || strtolower($headers[$col]) !== $header) {
                throw new BusinessException('Header Excel tidak sesuai. Harus: kode_mk, kode_clo, deskripsi, kode_plo.');
            }
        }

        $data = [];
        $errors = [];
        $rowNumber = 2;
        foreach (array_slice($rows, 1) as $row) {
            $kodeMk = trim($row['A'] ?? '');
            $kodeClo = trim($row['B'] ?? '');
            $deskripsi = trim($row['C'] ?? '');
            $kodePlo = trim($row['D'] ?? '');

            $rowErrors = [];
            if ($kodeMk === '') {
                $rowErrors[] = 'kode_mk tidak boleh kosong.';
            }
            if ($kodeClo === '') {
                $rowErrors[] = 'kode_clo tidak boleh kosong.';
            }
            if ($deskripsi === '') {
                $rowErrors[] = 'deskripsi tidak boleh kosong.';
            }
            if ($kodePlo === '') {
                $rowErrors[] = 'kode_plo tidak boleh kosong.';
            }

            $course = null;
            if ($kodeMk !== '') {
                $course = Course::where('kode_mk', $kodeMk)->first();
                if (!$course) {
                    $rowErrors[] = "Mata Kuliah dengan kode_mk '{$kodeMk}' tidak ditemukan.";
                }
            }

            $plo = null;
            if ($kodePlo !== '') {
                $plo = Plo::where('kode', $kodePlo)->first();
                if (!$plo) {
                    $rowErrors[] = "PLO dengan kode_plo '{$kodePlo}' tidak ditemukan.";
                }
            }

            if ($course && $plo) {
                $pto = ProgramStudi::find($course->prodi_id);
                if ($pto && $plo->prodi_id !== $pto->id) {
                    $rowErrors[] = "PLO '{$kodePlo}' tidak cocok dengan Program Studi Mata Kuliah {$course->kode_mk}.";
                }
            }

            if ($course && $kodeClo !== '') {
                $exists = Clo::where('kode', $kodeClo)
                    ->whereHas('courses', function ($q) use ($course) {
                        $q->where('courses.id', $course->id);
                    })
                    ->exists();
                if ($exists) {
                    $rowErrors[] = "CLO '{$kodeClo}' sudah ada untuk Mata Kuliah {$course->kode_mk}.";
                }
            }

            $status = count($rowErrors) === 0 ? 'valid' : 'invalid';
            if ($status === 'invalid') {
                $errors[] = [
                    'row' => $rowNumber,
                    'kode_mk' => $kodeMk,
                    'kode_clo' => $kodeClo,
                    'deskripsi' => $deskripsi,
                    'kode_plo' => $kodePlo,
                    'errors' => $rowErrors,
                ];
            }

            $data[] = [
                'row' => $rowNumber,
                'kode_mk' => $kodeMk,
                'kode_clo' => $kodeClo,
                'deskripsi' => $deskripsi,
                'kode_plo' => $kodePlo,
                'course_id' => $course?->id,
                'plo_id' => $plo?->id,
                'status' => $status,
                'errors' => $rowErrors,
            ];

            $rowNumber++;
        }

        return [
            'total' => count($data),
            'valid' => count($data) - count($errors),
            'invalid' => count($errors),
            'rows' => $data,
            'errors' => $errors,
        ];
    }

    public function import(UploadedFile $file, User $user): array
    {
        $preview = $this->preview($file);
        if ($preview['invalid'] > 0) {
            throw new BusinessException('File Excel berisi baris yang tidak valid. Perbaiki terlebih dahulu.');
        }

        $created = 0;
        DB::transaction(function () use ($preview, $user, &$created) {
            foreach ($preview['rows'] as $row) {
                $course = Course::where('kode_mk', $row['kode_mk'])->first();
                $plo = Plo::where('kode', $row['kode_plo'])->first();

                if (!$course || !$plo) {
                    throw new BusinessException('Referensi mata kuliah atau PLO tidak ditemukan saat import.');
                }

                $clo = Clo::create([
                    'kode' => $row['kode_clo'],
                    'deskripsi' => $row['deskripsi'],
                    'plo_id' => $plo->id,
                    'created_by' => $user->id,
                ]);

                $clo->courses()->syncWithoutDetaching([$course->id]);
                $created++;
            }
        });

        $this->activityLogService->log("Mengimpor {$created} data CLO dari Excel.", 'CLO', $user->id);

        return [
            'created' => $created,
            'total' => $preview['total'],
        ];
    }
}
