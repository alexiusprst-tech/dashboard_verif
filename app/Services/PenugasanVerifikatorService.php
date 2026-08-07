<?php

namespace App\Services;

use App\Repositories\Contracts\PenugasanVerifikatorRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Models\PenugasanVerifikator;
use App\Models\User;
use App\Exceptions\BusinessException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

use App\Enums\NotificationType;

class PenugasanVerifikatorService
{
    public function __construct(
        protected PenugasanVerifikatorRepositoryContract $penugasanRepository,
        protected PeriodeRepositoryContract $periodeRepository,
        protected ActivityLogService $activityLogService,
        protected NotifikasiService $notifikasiService
    ) {}

    /**
     * Assign dosen verifikator ke mata kuliah pada periode tertentu.
     *
     * @param  array{periode_id: int, course_id: int, dosen_id: int}  $data
     * @param  User  $assignedBy
     */
    public function assign(array $data, User $assignedBy): PenugasanVerifikator
    {
        $periodeId = (int) $data['periode_id'];
        $courseId  = (int) $data['course_id'];
        $dosenId   = (int) $data['dosen_id'];

        $periode = $this->periodeRepository->findById($periodeId);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
        }

        $penugasan = DB::transaction(function () use ($courseId, $dosenId, $periodeId, $assignedBy) {
            try {
                return $this->penugasanRepository->assignVerifikator($courseId, $dosenId, $periodeId, $assignedBy->id);
            } catch (\Exception $e) {
                if (
                    str_contains($e->getMessage(), 'penugasan_verifikator_unique')
                    || $e instanceof UniqueConstraintViolationException
                ) {
                    throw new BusinessException('Dosen ini sudah ditugaskan sebagai verifikator pada mata kuliah tersebut.', 422);
                }
                throw $e;
            }
        });

        $this->activityLogService->log(
            "Menugaskan Dosen ID {$dosenId} sebagai verifikator untuk Mata Kuliah ID {$courseId} (periode ID {$periodeId}).",
            'Penugasan Verifikator',
            $assignedBy->id
        );

        $penugasanLoaded = $penugasan->load(['course', 'dosen', 'periode', 'assignedBy']);

        // Kirim notifikasi khusus ke dosen yang ditugaskan sebagai verifikator
        // (dilewati jika suppress_notification=true, karena controller akan kirim notifikasi ringkasan)
        $suppress = (bool) ($data['suppress_notification'] ?? false);
        if (!$suppress && $penugasanLoaded->dosen) {
            $courseName  = $penugasanLoaded->course ? "{$penugasanLoaded->course->nama_mk} ({$penugasanLoaded->course->kode_mk})" : 'Mata Kuliah';
            $periodeName = $penugasanLoaded->periode ? $penugasanLoaded->periode->nama_periode : 'periode ini';

            $this->notifikasiService->kirim(
                $penugasanLoaded->dosen_id,
                'Penugasan Dosen Verifikator',
                "Anda telah ditugaskan oleh Administrator sebagai Dosen Verifikator untuk mata kuliah {$courseName} pada {$periodeName}. Silakan periksa tugas verifikasi Anda pada menu Verifikasi Soal.",
                NotificationType::Verifikasi,
                'penugasan_verifikator',
                $penugasanLoaded->id
            );
        }

        return $penugasanLoaded;
    }

    /**
     * Cabut penugasan verifikator.
     */
    public function cabut(int $id, User $user): void
    {
        $penugasan = $this->penugasanRepository->findById($id);
        if (!$penugasan) {
            throw new BusinessException('Penugasan verifikator tidak ditemukan.', 404);
        }

        // Hapus seluruh penugasan verifikator untuk dosen ini di periode terkait
        PenugasanVerifikator::where('dosen_id', $penugasan->dosen_id)
            ->where('periode_id', $penugasan->periode_id)
            ->delete();

        $this->activityLogService->log(
            "Mencabut penugasan verifikator Dosen ID {$penugasan->dosen_id} pada periode ID {$penugasan->periode_id}.",
            'Penugasan Verifikator',
            $user->id
        );
    }
}
