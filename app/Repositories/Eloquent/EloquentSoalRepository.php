<?php

namespace App\Repositories\Eloquent;

use App\Models\Soal;
use App\Repositories\Contracts\SoalRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentSoalRepository implements SoalRepositoryContract
{
    public function findById(int $id): ?Soal
    {
        return Soal::with([
            'dosen',
            'mataKuliah',
            'clo.plo',
            'periode',
            'template.kategori',
            'verifications.verifier',
        ])->find($id);
    }

    public function findByUuid(string $uuid): ?Soal
    {
        return Soal::where('uuid', $uuid)->first();
    }

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = Soal::with(['dosen', 'mataKuliah', 'clo', 'periode', 'template.kategori']);

        if (!empty($filters['periode_id'])) {
            $query->where('periode_id', $filters['periode_id']);
        }
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (!empty($filters['dosen_id'])) {
            $query->where('dosen_id', $filters['dosen_id']);
        }
        if (!empty($filters['mata_kuliah_id'])) {
            $query->where('mata_kuliah_id', $filters['mata_kuliah_id']);
        }

        return $query->orderByDesc('uploaded_at')->paginate($perPage);
    }

    public function create(array $data): Soal
    {
        return Soal::create($data);
    }

    public function update(Soal $soal, array $data): Soal
    {
        $soal->update($data);
        return $soal->fresh();
    }

    public function softDelete(Soal $soal): bool
    {
        return (bool) $soal->delete();
    }

    public function getLatestVersi(int $dosenId, int $periodeId, int $mataKuliahId): int
    {
        return Soal::withTrashed()
            ->where('dosen_id', $dosenId)
            ->where('periode_id', $periodeId)
            ->where('mata_kuliah_id', $mataKuliahId)
            ->max('versi') ?? 0;
    }

    public function countByStatus(array $filters = []): array
    {
        $query = Soal::query();

        if (!empty($filters['periode_id'])) {
            $query->where('periode_id', $filters['periode_id']);
        }
        if (!empty($filters['dosen_id'])) {
            $query->where('dosen_id', $filters['dosen_id']);
        }

        $results = $query->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        // Pastikan semua status ada dalam array (nilai 0 jika tidak ada data)
        $statuses = ['draft', 'submitted', 'in_review', 'revisi', 'approved', 'rejected'];
        foreach ($statuses as $s) {
            $results[$s] = $results[$s] ?? 0;
        }

        return $results;
    }

    public function findForVerifier(int $verifierId, int $periodeId, int $perPage = 15): LengthAwarePaginator
    {
        // Soal yang dosen target-nya di-assign ke verifier ini
        return Soal::with(['dosen', 'mataKuliah', 'clo', 'template.kategori'])
            ->whereHas('dosen.penugasanSebagaiTarget', function ($q) use ($verifierId, $periodeId) {
                $q->where('verifier_id', $verifierId)
                  ->where('periode_id', $periodeId);
            })
            ->where('periode_id', $periodeId)
            ->whereIn('status', ['submitted', 'in_review'])
            ->orderByDesc('uploaded_at')
            ->paginate($perPage);
    }
}
