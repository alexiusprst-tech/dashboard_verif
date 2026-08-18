<?php

namespace App\Services;

use App\Repositories\Contracts\PenugasanKoordinatorRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Models\PenugasanKoordinator;
use App\Models\User;
use App\Exceptions\BusinessException;
use App\Enums\NotificationType;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

class PenugasanKoordinatorService
{
    public function __construct(
        protected PenugasanKoordinatorRepositoryContract $penugasanRepository,
        protected PeriodeRepositoryContract $periodeRepository,
        protected ActivityLogService $activityLogService,
        protected NotifikasiService $notifikasiService
    ) {}

    /**
     * Assign dosen sebagai Koordinator MK pada mata kuliah & periode tertentu.
     *
     * @param  array{periode_id: int, course_id: int, dosen_id: int, suppress_notification?: bool}  $data
     * @param  User  $assignedBy
     */
    public function assign(array $data, User $assignedBy): PenugasanKoordinator
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
                $assignment = $this->penugasanRepository->assignKoordinator($courseId, $dosenId, $periodeId, $assignedBy->id);

                // Update role flag is_koordinator_mk pada user terkait
                User::where('id', $dosenId)->update([
                    'is_koordinator_mk' => true,
                    'is_coordinator'    => true,
                ]);

                return $assignment;
            } catch (\Exception $e) {
                if (
                    str_contains($e->getMessage(), 'penugasan_koordinator_unique')
                    || $e instanceof UniqueConstraintViolationException
                ) {
                    throw new BusinessException('Dosen ini sudah ditugaskan sebagai Koordinator pada mata kuliah tersebut.', 422);
                }
                throw $e;
            }
        });

        $this->activityLogService->log(
            "Menugaskan Dosen ID {$dosenId} sebagai Koordinator MK untuk Mata Kuliah ID {$courseId} (periode ID {$periodeId}).",
            'Penugasan Koordinator MK',
            $assignedBy->id
        );

        $penugasanLoaded = $penugasan->load(['course', 'dosen', 'periode', 'assignedBy']);

        // Kirim notifikasi khusus ke dosen yang ditugaskan sebagai Koordinator MK
        $suppress = (bool) ($data['suppress_notification'] ?? false);
        if (!$suppress && $penugasanLoaded->dosen) {
            $courseName  = $penugasanLoaded->course ? "{$penugasanLoaded->course->nama_mk} ({$penugasanLoaded->course->kode_mk})" : 'Mata Kuliah';
            $periodeName = $penugasanLoaded->periode ? $penugasanLoaded->periode->nama_periode : 'periode ini';

            $this->notifikasiService->kirim(
                $penugasanLoaded->dosen_id,
                'Penugasan Koordinator Mata Kuliah',
                "Anda telah ditugaskan oleh Administrator sebagai Dosen Koordinator Mata Kuliah untuk {$courseName} pada {$periodeName}.",
                NotificationType::Verifikasi,
                'penugasan_koordinator',
                $penugasanLoaded->id
            );
        }

        return $penugasanLoaded;
    }

    /**
     * Cabut penugasan koordinator.
     */
    public function cabut(int $id, User $user): void
    {
        $penugasan = $this->penugasanRepository->findById($id);
        if (!$penugasan) {
            throw new BusinessException('Penugasan koordinator tidak ditemukan.', 404);
        }

        $dosenId   = $penugasan->dosen_id;
        $periodeId = $penugasan->periode_id;
        $courseId  = $penugasan->course_id;

        DB::transaction(function () use ($penugasan, $dosenId) {
            $this->penugasanRepository->revokeKoordinator($penugasan);

            // Cek apakah dosen masih memiliki penugasan koordinator lain
            $remaining = $this->penugasanRepository->countActiveAssignmentsByDosen($dosenId);
            if ($remaining === 0) {
                // Jika tidak ada penugasan koordinator lagi, nonaktifkan flag is_koordinator_mk (jika bukan super admin)
                $dosen = User::find($dosenId);
                if ($dosen && !$dosen->is_super_admin) {
                    $dosen->update([
                        'is_koordinator_mk' => false,
                        'is_coordinator'    => false,
                    ]);
                }
            }
        });

        $this->activityLogService->log(
            "Mencabut penugasan Koordinator MK Dosen ID {$dosenId} pada Mata Kuliah ID {$courseId} (periode ID {$periodeId}).",
            'Penugasan Koordinator MK',
            $user->id
        );
    }
}
