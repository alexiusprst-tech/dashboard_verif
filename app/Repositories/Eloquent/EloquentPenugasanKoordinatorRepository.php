<?php

namespace App\Repositories\Eloquent;

use App\Models\PenugasanKoordinator;
use App\Repositories\Contracts\PenugasanKoordinatorRepositoryContract;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentPenugasanKoordinatorRepository implements PenugasanKoordinatorRepositoryContract
{
    public function assignKoordinator(int $courseId, int $dosenId, int $periodeId, int $assignedBy): PenugasanKoordinator
    {
        return PenugasanKoordinator::create([
            'course_id'   => $courseId,
            'dosen_id'    => $dosenId,
            'periode_id'  => $periodeId,
            'assigned_by' => $assignedBy,
            'assigned_at' => now(),
        ]);
    }

    public function revokeKoordinator(PenugasanKoordinator $penugasan): bool
    {
        return (bool) $penugasan->delete();
    }

    public function findById(int $id): ?PenugasanKoordinator
    {
        return PenugasanKoordinator::with(['course', 'dosen', 'periode', 'assignedBy'])->find($id);
    }

    public function paginate(int $periodeId, ?int $courseId = null, ?string $search = null, int $perPage = 15): LengthAwarePaginator
    {
        $query = PenugasanKoordinator::with(['course', 'dosen', 'assignedBy', 'periode'])
            ->where('periode_id', $periodeId);

        if ($courseId) {
            $query->where('course_id', $courseId);
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
        return PenugasanKoordinator::with(['dosen', 'assignedBy'])
            ->where('course_id', $courseId)
            ->where('periode_id', $periodeId)
            ->get();
    }

    public function findByDosenAndPeriode(int $dosenId, int $periodeId): Collection
    {
        return PenugasanKoordinator::with(['course'])
            ->where('dosen_id', $dosenId)
            ->where('periode_id', $periodeId)
            ->get();
    }

    public function countActiveAssignmentsByDosen(int $dosenId): int
    {
        return PenugasanKoordinator::where('dosen_id', $dosenId)->count();
    }
}
