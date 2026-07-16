<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();
        $result = $this->authService->login($credentials['email'], $credentials['password']);

        return (new UserResource($result['user']))->additional([
            'success'            => true,
            'message'            => 'Login berhasil.',
            'token'              => $result['token'],
            'active_pic_periode' => $result['active_pic_periode']
        ])->response();
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.'
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $result = $this->authService->me($request->user());

        return (new UserResource($result['user']))->additional([
            'success'            => true,
            'message'            => 'Data profil berhasil diambil.',
            'active_pic_periode' => $result['active_pic_periode']
        ])->response();
    }
}
