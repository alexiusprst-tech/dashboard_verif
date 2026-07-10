<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Repositories\Contracts\UserRepositoryContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DosenController extends Controller
{
    protected UserRepositoryContract $userRepository;

    public function __construct(UserRepositoryContract $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q', '');
        $perPage = $request->query('per_page', 15);

        $paginator = $this->userRepository->searchByKodeOrNama($query, $perPage);

        return UserResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Daftar dosen berhasil dicari.'
        ])->response();
    }
}
