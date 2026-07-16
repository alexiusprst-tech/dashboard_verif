<?php

namespace App\Services;

use App\Repositories\Contracts\SoalRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Repositories\Contracts\TemplateRepositoryContract;
use App\Repositories\Contracts\DosenMataKuliahRepositoryContract;
use App\Models\Soal;
use App\Models\Periode;
use App\Models\User;
use App\Enums\SoalStatus;
use App\Enums\PeriodeStatus;
use App\Exceptions\BusinessException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SoalService
{
    protected SoalRepositoryContract $soalRepository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected TemplateRepositoryContract $templateRepository;
    protected DosenMataKuliahRepositoryContract $dosenMataKuliahRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        SoalRepositoryContract $soalRepository,
        PeriodeRepositoryContract $periodeRepository,
        TemplateRepositoryContract $templateRepository,
        DosenMataKuliahRepositoryContract $dosenMataKuliahRepository,
        ActivityLogService $activityLogService
    ) {
        $this->soalRepository             = $soalRepository;
        $this->periodeRepository          = $periodeRepository;
        $this->templateRepository         = $templateRepository;
        $this->dosenMataKuliahRepository  = $dosenMataKuliahRepository;
        $this->activityLogService         = $activityLogService;
    }

    /**
     * Validasi eligibilitas upload soal bagi seorang dosen.
     *
     * Dua aturan yang dicek secara berurutan:
     * 1. Dosen LB hanya boleh upload di periode yang semester-nya sesuai semester_lb miliknya.
     * 2. Mata kuliah yang dipilih harus ada di pemetaan dosen_mata_kuliah miliknya untuk periode aktif.
     *
     * @throws BusinessException jika salah satu aturan dilanggar
     */
    public function validateUploadEligibility(User $user, int $mataKuliahId, Periode $periode): void
    {
        // ── Aturan 1: Dosen LB hanya aktif di semester yang sesuai ────────────────
        if ($user->isLbDosen()) {
            if (!$user->isAktifDiPeriode($periode)) {
                throw new BusinessException(
                    "Anda tidak memiliki penugasan pada periode ini. " .
                    "Sebagai dosen Luar Biasa semester {$user->semester_lb}, " .
                    "Anda hanya dapat mengunggah soal pada periode semester {$user->semester_lb}.",
                    403
                );
            }
        }

        // ── Aturan 2: Mata kuliah harus ada di pemetaan dosen periode ini ─────────
        if (!$this->dosenMataKuliahRepository->isDosenAmpu($user->id, $mataKuliahId, $periode->id)) {
            throw new BusinessException(
                'Mata kuliah yang dipilih tidak termasuk dalam penugasan mengajar Anda pada periode ini. ' .
                'Hubungi Super Admin untuk memperbarui pemetaan mata kuliah.',
                403
            );
        }
    }

    public function upload(array $data, UploadedFile $file, User $user): Soal
    {
        $periode = $this->periodeRepository->findById($data['periode_id']);
        if (!$periode) {
            throw new BusinessException('Periode tidak ditemukan.', 404);
        }

        if ($periode->status !== PeriodeStatus::Aktif) {
            throw new BusinessException('Periode pengunggahan soal sudah ditutup atau belum aktif.', 422);
        }

        if ($periode->isDeadlinePassed()) {
            throw new BusinessException('Batas waktu pengunggahan soal untuk periode ini telah berakhir.', 422);
        }

        // Validasi eligibilitas: LB semester check + pemetaan dosen_mata_kuliah
        $this->validateUploadEligibility($user, (int) $data['mata_kuliah_id'], $periode);

        $template = $this->templateRepository->findById($data['template_id']);
        if (!$template || !$template->is_active) {
            throw new BusinessException('Template yang dipilih tidak valid atau sudah tidak aktif.', 422);
        }

        // Store file in storage/app/public/soal
        $path = $file->store('soal', 'public');

        $latestVersi = $this->soalRepository->getLatestVersi($user->id, $periode->id, $data['mata_kuliah_id']);
        $versi = $latestVersi + 1;

        $soal = DB::transaction(function () use ($data, $user, $path, $versi) {
            return $this->soalRepository->create([
                'uuid'           => Str::uuid()->toString(),
                'dosen_id'       => $user->id,
                'mata_kuliah_id' => $data['mata_kuliah_id'],
                'clo_id'         => $data['clo_id'],
                'periode_id'     => $data['periode_id'],
                'template_id'    => $data['template_id'],
                'judul_soal'     => $data['judul_soal'],
                'file_soal'      => $path,
                'versi'          => $versi,
                'status'         => SoalStatus::Submitted->value,
                'uploaded_at'    => now(),
            ]);
        });

        $this->activityLogService->log("Mengunggah soal baru: {$soal->judul_soal} (Versi {$versi})", 'Soal', $user->id);

        return $soal;
    }

    public function update(int $id, array $data, ?UploadedFile $file, User $user): Soal
    {
        $soal = $this->soalRepository->findById($id);
        if (!$soal) {
            throw new BusinessException('Soal tidak ditemukan.', 404);
        }

        if (!$soal->isOwnedBy($user->id)) {
            throw new BusinessException('Anda tidak memiliki akses ke soal ini.', 403);
        }

        if (!$soal->isEditable()) {
            throw new BusinessException('Soal tidak dapat diubah pada status saat ini.', 422);
        }

        $periode = $soal->periode;
        if ($periode->status !== PeriodeStatus::Aktif || $periode->isDeadlinePassed()) {
            throw new BusinessException('Batas waktu pengunggahan soal untuk periode ini telah berakhir.', 422);
        }

        $updateData = [];
        if (isset($data['judul_soal'])) {
            $updateData['judul_soal'] = $data['judul_soal'];
        }
        if (isset($data['clo_id'])) {
            $updateData['clo_id'] = $data['clo_id'];
        }

        if ($file) {
            // Delete old file
            Storage::disk('public')->delete($soal->file_soal);
            $path = $file->store('soal', 'public');
            $updateData['file_soal'] = $path;
            
            // If re-uploaded under 'revisi', we write to revisi_history
            if ($soal->status === SoalStatus::Revisi) {
                // Increment version
                $latestVersi = $this->soalRepository->getLatestVersi($user->id, $soal->periode_id, $soal->mata_kuliah_id);
                $versi = $latestVersi + 1;
                
                $updateData['versi']       = $versi;
                $updateData['status']      = SoalStatus::Submitted->value;
                $updateData['uploaded_at'] = now();

                $soal = DB::transaction(function () use ($soal, $updateData, $path, $user) {
                    // Create entry in revisi_history
                    DB::table('revisi_history')->insert([
                        'soal_id'               => $soal->id,
                        'versi'                 => $soal->versi,
                        'file_soal'             => $soal->file_soal,
                        'catatan_verifikator'   => $soal->verifications()->latest()->first()?->catatan,
                        'uploaded_by'           => $user->id,
                        'uploaded_at'           => $soal->uploaded_at,
                        'created_at'            => now(),
                        'updated_at'            => now(),
                    ]);

                    return $this->soalRepository->update($soal, $updateData);
                });

                $this->activityLogService->log(
                    "Mengunggah ulang soal revisi: {$soal->judul_soal} (Revisi ke-{$versi})",
                    'Soal',
                    $user->id
                );

                return $soal;
            }
        }

        $soal = $this->soalRepository->update($soal, $updateData);
        $this->activityLogService->log("Mengubah detail soal: {$soal->judul_soal}", 'Soal', $user->id);

        return $soal;
    }

    public function delete(int $id, User $user): void
    {
        $soal = $this->soalRepository->findById($id);
        if (!$soal) {
            throw new BusinessException('Soal tidak ditemukan.', 404);
        }

        if (!$soal->isOwnedBy($user->id)) {
            throw new BusinessException('Anda tidak memiliki akses ke soal ini.', 403);
        }

        if (!$soal->isDeletable()) {
            throw new BusinessException('Hanya soal berstatus Draft yang dapat dihapus.', 422);
        }

        Storage::disk('public')->delete($soal->file_soal);
        $this->soalRepository->softDelete($soal);

        $this->activityLogService->log("Menghapus draft soal ID {$id}", 'Soal', $user->id);
    }
}
