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
        $data = $this->dashboardService->superAdmin();

        return response()->json([
            'success' => true,
            'message' => 'Data dashboard Super Admin berhasil diambil.',
            'data' => $data
        ]);
    }

    public function dosen(Request $request): JsonResponse
    {
        $data = $this->dashboardService->dosen($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Data dashboard Dosen berhasil diambil.',
            'data' => $data
        ]);
    }

    public function pic(Request $request): JsonResponse
    {
        $data = $this->dashboardService->pic($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Data dashboard PIC berhasil diambil.',
            'data' => $data
        ]);
    }

    public function coordinator(Request $request): JsonResponse
    {
        $data = $this->dashboardService->coordinator();

        return response()->json([
            'success' => true,
            'message' => 'Data dashboard Koordinator berhasil diambil.',
            'data' => $data
        ]);
    }
}
