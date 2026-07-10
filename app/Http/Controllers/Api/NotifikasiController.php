<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotifikasiResource;
use App\Repositories\Contracts\NotifikasiRepositoryContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotifikasiController extends Controller
{
    protected NotifikasiRepositoryContract $notifikasiRepository;

    public function __construct(NotifikasiRepositoryContract $notifikasiRepository)
    {
        $this->notifikasiRepository = $notifikasiRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isRead = $request->has('unread') ? false : null;
        $perPage = $request->query('per_page', 20);

        $paginator = $this->notifikasiRepository->paginateForUser($user->id, $isRead, $perPage);
        $unreadCount = $this->notifikasiRepository->countUnreadByUser($user->id);

        return NotifikasiResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Daftar notifikasi berhasil diambil.',
            'unread_count' => $unreadCount
        ])->response();
    }

    public function read(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $this->notifikasiRepository->markAsRead($id, $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sebagai dibaca.'
        ]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = $this->notifikasiRepository->markAllReadByUser($user->id);

        return response()->json([
            'success' => true,
            'message' => "Semua notifikasi ($count) telah ditandai sebagai dibaca."
        ]);
    }
}
