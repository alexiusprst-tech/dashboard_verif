<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PenugasanVerifikatorService;
use App\Repositories\Contracts\PenugasanVerifikatorRepositoryContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PenugasanVerifikatorController extends Controller
{
    public function __construct(
        protected PenugasanVerifikatorService $service,
        protected PenugasanVerifikatorRepositoryContract $repository
    ) {}

    /**
     * List penugasan verifikator per periode / course.
     */
    public function index(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $courseId  = $request->query('course_id');
        $perPage   = (int) $request->query('per_page', 50);

        if (!$periodeId) {
            return response()->json([
                'success' => false,
                'message' => 'Periode ID wajib ditentukan.'
            ], 422);
        }

        $paginator = $this->repository->paginate((int) $periodeId, $courseId ? (int) $courseId : null, $perPage);

        $items = collect($paginator->items())->map(function ($pv) {
            return [
                'id'          => $pv->id,
                'course_id'   => $pv->course_id,
                'dosen_id'    => $pv->dosen_id,
                'periode_id'  => $pv->periode_id,
                'assigned_at' => $pv->assigned_at?->toIso8601String(),
                'course'      => $pv->course ? [
                    'id'      => $pv->course->id,
                    'kode_mk' => $pv->course->kode_mk,
                    'nama_mk' => $pv->course->nama_mk,
                ] : null,
                'dosen'       => $pv->dosen ? [
                    'id'           => $pv->dosen->id,
                    'nama_lengkap' => $pv->dosen->nama_lengkap,
                    'kode_dosen'   => $pv->dosen->kode_dosen,
                    'email'        => $pv->dosen->email,
                ] : null,
                'assigned_by_user' => $pv->assignedBy ? [
                    'id'           => $pv->assignedBy->id,
                    'nama_lengkap' => $pv->assignedBy->nama_lengkap,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Data penugasan verifikator berhasil diambil.',
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
     * Assign dosen verifikator ke mata kuliah.
     */
    public function store(Request $request): JsonResponse
    {
        $dosenId  = $request->input('dosen_id') ?? $request->input('pic_dosen_id') ?? $request->input('user_id');
        $courseId = $request->input('course_id');
        $periodeId = $request->input('periode_id');

        $request->merge([
            'dosen_id'   => $dosenId,
            'course_id'  => $courseId,
            'periode_id' => $periodeId,
        ]);

        $validated = $request->validate([
            'periode_id' => 'required|exists:periode,id',
            'dosen_id'   => 'required|exists:users,id',
            'course_id'  => 'nullable|exists:courses,id',
        ], [
            'periode_id.required' => 'Periode wajib dipilih.',
            'dosen_id.required'   => 'Dosen verifikator wajib dipilih.',
            'course_id.exists'    => 'Mata kuliah tidak valid.',
        ]);

        // Jika course_id tidak ditentukan (null / kosong), tugaskan dosen ke seluruh mata kuliah pada periode tersebut
        if (empty($validated['course_id'])) {
            $courses = \App\Models\Course::all();
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
                        'periode_id' => $validated['periode_id'],
                        'course_id'  => $c->id,
                        'dosen_id'   => $validated['dosen_id'],
                    ], $request->user());
                    $assignedCount++;
                } catch (\Throwable $e) {
                    // Abaikan jika sudah ditugaskan sebelumnya
                }
            }
            return response()->json([
                'success' => true,
                'message' => "Dosen verifikator berhasil ditugaskan ke {$assignedCount} mata kuliah.",
            ]);
        }

        $penugasan = $this->service->assign($validated, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Dosen verifikator berhasil ditugaskan.',
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
     * Cabut penugasan verifikator.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->service->cabut($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Penugasan verifikator berhasil dicabut.'
        ]);
    }
}
