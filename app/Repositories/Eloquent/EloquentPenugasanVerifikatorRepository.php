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

    public function paginate(int $periodeId, int|array|null $courseId = null, ?string $search = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = PenugasanVerifikator::with(['course', 'dosen', 'assignedBy', 'periode'])
            ->where('periode_id', $periodeId);

        if (is_array($courseId)) {
            $query->whereIn('course_id', $courseId);
        } elseif ($courseId !== null) {
            $query->where('course_id', (int) $courseId);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('dosen', function ($dq) use ($search) {
                    $dq->where('nama_lengkap', 'like', "%{$search}%")
                        ->orWhere('kode_dosen', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('course', function ($cq) use ($search) {
                    $cq->where('nama_mk', 'like', "%{$search}%")
                        ->orWhere('kode_mk', 'like', "%{$search}%");
                });
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
