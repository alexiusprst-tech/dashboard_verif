<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * SoalKategoriController
 *
 * CRUD for soal categories.
 * Actor: SuperAdmin
 *
 * Source: AGENTS.md Section 9, tech-spec.md Section 3.3
 * NEEDS CONFIRMATION: Tabel soal_kategori di database existing belum terkonfirmasi.
 * Endpoint ini hanya diaktifkan jika tabel terkonfirmasi belum ada.
 *
 * Architecture: Route → Middleware → FormRequest → Controller → Service → Repository → Model
 */
class SoalKategoriController extends Controller
{
    /**
     * GET /api/soal-kategori
     */
    public function index(): JsonResponse
    {
        // TODO: Implement
        return response()->json(['data' => []]);
    }

    /**
     * POST /api/soal-kategori
     */
    public function store(Request $request): JsonResponse
    {
        // TODO: Implement with FormRequest validation
        return response()->json(['data' => []], 201);
    }

    /**
     * PUT /api/soal-kategori/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        // TODO: Implement with FormRequest validation
        return response()->json(['data' => []]);
    }

    /**
     * DELETE /api/soal-kategori/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        // TODO: Implement
        return response()->json(null, 204);
    }
}
