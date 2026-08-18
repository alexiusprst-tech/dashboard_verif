<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Penugasan\StorePenugasanKoordinatorRequest;
use App\Services\PenugasanKoordinatorService;
use App\Services\NotifikasiService;
use App\Enums\NotificationType;
use App\Models\User;
use App\Models\Periode;
use App\Models\Course;
use App\Repositories\Contracts\PenugasanKoordinatorRepositoryContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PenugasanKoordinatorController extends Controller
{
    public function __construct(
        protected PenugasanKoordinatorService $service,
        protected PenugasanKoordinatorRepositoryContract $repository,
        protected NotifikasiService $notifikasiService
    ) {}

    /**
     * List penugasan koordinator per periode / course.
     */
    public function index(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $courseId  = $request->query('course_id');
        $search    = $request->query('q') ?? $request->query('search');
        $perPage   = (int) $request->query('per_page', 50);

        if (!$periodeId) {
            return response()->json([
                'success' => false,
                'message' => 'Periode ID wajib ditentukan.'
            ], 422);
        }

        $paginator = $this->repository->paginate(
            (int) $periodeId,
            $courseId ? (int) $courseId : null,
            $search,
            $perPage
        );

        $items = collect($paginator->items())->map(function ($pk) {
            return [
                'id'          => $pk->id,
                'course_id'   => $pk->course_id,
                'dosen_id'    => $pk->dosen_id,
                'periode_id'  => $pk->periode_id,
                'assigned_at' => $pk->assigned_at?->toIso8601String(),
                'course'      => $pk->course ? [
                    'id'       => $pk->course->id,
                    'kode_mk'  => $pk->course->kode_mk,
                    'nama_mk'  => $pk->course->nama_mk,
                    'sks'      => $pk->course->sks,
                    'semester' => $pk->course->semester,
                ] : null,
                'dosen'       => $pk->dosen ? [
                    'id'           => $pk->dosen->id,
                    'nama_lengkap' => $pk->dosen->nama_lengkap,
                    'kode_dosen'   => $pk->dosen->kode_dosen,
                    'email'        => $pk->dosen->email,
                ] : null,
                'assigned_by_user' => $pk->assignedBy ? [
                    'id'           => $pk->assignedBy->id,
                    'nama_lengkap' => $pk->assignedBy->nama_lengkap,
                ] : null,
                'periode'     => $pk->periode ? [
                    'id'           => $pk->periode->id,
                    'nama_periode' => $pk->periode->nama_periode,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Data penugasan Koordinator MK berhasil diambil.',
            'data'    => $items,
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    /**
     * Assign dosen sebagai Koordinator MK.
     */
    public function store(StorePenugasanKoordinatorRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Jika course_id tidak ditentukan (null / kosong), tugaskan dosen ke seluruh mata kuliah pada periode tersebut
        if (empty($validated['course_id'])) {
            $courses = Course::all();
            if ($courses->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Belum ada data mata kuliah.'
                ], 422);
            }

            $assignedCount = 0;
            foreach ($courses as $c) {
                try {
                    $this->service->assign([
                        'periode_id'            => $validated['periode_id'],
                        'course_id'             => $c->id,
                        'dosen_id'              => $validated['dosen_id'],
                        'suppress_notification' => true,
                    ], $request->user());
                    $assignedCount++;
                } catch (\Throwable $e) {
                    // Abaikan jika sudah ditugaskan sebelumnya
                }
            }

            if ($assignedCount > 0) {
                $dosen   = User::find($validated['dosen_id']);
                $periode = Periode::find($validated['periode_id']);
                if ($dosen && $periode) {
                    $this->notifikasiService->kirim(
                        $dosen->id,
                        'Penugasan Koordinator Mata Kuliah',
                        "Anda telah ditugaskan oleh Administrator sebagai Dosen Koordinator Mata Kuliah untuk {$assignedCount} mata kuliah pada {$periode->nama_periode}.",
                        NotificationType::Verifikasi,
                        'penugasan_koordinator_bulk',
                        $validated['periode_id']
                    );
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Dosen berhasil ditugaskan sebagai Koordinator MK untuk {$assignedCount} mata kuliah.",
            ]);
        }

        $penugasan = $this->service->assign($validated, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Dosen berhasil ditugaskan sebagai Koordinator MK.',
            'data'    => [
                'id'          => $penugasan->id,
                'course_id'   => $penugasan->course_id,
                'dosen_id'    => $penugasan->dosen_id,
                'periode_id'  => $penugasan->periode_id,
                'assigned_at' => $penugasan->assigned_at?->toIso8601String(),
                'course'      => $penugasan->course ? [
                    'id'      => $penugasan->course->id,
                    'kode_mk' => $penugasan->course->kode_mk,
                    'nama_mk' => $penugasan->course->nama_mk,
                ] : null,
                'dosen'       => $penugasan->dosen ? [
                    'id'           => $penugasan->dosen->id,
                    'nama_lengkap' => $penugasan->dosen->nama_lengkap,
                    'kode_dosen'   => $penugasan->dosen->kode_dosen,
                ] : null,
            ],
        ]);
    }

    /**
     * Cabut penugasan koordinator.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->service->cabut($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Penugasan Koordinator MK berhasil dicabut.'
        ]);
    }
}
