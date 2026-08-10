<?php

namespace App\Services;

use App\Repositories\Contracts\PenugasanRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Models\User;
use App\Models\Penugasan;
use App\Exceptions\BusinessException;
use App\Enums\NotificationType;
use Illuminate\Support\Facades\DB;

class PenugasanDosenService
{
    protected PenugasanRepositoryContract $penugasanRepository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected ActivityLogService $activityLogService;
    protected NotifikasiService $notifikasiService;

    public function __construct(
        PenugasanRepositoryContract $penugasanRepository,
        PeriodeRepositoryContract $periodeRepository,
        ActivityLogService $activityLogService,
        NotifikasiService $notifikasiService
    ) {
        $this->penugasanRepository = $penugasanRepository;
        $this->periodeRepository = $periodeRepository;
        $this->activityLogService = $activityLogService;
        $this->notifikasiService = $notifikasiService;
    }

    /**
     * Daftarkan Dosen-Dosen Target yang akan diverifikasi oleh PIC Verifikator.
     *
     * @param  array{periode_id: int, verifier_id: int, target_dosen_ids: int[]}  $data
     * @param  User  $assignedBy
     * @return array
     */
    public function assign(array $data, User $assignedBy): array
    {
        $periodeId      = (int) $data['periode_id'];
        $verifierId     = (int) $data['verifier_id'];
        $targetDosenIds = $data['target_dosen_ids'];

        $periode = $this->periodeRepository->findById($periodeId);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
        }

        $verifier = User::find($verifierId);
        if (!$verifier) {
            throw new BusinessException('Verifier PIC tidak ditemukan.', 404);
        }

        $assignments = DB::transaction(function () use ($periodeId, $verifierId, $targetDosenIds, $assignedBy, $verifier, $periode) {
            $created = [];
            foreach ($targetDosenIds as $targetId) {
                $targetId = (int) $targetId;

                // BR-003: PIC dilarang memverifikasi soal buatannya sendiri
                if ($verifierId === $targetId) {
                    throw new BusinessException('PIC tidak boleh memverifikasi soal buatannya sendiri.', 422);
                }

                // Cek apakah target dosen sudah diassign ke verifier lain
                if ($this->penugasanRepository->isTargetAssignedToOtherVerifier($targetId, $periodeId, $verifierId)) {
                    $targetDosen = User::find($targetId);
                    $nama = $targetDosen ? $targetDosen->nama_lengkap : "ID {$targetId}";
                    throw new BusinessException("Dosen {$nama} sudah ditugaskan ke verifikator lain pada periode ini.", 422);
                }

                // Buat atau abaikan jika sudah diassign ke verifier ini
                $existing = Penugasan::where('periode_id', $periodeId)
                    ->where('verifier_id', $verifierId)
                    ->where('target_dosen_id', $targetId)
                    ->first();

                if (!$existing) {
                    $newAssignment = $this->penugasanRepository->create([
                        'periode_id'      => $periodeId,
                        'verifier_id'     => $verifierId,
                        'target_dosen_id' => $targetId,
                        'assigned_by'     => $assignedBy->id,
                        'assigned_at'     => now(),
                    ]);
                    $created[] = $newAssignment;

                    // Kirim notifikasi khusus ke akun dosen target
                    $targetUser = User::find($targetId);
                    if ($targetUser) {
                        $verifierName = $verifier ? $verifier->nama_lengkap : ($assignedBy->nama_lengkap ?? 'Dosen Verifikator');
                        $periodeName  = $periode ? $periode->nama_periode : 'periode ini';

                        $this->notifikasiService->kirim(
                            $targetId,
                            'Penugasan Dosen Target Verifikasi',
                            "Anda telah ditetapkan sebagai Dosen Target pengampu mata kuliah pada {$periodeName}. Soal ujian Anda akan diverifikasi oleh Dosen Verifikator ({$verifierName}). Silakan siapkan dan unggah berkas soal Anda pada menu Soal Saya.",
                            NotificationType::Info,
                            'penugasan_dosen',
                            $newAssignment->id
                        );
                    }
                }
            }
            return $created;
        });

        $this->activityLogService->log(
            "Memetakan " . count($targetDosenIds) . " Dosen Target ke PIC ID {$verifierId} untuk periode ID {$periodeId}.",
            'Pemetaan PIC',
            $assignedBy->id
        );

        return [
            'success' => true,
            'message' => 'Pemetaan Dosen Target ke PIC berhasil disimpan.',
            'data'    => $assignments,
        ];
    }

    /**
     * Cabut tugas verifikasi Dosen Target dari PIC.
     */
    public function cabut(int $id, User $currentUser): void
    {
        $penugasan = $this->penugasanRepository->findById($id);
        if (!$penugasan) {
            throw new BusinessException('Penugasan Dosen Target tidak ditemukan.', 404);
        }

        $this->penugasanRepository->delete($penugasan);

        $this->activityLogService->log(
            "Mencabut tugas verifikasi dosen target ID {$penugasan->target_dosen_id} dari PIC ID {$penugasan->verifier_id}.",
            'Pemetaan PIC',
            $currentUser->id
        );
    }
}
