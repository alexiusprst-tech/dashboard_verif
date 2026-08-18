<?php

namespace App\Services;

use App\Repositories\Contracts\BeritaAcaraRepositoryContract;
use App\Repositories\Contracts\VerificationRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Repositories\Contracts\BeritaAcaraTemplateRepositoryContract;
use App\Models\BeritaAcara;
use App\Models\Verification;
use App\Models\User;
use App\Enums\PrintType;
use App\Enums\VerifikasiStatus;
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
     * Otomatis membuat dan merender Berita Acara Evaluasi untuk setiap Soal yang diverifikasi.
     */
    public function generateForVerification(Verification $verification): BeritaAcara
    {
        $verification->loadMissing([
            'soal.mataKuliah.clo.plo',
            'soal.mataKuliah.programStudi',
            'soal.dosen',
            'soal.periode',
            'soal.kategori',
            'verifier',
        ]);

        $soal = $verification->soal;
        $verifier = $verification->verifier;
        $periode = $soal->periode;
        $course = $soal->mataKuliah;

        // Cari dosen koordinator MK
        $koordinator = null;
        if ($course && $periode) {
            $koordinatorAssign = \App\Models\PenugasanKoordinator::with('dosen')
                ->where('course_id', $course->id)
                ->where('periode_id', $periode->id)
                ->first();
            if ($koordinatorAssign && $koordinatorAssign->dosen) {
                $koordinator = $koordinatorAssign->dosen->nama_lengkap ?? $koordinatorAssign->dosen->name;
            }
        }

        // Build baris evaluasi dari catatan_clo atau CLO mata kuliah
        $evaluasiList = [];
        $bentukAsesmen = $soal->kategori?->nama_kategori ?? 'UTS';

        if (!empty($verification->catatan_clo) && is_array($verification->catatan_clo)) {
            foreach ($verification->catatan_clo as $idx => $c) {
                $evaluasiList[] = [
                    'bentuk_asesmen'   => $bentukAsesmen,
                    'clo'              => $c['kode'] ?? ('CLO' . ($idx + 1)),
                    'no_soal'          => (string)($idx + 1),
                    'catatan_evaluasi' => (!empty($c['catatan']) ? $c['catatan'] : (($c['status'] ?? 'sesuai') === 'sesuai' ? 'Sesuai' : 'Perlu Revisi')),
                    'rekomendasi'      => !empty($c['rekomendasi']) ? $c['rekomendasi'] : (($c['status'] ?? 'sesuai') === 'revisi' ? 'Perbaiki butir soal terkait CLO ini' : '-'),
                ];
            }
        } elseif ($course && $course->clo->isNotEmpty()) {
            foreach ($course->clo as $idx => $clo) {
                $evaluasiList[] = [
                    'bentuk_asesmen'   => $bentukAsesmen,
                    'clo'              => $clo->kode,
                    'no_soal'          => (string)($idx + 1),
                    'catatan_evaluasi' => $verification->status === VerifikasiStatus::Approved ? 'Sesuai' : ($verification->catatan ?: 'Perlu Revisi'),
                    'rekomendasi'      => $verification->status === VerifikasiStatus::Revisi ? 'Perbaiki butir soal' : '-',
                ];
            }
        } else {
            $evaluasiList[] = [
                'bentuk_asesmen'   => $bentukAsesmen,
                'clo'              => 'CLO1',
                'no_soal'          => '1',
                'catatan_evaluasi' => $verification->catatan ?: ($verification->status === VerifikasiStatus::Approved ? 'Sesuai' : 'Perlu Revisi'),
                'rekomendasi'      => '-',
            ];
        }

        $baData = [
            'form_no'                 => '100-S1SI-001-R1',
            'no_dokumen'              => '100-S1SI-001-R1',
            'no_revisi'               => '00',
            'berlaku'                 => now()->format('d/m/Y'),
            'semester_tahun_akademik' => $periode ? (ucfirst($periode->semester) . ' ' . $periode->tahun_akademik) : 'Ganjil 2026/2027',
            'fakultas'                => 'Rekayasa Industri',
            'nama_evaluator'          => $verifier->nama_lengkap ?? $verifier->name,
            'kode_dosen'              => $verifier->kode_dosen ?? ($verifier->nip ?? 'EVA'),
            'program_studi'           => $course?->programStudi?->nama_prodi ?? 'S1 Sistem Informasi',
            'kode_mata_kuliah'        => $course->kode_mk ?? 'MK',
            'nama_mata_kuliah'        => $course->nama_mk ?? $soal->judul_soal,
            'program_studi_mk'        => $course?->programStudi?->nama_prodi ?? 'S1 Sistem Informasi',
            'dosen_koordinator'       => $koordinator ?? 'Dr. Dosen Koordinator, M.Kom.',
            'evaluasi'                => $evaluasiList,
            'kota'                    => 'Bandung',
            'tanggal'                 => now()->translatedFormat('d F Y'),
            'ttd'                     => [
                'evaluator_soal'    => $verifier->nama_lengkap ?? $verifier->name,
                'dosen_koordinator' => $koordinator ?? 'Dr. Dosen Koordinator, M.Kom.',
                'ka_prodi'          => 'Dr. Hubbul Walidain, S.Kom., M.T.',
            ],
        ];

        Storage::disk('public')->makeDirectory('berita_acara');

        $generatorService = app(BeritaAcaraEvaluasiGeneratorService::class);

        // Generate PDF
        $pdf = $generatorService->generatePdf($baData);
        $relativePdfPath = "berita_acara/BA_SOAL_{$soal->id}.pdf";
        Storage::disk('public')->put($relativePdfPath, $pdf->output());

        // Generate DOCX
        $tempDocxPath = $generatorService->generateDocx($baData);
        $relativeDocxPath = "berita_acara/BA_SOAL_{$soal->id}.docx";
        Storage::disk('public')->put($relativeDocxPath, file_get_contents($tempDocxPath));
        if (\Illuminate\Support\Facades\File::exists($tempDocxPath)) {
            \Illuminate\Support\Facades\File::delete($tempDocxPath);
        }

        $nomorBa = sprintf(
            'BA/%s/%s/%04d',
            str_replace(' ', '-', $periode->tahun_akademik ?? '2026-2027'),
            $course->kode_mk ?? 'MK',
            $soal->id
        );

        $ba = BeritaAcara::updateOrCreate(
            ['soal_id' => $soal->id],
            [
                'nomor_ba'     => $nomorBa,
                'periode_id'   => $soal->periode_id,
                'verifier_id'  => $verifier->id,
                'generated_at' => now(),
                'file_pdf'     => $relativePdfPath,
                'file_docx'    => $relativeDocxPath,
            ]
        );

        \App\Models\BeritaAcaraItem::updateOrCreate(
            ['berita_acara_id' => $ba->id, 'soal_id' => $soal->id],
            [
                'verification_id'  => $verification->id,
                'status_snapshot'  => $verification->status->value,
                'catatan_snapshot' => $verification->catatan,
            ]
        );

        return $ba;
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

        $isAuthorized = $user->isSuperAdmin()
            || $ba->verifier_id === $user->id
            || ($ba->soal && $ba->soal->dosen_id === $user->id)
            || $ba->items()->whereHas('soal', fn($q) => $q->where('dosen_id', $user->id))->exists();

        if (!$isAuthorized && $user->isKoordinatorMk()) {
            $courseIds = [];
            if ($ba->soal && $ba->soal->mata_kuliah_id) {
                $courseIds[] = $ba->soal->mata_kuliah_id;
            }
            $itemCourseIds = $ba->items()->with('soal')->get()->pluck('soal.mata_kuliah_id')->filter()->toArray();
            $courseIds = array_unique(array_merge($courseIds, $itemCourseIds));

            if (!empty($courseIds)) {
                $isAuthorized = \App\Models\PenugasanKoordinator::where('dosen_id', $user->id)
                    ->whereIn('course_id', $courseIds)
                    ->exists();
            }
        }

        if (!$isAuthorized) {
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