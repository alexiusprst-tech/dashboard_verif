<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    public function superAdmin(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $data = $this->dashboardService->superAdmin($periodeId ? (int)$periodeId : null);

        return response()->json([
            'success' => true,
            'message' => 'Data dashboard Super Admin berhasil diambil.',
            'data' => $data
        ]);
    }

    public function dosen(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $data = $this->dashboardService->dosen($request->user(), $periodeId ? (int)$periodeId : null);

        return response()->json([
            'success' => true,
            'message' => 'Data dashboard Dosen berhasil diambil.',
            'data' => $data
        ]);
    }

    public function verifikator(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $data = $this->dashboardService->verifikator($request->user(), $periodeId ? (int)$periodeId : null);

        return response()->json([
            'success' => true,
            'message' => 'Data dashboard Verifikator berhasil diambil.',
            'data' => $data
        ]);
    }

    public function coordinator(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $data = $this->dashboardService->coordinator($periodeId ? (int)$periodeId : null);

        return response()->json([
            'success' => true,
            'message' => 'Data dashboard Koordinator berhasil diambil.',
            'data' => $data
        ]);
    }

    public function uploadProgress(Request $request): JsonResponse
    {
        $periodeId = $request->query('periode_id');
        $data = $this->dashboardService->uploadProgress($request->user(), $periodeId ? (int)$periodeId : null);

        return response()->json([
            'success' => true,
            'message' => 'Progress upload per mata kuliah berhasil diambil.',
            'data' => $data
        ]);
    }
}
