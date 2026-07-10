<?php

namespace App\Services;

use App\Repositories\Contracts\BeritaAcaraRepositoryContract;
use App\Repositories\Contracts\VerificationRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Models\BeritaAcara;
use App\Models\User;
use App\Enums\PrintType;
use App\Exceptions\BusinessException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class BeritaAcaraService
{
    protected BeritaAcaraRepositoryContract $beritaAcaraRepository;
    protected VerificationRepositoryContract $verificationRepository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        BeritaAcaraRepositoryContract $beritaAcaraRepository,
        VerificationRepositoryContract $verificationRepository,
        PeriodeRepositoryContract $periodeRepository,
        ActivityLogService $activityLogService
    ) {
        $this->beritaAcaraRepository = $beritaAcaraRepository;
        $this->verificationRepository = $verificationRepository;
        $this->periodeRepository = $periodeRepository;
        $this->activityLogService = $activityLogService;
    }

    public function generate(int $periodeId, User $verifier): BeritaAcara
    {
        $periode = $this->periodeRepository->findById($periodeId);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
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
                'file_pdf' => null, // Mulai dari null, dicache saat print pertama kali
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
            ]);
        });

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
