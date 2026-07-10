<?php

namespace App\Repositories\Eloquent;

use App\Enums\TipeVerifikator;
use App\Enums\VerifikasiStatus;
use App\Models\Verification;
use App\Repositories\Contracts\VerificationRepositoryContract;
use Illuminate\Database\Eloquent\Collection;

class EloquentVerificationRepository implements VerificationRepositoryContract
{
    public function findById(int $id): ?Verification
    {
        return Verification::with(['soal', 'verifier'])->find($id);
    }

    public function create(array $data): Verification
    {
        return Verification::create($data);
    }

    public function findLatestBySoal(int $soalId): ?Verification
    {
        return Verification::where('soal_id', $soalId)
            ->where('tipe_verifikator', TipeVerifikator::Pic->value)
            ->orderByDesc('verified_at')
            ->first();
    }

    public function findAllBySoal(int $soalId): Collection
    {
        return Verification::with('verifier')
            ->where('soal_id', $soalId)
            ->orderByDesc('verified_at')
            ->get();
    }

    public function findBySoalAndVerifier(int $soalId, int $verifierId): ?Verification
    {
        return Verification::where('soal_id', $soalId)
            ->where('verifier_id', $verifierId)
            ->latest()
            ->first();
    }

    public function findApprovedForPicInPeriode(int $verifierId, int $periodeId): Collection
    {
        return Verification::with(['soal.dosen', 'soal.mataKuliah', 'soal.clo', 'soal.template.kategori'])
            ->where('verifier_id', $verifierId)
            ->where('tipe_verifikator', TipeVerifikator::Pic->value)
            ->where('status', VerifikasiStatus::Approved->value)
            ->whereHas('soal', fn($q) => $q->where('periode_id', $periodeId))
            ->orderByDesc('verified_at')
            ->get();
    }
}
