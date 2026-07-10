<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Broadcast\StoreBroadcastRequest;
use App\Http\Resources\BroadcastResource;
use App\Repositories\Contracts\BroadcastRepositoryContract;
use App\Services\BroadcastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BroadcastController extends Controller
{
    protected BroadcastService $broadcastService;
    protected BroadcastRepositoryContract $broadcastRepository;

    public function __construct(
        BroadcastService $broadcastService,
        BroadcastRepositoryContract $broadcastRepository
    ) {
        $this->broadcastService = $broadcastService;
        $this->broadcastRepository = $broadcastRepository;
    }

    public function index(Request $request): JsonResponse
    {
        // Hanya Super Admin yang bisa melihat daftar lengkap draf broadcast
        if (!$request->user()->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak.'
            ], 403);
        }

        $perPage = $request->query('per_page', 15);
        $paginator = $this->broadcastRepository->paginate($perPage);

        return BroadcastResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data broadcast berhasil diambil.'
        ])->response();
    }

    public function store(StoreBroadcastRequest $request): JsonResponse
    {
        $broadcast = $this->broadcastService->create($request->validated(), $request->user());

        return (new BroadcastResource($broadcast))->additional([
            'success' => true,
            'message' => 'Draf broadcast berhasil dibuat.'
        ])->response();
    }

    public function publish(Request $request, int $id): JsonResponse
    {
        $broadcast = $this->broadcastService->publish($id, $request->user());

        return (new BroadcastResource($broadcast))->additional([
            'success' => true,
            'message' => 'Broadcast berhasil diterbitkan dan notifikasi telah dikirim ke dosen.'
        ])->response();
    }

    public function feed(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = $request->query('per_page', 15);

        $paginator = $this->broadcastRepository->paginateFeedForUser($user->id, $user->prodi_id, $perPage);

        return BroadcastResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data feed pengumuman berhasil diambil.'
        ])->response();
    }
}
