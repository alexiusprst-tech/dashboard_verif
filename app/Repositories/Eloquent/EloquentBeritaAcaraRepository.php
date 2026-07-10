<?php

namespace App\Repositories\Eloquent;

use App\Models\BeritaAcara;
use App\Repositories\Contracts\BeritaAcaraRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class EloquentBeritaAcaraRepository implements BeritaAcaraRepositoryContract
{
    public function findById(int $id): ?BeritaAcara
    {
        return BeritaAcara::with(['periode', 'verifier', 'items.soal.dosen', 'items.soal.mataKuliah'])->find($id);
    }

    public function findByVerifierAndPeriode(int $verifierId, int $periodeId): ?BeritaAcara
    {
        return BeritaAcara::where('verifier_id', $verifierId)
            ->where('periode_id', $periodeId)
            ->with('items')
            ->first();
    }

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = BeritaAcara::with(['periode', 'verifier']);

        if (!empty($filters['periode_id'])) {
            $query->where('periode_id', $filters['periode_id']);
        }
        if (!empty($filters['verifier_id'])) {
            $query->where('verifier_id', $filters['verifier_id']);
        }

        return $query->orderByDesc('generated_at')->paginate($perPage);
    }

    public function create(array $data): BeritaAcara
    {
        return BeritaAcara::create($data);
    }

    public function update(BeritaAcara $ba, array $data): BeritaAcara
    {
        $ba->update($data);
        return $ba->fresh();
    }

    public function generateNomorBA(int $periodeId): string
    {
        $periode = \App\Models\Periode::findOrFail($periodeId);

        // Kode periode: gabungan tahun_akademik + semester (contoh: 2024-2025-1)
        $kodePeriode = str_replace(' ', '-', $periode->tahun_akademik ?? $periodeId);
        $semester    = $periode->semester ? "-{$periode->semester}" : '';

        // Hitung urutan BA dalam periode ini
        $urutan = BeritaAcara::where('periode_id', $periodeId)->count() + 1;

        return sprintf('BA/%s%s/%03d', $kodePeriode, $semester, $urutan);
    }

    public function deleteItems(int $beritaAcaraId): void
    {
        DB::table('berita_acara_items')
            ->where('berita_acara_id', $beritaAcaraId)
            ->delete();
    }

    public function insertItems(array $items): void
    {
        DB::table('berita_acara_items')->insert($items);
    }
}
