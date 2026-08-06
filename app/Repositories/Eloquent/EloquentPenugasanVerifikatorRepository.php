<?php

namespace App\Repositories\Eloquent;

use App\Models\PenugasanVerifikator;
use App\Repositories\Contracts\PenugasanVerifikatorRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentPenugasanVerifikatorRepository implements PenugasanVerifikatorRepositoryContract
{
    public function assignVerifikator(int $courseId, int $dosenId, int $periodeId, int $assignedBy): PenugasanVerifikator
    {
        return PenugasanVerifikator::create([
            'course_id'   => $courseId,
            'dosen_id'    => $dosenId,
            'periode_id'  => $periodeId,
            'assigned_by' => $assignedBy,
            'assigned_at' => now(),
        ]);
    }

    public function revokeVerifikator(PenugasanVerifikator $penugasan): bool
    {
        return (bool) $penugasan->delete();
    }

    public function findById(int $id): ?PenugasanVerifikator
    {
        return PenugasanVerifikator::with(['course', 'dosen', 'periode', 'assignedBy'])->find($id);
    }

    public function paginate(int $periodeId, ?int $courseId = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = PenugasanVerifikator::with(['course', 'dosen', 'assignedBy'])
            ->where('periode_id', $periodeId);

        if ($courseId) {
            $query->where('course_id', $courseId);
        } else {
            // Tampilkan 1 baris per dosen verifikator pada periode ini (mencegah duplikat baris di tabel)
            $query->whereIn('id', function ($sub) use ($periodeId) {
                $sub->selectRaw('MIN(id)')
                    ->from('penugasan_verifikator')
                    ->where('periode_id', $periodeId)
                    ->groupBy('dosen_id');
            });
        }

        return $query->orderBy('assigned_at', 'desc')->paginate($perPage);
    }

    public function findByCourseAndPeriode(int $courseId, int $periodeId): Collection
    {
        return PenugasanVerifikator::with(['dosen', 'assignedBy'])
            ->where('course_id', $courseId)
            ->where('periode_id', $periodeId)
            ->get();
    }

    public function findByDosenAndPeriode(int $dosenId, int $periodeId): Collection
    {
        return PenugasanVerifikator::with(['course'])
            ->where('dosen_id', $dosenId)
            ->where('periode_id', $periodeId)
            ->get();
    }
}
