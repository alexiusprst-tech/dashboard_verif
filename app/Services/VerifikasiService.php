<?php

namespace App\Services;

use App\Repositories\Contracts\VerificationRepositoryContract;
use App\Repositories\Contracts\SoalRepositoryContract;
use App\Models\Verification;
use App\Models\Soal;
use App\Models\User;
use App\Enums\VerifikasiStatus;
use App\Enums\SoalStatus;
use App\Enums\TipeVerifikator;
use App\Enums\NotificationType;
use App\Exceptions\BusinessException;
use Illuminate\Support\Facades\DB;

class VerifikasiService
{
    protected VerificationRepositoryContract $verificationRepository;
    protected SoalRepositoryContract $soalRepository;
    protected NotifikasiService $notifikasiService;
    protected ActivityLogService $activityLogService;

    public function __construct(
        VerificationRepositoryContract $verificationRepository,
        SoalRepositoryContract $soalRepository,
        NotifikasiService $notifikasiService,
        ActivityLogService $activityLogService
    ) {
        $this->verificationRepository = $verificationRepository;
        $this->soalRepository = $soalRepository;
        $this->notifikasiService = $notifikasiService;
        $this->activityLogService = $activityLogService;
    }

    public function submit(int $soalId, array $data, User $verifier): Verification
    {
        $soal = $this->soalRepository->findById($soalId);
        if (!$soal) {
            throw new BusinessException('Soal tidak ditemukan.', 404);
        }

        if ($soal->status === SoalStatus::Approved) {
            throw new BusinessException('Soal sudah disetujui (Approved) dan tidak dapat diverifikasi kembali.', 422);
        }

        $tipeVerifikator = 'pic';
        $status = VerifikasiStatus::from($data['status']);

        $verification = DB::transaction(function () use ($soal, $verifier, $tipeVerifikator, $status, $data) {
            // Save verification
            $verif = $this->verificationRepository->create([
                'soal_id' => $soal->id,
                'verifier_id' => $verifier->id,
                'tipe_verifikator' => $tipeVerifikator,
                'status' => $status->value,
                'catatan' => $data['catatan'] ?? null,
                'verified_at' => now(),
            ]);

            // Update status soal
            $this->soalRepository->update($soal, [
                'status' => $status->toSoalStatus()->value
            ]);

            return $verif;
        });

        // Kirim notifikasi ke dosen pembuat soal
        $tipeVerifLabel = 'PIC';
        $statusLabel = $status->label();
        
        $this->notifikasiService->kirim(
            $soal->dosen_id,
            "Hasil Verifikasi Soal: {$statusLabel}",
            "Soal ujian Anda '{$soal->judul_soal}' telah diverifikasi oleh {$tipeVerifLabel} dengan hasil: {$statusLabel}.",
            NotificationType::Verifikasi,
            'soal',
            $soal->id
        );

        $this->activityLogService->log(
            "Melakukan verifikasi soal ID {$soal->id} dengan hasil {$status->value} sebagai {$tipeVerifikator}",
            'Verifikasi Soal',
            $verifier->id
        );

        return $verification;
    }
}
