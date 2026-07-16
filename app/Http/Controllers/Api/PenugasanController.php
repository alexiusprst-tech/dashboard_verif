<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Penugasan\StorePenugasanRequest;
use App\Repositories\Contracts\UserRoleRepositoryContract;
use App\Services\PenugasanPicService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PenugasanController extends Controller
{
    protected PenugasanPicService $penugasanPicService;
    protected UserRoleRepositoryContract $userRoleRepository;

    public function __construct(
        PenugasanPicService $penugasanPicService,
        UserRoleRepositoryContract $userRoleRepository
    ) {
        $this->penugasanPicService = $penugasanPicService;
        $this->userRoleRepository  = $userRoleRepository;
    }

    /**
     * List semua PIC yang ditugaskan di periode ini.
     */
    public function index(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $perPage   = (int) $request->query('per_page', 15);

        if (!$periodeId) {
            return response()->json([
                'success' => false,
                'message' => 'Periode ID wajib ditentukan.'
            ], 422);
        }

        $paginator = $this->userRoleRepository->paginate((int) $periodeId, $perPage);

        // Bungkus manual karena kita tidak pakai Resource khusus UserRole
        $items = $paginator->items();
        $data  = collect($items)->map(function ($ur) {
            return [
                'id'             => $ur->id,
                'user_id'        => $ur->user_id,
                'periode_id'     => $ur->periode_id,
                'assigned_at'    => $ur->assigned_at,
                'created_at'     => $ur->created_at,
                'dosen'          => $ur->user ? [
                    'id'           => $ur->user->id,
                    'nama_lengkap' => $ur->user->nama_lengkap,
                    'kode_dosen'   => $ur->user->kode_dosen,
                    'email'        => $ur->user->email,
                ] : null,
                'assigned_by_user' => $ur->assignedByUser ? [
                    'id'           => $ur->assignedByUser->id,
                    'nama_lengkap' => $ur->assignedByUser->nama_lengkap,
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Data penugasan PIC berhasil diambil.',
            'data'    => $data,
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
            ],
        ]);
    }

    /**
     * Assign role PIC ke dosen untuk periode tertentu.
     */
    public function store(StorePenugasanRequest $request): JsonResponse
    {
        $result = $this->penugasanPicService->assign($request->validated(), $request->user());

        $ur = $result['user_role'];

        return response()->json([
            'success'   => true,
            'message'   => 'Role PIC berhasil diberikan.',
            'data'      => [
                'id'             => $ur->id,
                'user_id'        => $ur->user_id,
                'periode_id'     => $ur->periode_id,
                'assigned_at'    => $ur->assigned_at,
                'dosen'          => $ur->user ? [
                    'id'           => $ur->user->id,
                    'nama_lengkap' => $ur->user->nama_lengkap,
                    'kode_dosen'   => $ur->user->kode_dosen,
                ] : null,
            ],
            'pic_count' => $result['pic_count'],
            'warning'   => $result['warning'],
        ]);
    }

    /**
     * Cabut role PIC (hapus baris dari user_roles).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->penugasanPicService->cabut($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Role PIC berhasil dicabut.'
        ]);
    }
}
