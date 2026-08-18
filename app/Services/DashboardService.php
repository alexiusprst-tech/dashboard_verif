<?php

namespace App\Services;

use App\Repositories\Contracts\DashboardRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use App\Models\User;
use App\Exceptions\BusinessException;

class DashboardService
{
    protected DashboardRepositoryContract $dashboardRepository;
    protected PeriodeRepositoryContract $periodeRepository;

    public function __construct(
        DashboardRepositoryContract $dashboardRepository,
        PeriodeRepositoryContract $periodeRepository
    ) {
        $this->dashboardRepository = $dashboardRepository;
        $this->periodeRepository = $periodeRepository;
    }

    protected function getPeriodeTarget(?int $periodeId): ?\App\Models\Periode
    {
        if ($periodeId) {
            $periode = \App\Models\Periode::find($periodeId);
            if ($periode) return $periode;
        }

        $active = $this->periodeRepository->findActive();
        if ($active) return $active;

        return \App\Models\Periode::latest('id')->first();
    }

    public function superAdmin(?int $periodeId = null): array
    {
        $activePeriode = $this->getPeriodeTarget($periodeId);
        if (!$activePeriode) {
            return [
                'periode' => null,
                'soal_status_counts' => [],
                'progress' => null
            ];
        }

        return [
            'periode' => $activePeriode,
            'soal_status_counts' => $this->dashboardRepository->countSoalByStatus($activePeriode->id),
            'progress' => $this->dashboardRepository->progressByPeriode($activePeriode->id)
        ];
    }

    public function dosen(User $user, ?int $periodeId = null): array
    {
        $activePeriode = $this->getPeriodeTarget($periodeId);
        if (!$activePeriode) {
            return [
                'periode'            => null,
                'soal_status_counts' => [],
                'deadline'           => null,
                'koordinator_mk'     => null,
            ];
        }

        $koordinatorData = null;
        if ($user->isKoordinatorMk()) {
            $assignments = \App\Models\PenugasanKoordinator::with('course')
                ->where('dosen_id', $user->id)
                ->where('periode_id', $activePeriode->id)
                ->get();

            $courseIds = $assignments->pluck('course_id')->all();

            $verifikators = !empty($courseIds)
                ? \App\Models\PenugasanVerifikator::with(['course', 'dosen', 'assignedBy'])
                    ->where('periode_id', $activePeriode->id)
                    ->whereIn('course_id', $courseIds)
                    ->get()
                : collect();

            $soalsPerCourse = !empty($courseIds)
                ? \App\Models\Soal::where('periode_id', $activePeriode->id)
                    ->whereIn('mata_kuliah_id', $courseIds)
                    ->get()
                : collect();

            $totalSoalAllCourses = $soalsPerCourse->count();
            $approvedSoalAllCourses = $soalsPerCourse->filter(fn($s) => ($s->status instanceof \BackedEnum ? $s->status->value : (string)$s->status) === 'approved')->count();

            $koordinatorData = [
                'total_mata_kuliah'     => count($courseIds),
                'total_verifikator'     => $verifikators->pluck('dosen_id')->unique()->count(),
                'total_soal_mk'         => $totalSoalAllCourses,
                'approved_soal_mk'      => $approvedSoalAllCourses,
                'courses'               => $assignments->map(function ($a) use ($verifikators, $soalsPerCourse) {
                    $courseVerifikators = $verifikators->where('course_id', $a->course_id)->values();
                    $courseSoals = $soalsPerCourse->where('mata_kuliah_id', $a->course_id)->values();
                    $totalCSoal = $courseSoals->count();
                    $approvedCSoal = $courseSoals->filter(fn($s) => ($s->status instanceof \BackedEnum ? $s->status->value : (string)$s->status) === 'approved')->count();
                    $pendingCSoal = $courseSoals->filter(fn($s) => in_array($s->status instanceof \BackedEnum ? $s->status->value : (string)$s->status, ['submitted', 'in_review']))->count();
                    $revisiCSoal = $courseSoals->filter(fn($s) => ($s->status instanceof \BackedEnum ? $s->status->value : (string)$s->status) === 'revisi')->count();

                    return [
                        'course_id'    => $a->course_id,
                        'kode_mk'      => $a->course?->kode_mk,
                        'nama_mk'      => $a->course?->nama_mk,
                        'sks'          => $a->course?->sks,
                        'semester'     => $a->course?->semester,
                        'total_soal'   => $totalCSoal,
                        'approved_soal'=> $approvedCSoal,
                        'pending_soal' => $pendingCSoal,
                        'revisi_soal'  => $revisiCSoal,
                        'verifikators' => $courseVerifikators->map(fn($v) => [
                            'id'           => $v->dosen?->id,
                            'nama_lengkap' => $v->dosen?->nama_lengkap,
                            'kode_dosen'   => $v->dosen?->kode_dosen,
                            'assigned_by'  => $v->assignedBy?->nama_lengkap,
                            'assigned_at'  => $v->assigned_at?->toIso8601String(),
                        ])->all(),
                    ];
                })->all(),
            ];
        }

        return [
            'periode'            => $activePeriode,
            'soal_status_counts' => $this->dashboardRepository->countSoalByStatus($activePeriode->id, $user->id),
            'deadline'           => $this->dashboardRepository->nearestDeadline($user->id),
            'koordinator_mk'     => $koordinatorData,
        ];
    }

