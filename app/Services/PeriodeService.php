<?php

namespace App\Services;

use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Models\Periode;
use App\Models\User;
use App\Enums\PeriodeStatus;
use App\Exceptions\BusinessException;
use Illuminate\Support\Facades\DB;

use App\Services\NotifikasiService;
use App\Enums\NotificationType;

class PeriodeService
{
    protected PeriodeRepositoryContract $periodeRepository;
    protected ActivityLogService $activityLogService;
    protected NotifikasiService $notifikasiService;

    public function __construct(
        PeriodeRepositoryContract $periodeRepository,
        ActivityLogService $activityLogService,
        NotifikasiService $notifikasiService
    ) {
        $this->periodeRepository = $periodeRepository;
        $this->activityLogService = $activityLogService;
        $this->notifikasiService = $notifikasiService;
    }

    private function normalizeSemester(?string $semester): string
    {
        if (!$semester) {
            return 'ganjil';
        }
        $val = strtolower(trim($semester));
        if ($val === '1' || str_contains($val, 'ganjil')) {
            return 'ganjil';
        }
        if ($val === '2' || str_contains($val, 'genap')) {
            return 'genap';
        }
        return 'ganjil';
    }

    public function create(array $data, User $user): Periode
    {
        if (strtotime($data['tanggal_deadline']) <= strtotime($data['tanggal_mulai'])) {
            throw new BusinessException('Tanggal deadline harus setelah tanggal mulai.', 422);
        }

        $data['semester'] = $this->normalizeSemester($data['semester'] ?? null);

        $periode = $this->periodeRepository->create($data);

        $this->activityLogService->log("Membuat periode baru: {$periode->nama_periode}", 'Periode', $user->id);

        return $periode;
    }

    public function update(int $id, array $data, User $user): Periode
    {
        $periode = $this->periodeRepository->findById($id);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
        }

        if (isset($data['tanggal_mulai'], $data['tanggal_deadline'])) {
            if (strtotime($data['tanggal_deadline']) <= strtotime($data['tanggal_mulai'])) {
                throw new BusinessException('Tanggal deadline harus setelah tanggal mulai.', 422);
            }
        }

        if (isset($data['semester'])) {
            $data['semester'] = $this->normalizeSemester($data['semester']);
        }

        $periode = $this->periodeRepository->update($periode, $data);

        $this->activityLogService->log("Mengubah periode: {$periode->nama_periode}", 'Periode', $user->id);

        return $periode;
    }

    public function activate(int $id, User $user): Periode
    {
        $periode = $this->periodeRepository->findById($id);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
        }

        DB::transaction(function () use ($periode, $id) {
            // Deactivate all other periods
            $this->periodeRepository->deactivateAll();

            // Set current active
            $this->periodeRepository->update($periode, ['status' => PeriodeStatus::Aktif->value]);
        });

        $periode = $periode->fresh();

        $this->activityLogService->log("Mengaktifkan periode: {$periode->nama_periode}", 'Periode', $user->id);

        // Ambil semua ID Koordinator yang aktif
        $coordinatorIds = User::where('is_coordinator', true)
            ->where('status_aktif', true)
            ->pluck('id')
            ->toArray();

        if (!empty($coordinatorIds)) {
            $this->notifikasiService->kirimBulk(
                $coordinatorIds,
                "Periode Akademik Aktif: {$periode->nama_periode}",
                "Periode '{$periode->nama_periode}' telah diaktifkan oleh Administrator. Silakan kelola penugasan PIC dan monitoring verifikasi soal.",
                NotificationType::Info,
                'periode',
                $periode->id
            );
        }

        return $periode;
    }

    public function delete(int $id, User $user): void
    {
        $periode = $this->periodeRepository->findById($id);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
        }

        // Cek apakah ada soal terkait
        if ($this->periodeRepository->hasSoal($periode->id)) {
            throw new BusinessException('Periode tidak dapat dihapus karena sudah memiliki data Soal.', 422);
        }

        $this->periodeRepository->delete($periode);

        $this->activityLogService->log("Menghapus periode: {$periode->nama_periode}", 'Periode', $user->id);
    }
}
