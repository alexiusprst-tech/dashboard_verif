<?php

namespace App\Services;

use App\Repositories\Contracts\SoalRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Repositories\Contracts\TemplateRepositoryContract;
use App\Repositories\Contracts\DosenMkRepositoryContract;
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
use Illuminate\Support\Carbon;

class SoalService
{
    protected SoalRepositoryContract $soalRepository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected TemplateRepositoryContract $templateRepository;
    protected DosenMkRepositoryContract $DosenMkRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        SoalRepositoryContract $soalRepository,
        PeriodeRepositoryContract $periodeRepository,
        TemplateRepositoryContract $templateRepository,
        DosenMkRepositoryContract $DosenMkRepository,
        ActivityLogService $activityLogService
    ) {
        $this->soalRepository             = $soalRepository;
        $this->periodeRepository          = $periodeRepository;
        $this->templateRepository         = $templateRepository;
        $this->DosenMkRepository  = $DosenMkRepository;
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
        // Super Admin tidak perlu dicek — boleh upload untuk semua mata kuliah
        if ($user->isSuperAdmin()) {
            return;
        }

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
        // Jika pemetaan dosen_mata_kuliah belum diatur sama sekali untuk periode ini,
        // lewati validasi agar dosen tetap bisa upload (mode setup awal).
        $totalMapping = \App\Models\DosenMk::where('periode_id', $periode->id)->count();
        if ($totalMapping === 0) {
            return; // Pemetaan belum dikonfigurasi — izinkan upload
        }

        if (!$this->DosenMkRepository->isDosenAmpu($user->id, $mataKuliahId, $periode->id)) {
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
                'status'         => SoalStatus::InReview->value,
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
                $updateData['status']      = SoalStatus::InReview->value;
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

    public function getTimeline(int $id, User $user): array
    {
        $soal = $this->soalRepository->findById($id);
        if (!$soal) {
            throw new BusinessException('Soal tidak ditemukan.', 404);
        }

        $events = [];

        // 1. Soal dibuat / diunggah
        $createdTime = $soal->uploaded_at ?? $soal->created_at;
        $events[] = [
            'id'           => 'evt-1',
            'status'       => $soal->status === SoalStatus::Draft->value ? 'draft' : 'submitted',
            'status_label' => $soal->status === SoalStatus::Draft->value ? 'Draft Dibuat' : 'Soal Diunggah',
            'icon_status'  => 'file-text',
            'color'        => 'blue',
            'actor_name'   => $soal->dosen?->nama_lengkap ?? 'Dosen',
            'actor_role'   => 'Dosen Pengampu',
            'description'  => "Soal '{$soal->judul_soal}' berhasil diunggah (Versi 1).",
            'date'         => $createdTime ? Carbon::parse($createdTime)->translatedFormat('d F Y') : '',
            'time'         => $createdTime ? Carbon::parse($createdTime)->format('H:i') : '',
            'created_at'   => $createdTime ? Carbon::parse($createdTime)->toIso8601String() : null,
        ];

        // 2. Verifikasi & Revisi History
        $verifications = DB::table('verifications')
            ->join('users', 'verifications.verifier_id', '=', 'users.id')
            ->where('verifications.soal_id', $soal->id)
            ->whereNull('verifications.deleted_at')
            ->select('verifications.*', 'users.nama_lengkap as verifier_name')
            ->orderBy('verifications.created_at', 'asc')
            ->get();

        $revisions = DB::table('revisi_history')
            ->join('users', 'revisi_history.uploaded_by', '=', 'users.id')
            ->where('revisi_history.soal_id', $soal->id)
            ->select('revisi_history.*', 'users.nama_lengkap as uploader_name')
            ->orderBy('revisi_history.created_at', 'asc')
            ->get();

        $counter = 2;
        foreach ($verifications as $v) {
            $vTime = Carbon::parse($v->created_at);
            $statusStr = $v->status;
            $color = $statusStr === 'approved' ? 'green' : ($statusStr === 'revisi' ? 'amber' : 'red');
            $label = $statusStr === 'approved' ? 'Soal Disetujui' : ($statusStr === 'revisi' ? 'Revisi Diminta' : 'Soal Ditolak');

            $events[] = [
                'id'           => 'evt-' . $counter++,
                'status'       => $statusStr === 'revisi' ? 'revision_requested' : $statusStr,
                'status_label' => $label,
                'icon_status'  => $statusStr === 'approved' ? 'check-circle' : ($statusStr === 'revisi' ? 'alert-triangle' : 'x-circle'),
                'color'        => $color,
                'actor_name'   => "Verifikator - {$v->verifier_name}",
                'actor_role'   => 'Verifikator',
                'description'  => $v->catatan ? "Catatan Verifikator: {$v->catatan}" : "Verifikator me-review dan memproses soal dengan hasil: {$label}.",
                'date'         => $vTime->translatedFormat('d F Y'),
                'time'         => $vTime->format('H:i'),
                'created_at'   => $vTime->toIso8601String(),
            ];
        }

        foreach ($revisions as $r) {
            $rTime = Carbon::parse($r->created_at);
            $events[] = [
                'id'           => 'evt-' . $counter++,
                'status'       => 'revision_uploaded',
                'status_label' => "Revisi Versi {$r->versi} Diunggah",
                'icon_status'  => 'upload-cloud',
                'color'        => 'indigo',
                'actor_name'   => $r->uploader_name,
                'actor_role'   => 'Dosen Pengampu',
                'description'  => "Dosen mengunggah ulang berkas revisi soal (Versi {$r->versi}).",
                'date'         => $rTime->translatedFormat('d F Y'),
                'time'         => $rTime->format('H:i'),
                'created_at'   => $rTime->toIso8601String(),
            ];
        }

        // 3. Berita Acara
        $baItem = DB::table('berita_acara_items')
            ->join('berita_acara', 'berita_acara_items.berita_acara_id', '=', 'berita_acara.id')
            ->where('berita_acara_items.soal_id', $soal->id)
            ->select('berita_acara_items.*', 'berita_acara.nomor_ba', 'berita_acara.created_at as ba_created_at')
            ->first();

        if ($baItem) {
            $baTime = Carbon::parse($baItem->ba_created_at);
            $events[] = [
                'id'           => 'evt-' . $counter++,
                'status'       => 'berita_acara_generated',
                'status_label' => 'Berita Acara Dibuat',
                'icon_status'  => 'file-check',
                'color'        => 'purple',
                'actor_name'   => 'Sistem Auto-Generate',
                'actor_role'   => 'Berita Acara',
                'description'  => "Berita Acara resmi ({$baItem->nomor_ba}) berhasil dibuat.",
                'date'         => $baTime->translatedFormat('d F Y'),
                'time'         => $baTime->format('H:i'),
                'created_at'   => $baTime->toIso8601String(),
            ];
        }

        // Sort events chronologically
        usort($events, fn($a, $b) => strtotime($a['created_at']) <=> strtotime($b['created_at']));

        return $events;
    }

    public function getRevisionHistory(int $id, User $user): array
    {
        $soal = $this->soalRepository->findById($id);
        if (!$soal) {
            throw new BusinessException('Soal tidak ditemukan.', 404);
        }

        $verifications = DB::table('verifications')
            ->join('users', 'verifications.verifier_id', '=', 'users.id')
            ->where('verifications.soal_id', $soal->id)
            ->whereNull('verifications.deleted_at')
            ->select('verifications.*', 'users.nama_lengkap as verifier_name')
            ->orderBy('verifications.created_at', 'asc')
            ->get();

        $history = [];
        $revNum = 1;

        foreach ($verifications as $v) {
            $vTime = Carbon::parse($v->created_at);
            $statusLabel = $v->status === 'approved' ? 'Disetujui' : ($v->status === 'revisi' ? 'Perlu Revisi' : 'Ditolak');
            $history[] = [
                'id'            => $v->id,
                'revision'      => $revNum++,
                'status'        => $v->status,
                'status_label'  => $statusLabel,
                'notes'         => $v->catatan ?? '-',
                'version'       => 'v' . ($revNum - 1),
                'file_soal'     => $soal->file_soal,
                'verifier_name' => $v->verifier_name,
                'created_at'    => $vTime->translatedFormat('d F Y, H:i'),
            ];
        }

        return $history;
    }
}
