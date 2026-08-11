<?php

namespace App\Services;

use App\Repositories\Contracts\PloRepositoryContract;
use App\Models\ProgramStudi;
use App\Models\Plo;
use App\Models\User;
use App\Exceptions\BusinessException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class PloImportService
{
    protected PloRepositoryContract $ploRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        PloRepositoryContract $ploRepository,
        ActivityLogService $activityLogService
    ) {
        $this->ploRepository = $ploRepository;
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
        $expected = ['kode_plo', 'deskripsi', 'kode_prodi'];
        foreach ($expected as $index => $header) {
            $col = chr(ord('A') + $index);
            if (!isset($headers[$col]) || strtolower($headers[$col]) !== $header) {
                throw new BusinessException('Header Excel tidak sesuai. Harus: kode_plo, deskripsi, kode_prodi.');
            }
        }

        $data = [];
        $errors = [];
        $rowNumber = 2;
        foreach (array_slice($rows, 1) as $row) {
            $kodePlo = trim($row['A'] ?? '');
            $deskripsi = trim($row['B'] ?? '');
            $kodeProdi = trim($row['C'] ?? '');

            $rowErrors = [];
            if ($kodePlo === '') {
                $rowErrors[] = 'kode_plo tidak boleh kosong.';
            }
            if ($deskripsi === '') {
                $rowErrors[] = 'deskripsi tidak boleh kosong.';
            }
            if ($kodeProdi === '') {
                $rowErrors[] = 'kode_prodi tidak boleh kosong.';
            }

            $programStudi = null;
            if ($kodeProdi !== '') {
                $programStudi = ProgramStudi::where('kode_prodi', $kodeProdi)
                    ->orWhere('nama_prodi', 'like', "%{$kodeProdi}%")
                    ->first();
                if (!$programStudi) {
                    $rowErrors[] = "Program Studi dengan kode_prodi '{$kodeProdi}' tidak ditemukan.";
                }
            }

            if ($programStudi && $kodePlo !== '') {
                $exists = Plo::where('kode', $kodePlo)
                    ->where('prodi_id', $programStudi->id)
                    ->exists();
                if ($exists) {
                    $rowErrors[] = "PLO '{$kodePlo}' sudah ada untuk Program Studi {$programStudi->kode_prodi}.";
                }
            }

            $status = count($rowErrors) === 0 ? 'valid' : 'invalid';
            if ($status === 'invalid') {
                $errors[] = [
                    'row' => $rowNumber,
                    'kode_plo' => $kodePlo,
                    'deskripsi' => $deskripsi,
                    'kode_prodi' => $kodeProdi,
                    'errors' => $rowErrors,
                ];
            }

            $data[] = [
                'row' => $rowNumber,
                'kode_plo' => $kodePlo,
                'deskripsi' => $deskripsi,
                'kode_prodi' => $kodeProdi,
                'program_studi_id' => $programStudi?->id,
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
                $programStudi = ProgramStudi::where('kode_prodi', $row['kode_prodi'])
                    ->orWhere('nama_prodi', 'like', "%{$row['kode_prodi']}%")
                    ->first();

                if (!$programStudi) {
                    throw new BusinessException("Program Studi dengan kode_prodi '{$row['kode_prodi']}' tidak ditemukan.");
                }

                $plo = Plo::create([
                    'kode' => $row['kode_plo'],
                    'deskripsi' => $row['deskripsi'],
                    'prodi_id' => $programStudi->id,
                    'created_by' => $user->id,
                ]);

                $created++;
            }
        });

        $this->activityLogService->log("Mengimpor {$created} data PLO dari Excel.", 'PLO', $user->id);

        return [
            'created' => $created,
            'total' => $preview['total'],
        ];
    }
}
