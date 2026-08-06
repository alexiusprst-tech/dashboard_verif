<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dosen\StoreDosenRequest;
use App\Http\Requests\Dosen\UpdateDosenRequest;
use App\Http\Resources\UserResource;
use App\Repositories\Contracts\UserRepositoryContract;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DosenController extends Controller
{
    protected UserRepositoryContract $userRepository;

    public function __construct(UserRepositoryContract $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $search     = $request->query('q') ?? $request->query('search');
        $prodiId    = $request->query('prodi_id') ? (int) $request->query('prodi_id') : null;
        $tipeDosen  = $request->query('tipe_dosen');
        $perPage    = (int) $request->query('per_page', 15);

        $paginator = $this->userRepository->paginateDosen($search, $prodiId, $tipeDosen, $perPage);

        return UserResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Data dosen berhasil diambil.'
        ])->response();
    }

    public function store(StoreDosenRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['uuid'] = (string) Str::uuid();
        $data['nama_lengkap'] = $data['name'];
        $data['is_koordinator_mk'] = $request->boolean('is_koordinator_mk', $request->boolean('is_coordinator', false));
        $data['is_coordinator'] = $data['is_koordinator_mk'];
        $data['status_aktif'] = $request->boolean('status_aktif', true);

        $user = $this->userRepository->create($data);

        return (new UserResource($user->load('prodi')))->additional([
            'success' => true,
            'message' => 'Akun dosen berhasil ditambahkan.'
        ])->response()->setStatusCode(201);
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Data dosen tidak ditemukan.'
            ], 404);
        }

        return (new UserResource($user->load('prodi')))->additional([
            'success' => true,
            'message' => 'Detail dosen berhasil diambil.'
        ])->response();
    }

    public function update(UpdateDosenRequest $request, int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Data dosen tidak ditemukan.'
            ], 404);
        }

        $data = $request->validated();
        if (isset($data['name'])) {
            $data['nama_lengkap'] = $data['name'];
        }
        if (empty($data['password'])) {
            unset($data['password']);
        }
        if ($request->has('is_koordinator_mk') || $request->has('is_coordinator')) {
            $val = $request->has('is_koordinator_mk')
                ? $request->boolean('is_koordinator_mk')
                : $request->boolean('is_coordinator');
            $data['is_koordinator_mk'] = $val;
            $data['is_coordinator'] = $val;
        }

        $updated = $this->userRepository->update($user, $data);

        return (new UserResource($updated->load('prodi')))->additional([
            'success' => true,
            'message' => 'Data dosen berhasil diperbarui.'
        ])->response();
    }

    public function destroy(int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Data dosen tidak ditemukan.'
            ], 404);
        }

        $this->userRepository->delete($user);

        return response()->json([
            'success' => true,
            'message' => 'Akun dosen berhasil dihapus.'
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q', '');
        $perPage = (int) $request->query('per_page', 15);

        $paginator = $this->userRepository->searchByKodeOrNama($query, $perPage);

        return UserResource::collection($paginator)->additional([
            'success' => true,
            'message' => 'Daftar dosen berhasil dicari.'
        ])->response();
    }
}
