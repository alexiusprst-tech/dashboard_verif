<?php

namespace App\Services;

use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Models\Periode;
use App\Models\User;
use App\Enums\PeriodeStatus;
use App\Exceptions\BusinessException;
use Illuminate\Support\Facades\DB;

class PeriodeService
{
    protected PeriodeRepositoryContract $periodeRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        PeriodeRepositoryContract $periodeRepository,
        ActivityLogService $activityLogService
    ) {
        $this->periodeRepository = $periodeRepository;
        $this->activityLogService = $activityLogService;
    }

    public function create(array $data, User $user): Periode
    {
        if (strtotime($data['tanggal_deadline']) <= strtotime($data['tanggal_mulai'])) {
            throw new BusinessException('Tanggal deadline harus setelah tanggal mulai.', 422);
        }

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
