<?php

namespace App\Services;

use App\Repositories\Contracts\BeritaAcaraRepositoryContract;
use App\Repositories\Contracts\VerificationRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Repositories\Contracts\BeritaAcaraTemplateRepositoryContract;
use App\Models\BeritaAcara;
use App\Models\User;
use App\Enums\PrintType;
use App\Exceptions\BusinessException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class BeritaAcaraService
{
    protected BeritaAcaraRepositoryContract $beritaAcaraRepository;
    protected VerificationRepositoryContract $verificationRepository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected ActivityLogService $activityLogService;
    protected BeritaAcaraTemplateRepositoryContract $templateBaRepository;

    public function __construct(
        BeritaAcaraRepositoryContract $beritaAcaraRepository,
        VerificationRepositoryContract $verificationRepository,
        PeriodeRepositoryContract $periodeRepository,
        ActivityLogService $activityLogService,
        BeritaAcaraTemplateRepositoryContract $templateBaRepository
    ) {
        $this->beritaAcaraRepository = $beritaAcaraRepository;
        $this->verificationRepository = $verificationRepository;
        $this->periodeRepository = $periodeRepository;
        $this->activityLogService = $activityLogService;
        $this->templateBaRepository = $templateBaRepository;
    }

    /**
     * Generate the DOCX file for a Berita Acara based on the active template.
     */
    protected function generateDocxFile(BeritaAcara $ba, \App\Models\Periode $periode, User $verifier): string
    {
        $template = $this->templateBaRepository->findActive();
        if (!$template) {
            throw new BusinessException('Template Berita Acara belum tersedia.', 422);
        }

        $templatePath = Storage::disk('local')->path($template->file_path);
        if (!Storage::disk('local')->exists($template->file_path)) {
            throw new BusinessException('Template Berita Acara tidak ditemukan di disk.', 422);
        }

        try {
            $templateProcessor = new \PhpOffice\PhpWord\TemplateProcessor($templatePath);
        } catch (\Exception $e) {
            throw new BusinessException('Template tidak dapat diproses.', 500);
        }

        // Get snapshot/current items
        $items = $this->beritaAcaraRepository->findById($ba->id)->items;

        // Prep data for placeholders
        $variables = $templateProcessor->getVariables();

        $singlePlaceholders = [
            'nomor_ba' => $ba->nomor_ba,
            'periode' => $periode->nama_periode,
            'nama_pic' => $verifier->nama_lengkap ?? $verifier->name,
            'tanggal' => now()->translatedFormat('d F Y'),
        ];

        foreach ($singlePlaceholders as $key => $val) {
            if (in_array($key, $variables)) {
                $templateProcessor->setValue($key, $val);
            } else {
                Log::warning("Placeholder '{$key}' not found in Berita Acara template.");
            }
        }

        // If there are items, clone the row
        if ($items->isNotEmpty()) {
            if (in_array('nama_dosen', $variables)) {
                try {
                    $templateProcessor->cloneRow('nama_dosen', $items->count());
                    foreach ($items as $index => $item) {
                        $rowNum = $index + 1;
                        $soal = $item->soal;
                        $dosenName = $soal && $soal->dosen ? ($soal->dosen->nama_lengkap ?? $soal->dosen->name) : '—';
                        $statusText = $item->status_snapshot === 'approved' ? 'Disetujui' : ($item->status_snapshot === 'revisi' ? 'Perlu Revisi' : 'Ditolak');

                        $templateProcessor->setValue("nama_dosen#{$rowNum}", $dosenName);
                        $templateProcessor->setValue("status#{$rowNum}", $statusText);
                        $templateProcessor->setValue("catatan#{$rowNum}", $item->catatan_snapshot ?? '—');
                    }
                } catch (\Exception $e) {
                    Log::warning("Failed to clone row 'nama_dosen' in Berita Acara template: " . $e->getMessage());
                }
            } else {
                Log::warning("Placeholder 'nama_dosen' for rows cloning not found in Berita Acara template.");
            }
        }

        // Save generated file
        $generatedFolder = 'generated/ba';
        if (!Storage::disk('local')->exists($generatedFolder)) {
            Storage::disk('local')->makeDirectory($generatedFolder);
        }

        $fileName = 'ba_' . $ba->id . '_' . time() . '.docx';
        $relativeFilePath = $generatedFolder . '/' . $fileName;
        $outputPath = Storage::disk('local')->path($relativeFilePath);

        try {
            $templateProcessor->saveAs($outputPath);
        } catch (\Exception $e) {
            throw new BusinessException('Gagal menyimpan file hasil generate.', 500);
        }

        return $relativeFilePath;
    }

    public function generate(int $periodeId, User $verifier): BeritaAcara
    {
        $periode = $this->periodeRepository->findById($periodeId);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
        }

        // Cek template aktif terlebih dahulu
        $template = $this->templateBaRepository->findActive();
        if (!$template) {
            throw new BusinessException('Template Berita Acara belum tersedia.', 422);
        }

        // Cek apakah sudah pernah digenerate sebelumnya
        $existingBa = $this->beritaAcaraRepository->findByVerifierAndPeriode($verifier->id, $periodeId);
        if ($existingBa) {
            throw new BusinessException('Berita Acara untuk periode ini sudah pernah digenerate. Gunakan opsi regenerate jika ada pembaruan.', 422);
        }

        // Ambil semua verifikasi 'approved' oleh PIC ini di periode ini
        $approvedVerifications = $this->verificationRepository->findApprovedForPicInPeriode($verifier->id, $periodeId);
        if ($approvedVerifications->isEmpty()) {
            throw new BusinessException('Tidak ditemukan soal yang telah disetujui (Approved) oleh Anda pada periode ini.', 422);
        }

        $nomorBa = $this->beritaAcaraRepository->generateNomorBA($periodeId);

        $beritaAcara = DB::transaction(function () use ($periodeId, $verifier, $nomorBa, $approvedVerifications) {
            $ba = $this->beritaAcaraRepository->create([
                'nomor_ba' => $nomorBa,
                'periode_id' => $periodeId,
                'verifier_id' => $verifier->id,
                'generated_at' => now(),
                'file_pdf' => null,
                'file_docx' => null,
            ]);

            $items = [];
            foreach ($approvedVerifications as $verif) {
                $items[] = [
                    'berita_acara_id' => $ba->id,
                    'soal_id' => $verif->soal_id,
                    'verification_id' => $verif->id,
                    'status_snapshot' => $verif->status->value,
                    'catatan_snapshot' => $verif->catatan,
                ];
            }

            $this->beritaAcaraRepository->insertItems($items);

            return $ba;
        });

        // Generate DOCX file
        $fileDocx = $this->generateDocxFile($beritaAcara, $periode, $verifier);

        $beritaAcara = $this->beritaAcaraRepository->update($beritaAcara, [
            'file_docx' => $fileDocx
        ]);

        $this->activityLogService->log(
            "Membangun Berita Acara nomor {$beritaAcara->nomor_ba} untuk periode ID {$periodeId}",
            'Berita Acara',
            $verifier->id
        );

        return $beritaAcara;
    }

    public function regenerate(int $id, User $verifier): BeritaAcara
    {
        $ba = $this->beritaAcaraRepository->findById($id);
        if (!$ba) {
            throw new BusinessException('Berita Acara tidak ditemukan.', 404);
        }

        if ($ba->verifier_id !== $verifier->id && !$verifier->isSuperAdmin()) {
            throw new BusinessException('Anda tidak berwenang untuk meregenerasi Berita Acara ini.', 403);
        }

        // Cek template aktif terlebih dahulu
        $template = $this->templateBaRepository->findActive();
        if (!$template) {
            throw new BusinessException('Template Berita Acara belum tersedia.', 422);
        }

        $approvedVerifications = $this->verificationRepository->findApprovedForPicInPeriode($ba->verifier_id, $ba->periode_id);
        if ($approvedVerifications->isEmpty()) {
            throw new BusinessException('Tidak ditemukan soal yang telah disetujui (Approved) pada periode ini untuk diregenerasi.', 422);
        }

        $ba = DB::transaction(function () use ($ba, $approvedVerifications) {
            // Hapus snapshot items lama
            $this->beritaAcaraRepository->deleteItems($ba->id);

            // Hapus file cache PDF lama dari disk jika ada
            if ($ba->file_pdf) {
                Storage::disk('public')->delete($ba->file_pdf);
            }

            // Hapus file DOCX lama dari disk jika ada
            if ($ba->file_docx && Storage::exists($ba->file_docx)) {
                Storage::delete($ba->file_docx);
            }

            // Insert snapshot baru
            $items = [];
            foreach ($approvedVerifications as $verif) {
                $items[] = [
                    'berita_acara_id' => $ba->id,
                    'soal_id' => $verif->soal_id,
                    'verification_id' => $verif->id,
                    'status_snapshot' => $verif->status->value,
                    'catatan_snapshot' => $verif->catatan,
                ];
            }
            $this->beritaAcaraRepository->insertItems($items);

            // Reset PDF path ke null agar digenerate ulang nanti
            return $this->beritaAcaraRepository->update($ba, [
                'generated_at' => now(),
                'file_pdf' => null,
                'file_docx' => null,
            ]);
        });

        // Generate DOCX file baru
        $fileDocx = $this->generateDocxFile($ba, $ba->periode, $verifier);

        $ba = $this->beritaAcaraRepository->update($ba, [
            'file_docx' => $fileDocx
        ]);

        $this->activityLogService->log(
            "Meregenerasi Berita Acara nomor {$ba->nomor_ba}",
            'Berita Acara',
            $verifier->id
        );

        return $ba;
    }

    public function print(int $id, string $type, User $user): string
    {
        $ba = $this->beritaAcaraRepository->findById($id);
        if (!$ba) {
            throw new BusinessException('Berita Acara tidak ditemukan.', 404);
        }

        if (!$user->isSuperAdmin() && $ba->verifier_id !== $user->id) {
            throw new BusinessException('Anda tidak berwenang untuk mengakses Berita Acara ini.', 403);
        }

        $printType = PrintType::from($type);

        // Jika type adalah 'ba' saja, kita bisa mengambil dari cache file_pdf jika sudah terbuat
        if ($printType === PrintType::Ba && $ba->file_pdf && Storage::disk('public')->exists($ba->file_pdf)) {
            return Storage::disk('public')->path($ba->file_pdf);
        }

        // Render PDF baru
        $pdf = Pdf::loadView('pdf.berita_acara', [
            'ba' => $ba,
            'printType' => $printType->value
        ]);

        $fileName = 'berita_acara_' . $ba->id . '_' . $printType->value . '_' . time() . '.pdf';
        $relativeFolder = 'berita_acara_pdf';
        
        // Simpan PDF ke disk public
        $relativeFilePath = $relativeFolder . '/' . $fileName;
        Storage::disk('public')->put($relativeFilePath, $pdf->output());

        if ($printType === PrintType::Ba) {
            // Update cache path untuk print 'ba' saja
            $this->beritaAcaraRepository->update($ba, ['file_pdf' => $relativeFilePath]);
        }

        $this->activityLogService->log(
            "Mencetak dokumen Berita Acara ID {$ba->id} tipe {$printType->value}",
            'Berita Acara',
            $user->id
        );

        return Storage::disk('public')->path($relativeFilePath);
    }
}