    public function verifikator(User $user, ?int $periodeId = null): array
    {
        $activePeriode = $this->getPeriodeTarget($periodeId);
        if (!$activePeriode) {
            return [
                'periode' => null,
                'summary' => ['total' => 0, 'pending' => 0, 'done' => 0]
            ];
        }

        return [
            'periode' => $activePeriode,
            'summary' => $this->dashboardRepository->picSummary($user->id, $activePeriode->id)
        ];
    }

    public function pic(User $user, ?int $periodeId = null): array
    {
        return $this->verifikator($user, $periodeId);
    }

    public function coordinator(?int $periodeId = null): array
    {
        return $this->superAdmin($periodeId);
    }

    public function uploadProgress(User $user, ?int $periodeId = null): array
    {
        $activePeriode = $this->getPeriodeTarget($periodeId);
        if (!$activePeriode) {
            return [];
        }

        // Fetch courses assigned to user in active period
        $assignedCourses = \Illuminate\Support\Facades\DB::table('dosen_mata_kuliah')
            ->join('courses', 'dosen_mata_kuliah.mata_kuliah_id', '=', 'courses.id')
            ->where('dosen_mata_kuliah.dosen_id', $user->id)
            ->where('dosen_mata_kuliah.periode_id', $activePeriode->id)
            ->select('courses.id as course_id', 'courses.kode_mk', 'courses.nama_mk')
            ->get();

        // Fallback: If no explicit mapping found for active period, get courses in user's prodi or limit 5
        if ($assignedCourses->isEmpty()) {
            $query = \App\Models\Course::query();
            if ($user->prodi_id) {
                $query->where('prodi_id', $user->prodi_id);
            }
            $assignedCourses = $query->take(10)->get()->map(function ($c) {
                return (object) [
                    'course_id' => $c->id,
                    'kode_mk'   => $c->kode_mk,
                    'nama_mk'   => $c->nama_mk,
                ];
            });
        }

        $now = \Illuminate\Support\Carbon::now();
        $deadlineCarbon = \Illuminate\Support\Carbon::parse($activePeriode->tanggal_deadline ?? $activePeriode->tgl_selesai);
        $daysRemaining = (int) ceil($now->diffInDays($deadlineCarbon, false));
        if ($daysRemaining < 0) {
            $daysRemaining = 0;
        }

        $result = [];

        foreach ($assignedCourses as $course) {
            $soal = \App\Models\Soal::where('dosen_id', $user->id)
                ->where('periode_id', $activePeriode->id)
                ->where('mata_kuliah_id', $course->course_id)
                ->latest()
                ->first();

            $status = 'belum_upload';
            $statusLabel = 'Belum Upload';
            $progress = 0;

            if ($soal) {
                $statusVal = $soal->status instanceof \BackedEnum ? $soal->status->value : (string) $soal->status;
                switch ($statusVal) {
                    case 'draft':
                    case 'submitted':
                    case 'in_review':
                        $status = 'in_review';
                        $statusLabel = 'In Review';
                        $progress = 50;
                        break;
                    case 'revisi':
                        $status = 'revisi';
                        $statusLabel = 'Revisi';
                        $progress = 70;
                        break;
                    case 'approved':
                        $status = 'approved';
                        $statusLabel = 'Approved';
                        $progress = 100;
                        break;
                    case 'rejected':
                        $status = 'rejected';
                        $statusLabel = 'Rejected';
                        $progress = 0;
                        break;
                }
            }

            $isCritical = ($daysRemaining <= 3 && $daysRemaining >= 0 && $status !== 'approved');

            $result[] = [
                'course_id'            => $course->course_id,
                'course'               => $course->nama_mk,
                'kode_mk'              => $course->kode_mk,
                'status'               => $status,
                'status_label'         => $statusLabel,
                'progress'             => $progress,
                'deadline'             => $deadlineCarbon->format('Y-m-d'),
                'deadline_formatted'   => $deadlineCarbon->translatedFormat('d F Y'),
                'days_remaining'       => $daysRemaining,
                'is_critical_deadline' => $isCritical,
                'soal_id'              => $soal?->id,
            ];
        }

        return $result;
    }
}
