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
        return BeritaAcara::with([
            'periode',
            'verifier',
            'soal.dosen',
            'soal.mataKuliah.programStudi',
            'items.soal.dosen',
            'items.soal.mataKuliah'
        ])->find($id);
    }

    public function findByVerifierAndPeriode(int $verifierId, int $periodeId): ?BeritaAcara
    {
        return BeritaAcara::where('verifier_id', $verifierId)
            ->where('periode_id', $periodeId)
            ->with(['items', 'soal'])
            ->first();
    }

    public function paginate(array $filters, int $perPage = 15): LengthAwarePaginator
    {
        $query = BeritaAcara::with([
            'periode',
            'verifier',
            'soal.dosen',
            'soal.mataKuliah',
            'items.soal.dosen',
            'items.soal.mataKuliah'
        ]);

        if (!empty($filters['periode_id'])) {
            $query->where('periode_id', $filters['periode_id']);
        }
        if (!empty($filters['verifier_id'])) {
            $query->where('verifier_id', $filters['verifier_id']);
        }
        if (!empty($filters['dosen_id'])) {
            $dosenId = $filters['dosen_id'];
            $query->where(function ($q) use ($dosenId) {
                $q->where('verifier_id', $dosenId)
                  ->orWhereHas('soal', function ($qSoal) use ($dosenId) {
                      $qSoal->where('dosen_id', $dosenId);
                  })
                  ->orWhereHas('items.soal', function ($q2) use ($dosenId) {
                      $q2->where('dosen_id', $dosenId);
                  });
            });
        }

        if (!empty($filters['koordinator_user'])) {
            $koordinator = $filters['koordinator_user'];
            $periodeId = !empty($filters['periode_id']) ? (int)$filters['periode_id'] : null;

            $coordinatedCourseIds = \App\Models\PenugasanKoordinator::where('dosen_id', $koordinator->id)
                ->when($periodeId, function ($q) use ($periodeId) {
                    $q->where('periode_id', $periodeId);
                })
                ->pluck('course_id')
                ->toArray();

            $query->where(function ($q) use ($koordinator, $coordinatedCourseIds) {
                // 1. BA miliknya sendiri (sebagai verifikator atau pembuat soal)
                $q->where('verifier_id', $koordinator->id)
                  ->orWhereHas('soal', function ($qSoal) use ($koordinator) {
                      $qSoal->where('dosen_id', $koordinator->id);
                  })
                  ->orWhereHas('items.soal', function ($qItems) use ($koordinator) {
                      $qItems->where('dosen_id', $koordinator->id);
                  });

                // 2. BA dari para verifikator soal untuk mata kuliah yang sama (yang dikoordinasikan)
                if (!empty($coordinatedCourseIds)) {
                    $q->orWhereHas('soal', function ($qSoal) use ($coordinatedCourseIds) {
                        $qSoal->whereIn('mata_kuliah_id', $coordinatedCourseIds);
                    })
                    ->orWhereHas('items.soal', function ($qItems) use ($coordinatedCourseIds) {
                        $qItems->whereIn('mata_kuliah_id', $coordinatedCourseIds);
                    });
                }
            });
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
