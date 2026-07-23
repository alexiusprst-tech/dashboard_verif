<?php

namespace App\Services;

use App\Repositories\Contracts\UserRepositoryContract;
use App\Repositories\Contracts\UserRoleRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthService
{
    protected UserRepositoryContract $userRepository;
    protected UserRoleRepositoryContract $userRoleRepository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        UserRepositoryContract $userRepository,
        UserRoleRepositoryContract $userRoleRepository,
        PeriodeRepositoryContract $periodeRepository,
        ActivityLogService $activityLogService
    ) {
        $this->userRepository     = $userRepository;
        $this->userRoleRepository = $userRoleRepository;
        $this->periodeRepository  = $periodeRepository;
        $this->activityLogService = $activityLogService;
    }

    public function login(string $email, string $password): array
    {
        $user = $this->userRepository->findByEmail($email);

        if (!$user || !Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial yang diberikan salah.'],
            ]);
        }

        if (!$user->status_aktif) {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda tidak aktif. Silakan hubungi Super Admin.'],
            ]);
        }

        // Update last login
        $this->userRepository->updateLastLogin($user->id);

        // Generate token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Ambil periode_id di mana user berperan PIC (dari user_roles)
        $activePicPeriodes = $this->userRoleRepository->getActivePicPeriodes($user->id);

        // Set virtual attribute is_pic_active berdasarkan periode aktif
        $activePeriode = $this->periodeRepository->findActive();
        $user->is_pic_active = $activePeriode
            ? $activePicPeriodes->contains($activePeriode->id)
            : false;

        $this->activityLogService->log('User melakukan login', 'Auth', $user->id);

        return [
            'token'              => $token,
            'user'               => $user,
            'active_pic_periode' => $activePicPeriodes,   // array of periode_id
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
        $this->activityLogService->log('User melakukan logout', 'Auth', $user->id);
    }

    public function me(User $user): array
    {
        // Ambil periode_id di mana user berperan PIC (dari user_roles)
        $activePicPeriodes = $this->userRoleRepository->getActivePicPeriodes($user->id);

        // Set virtual attribute is_pic_active berdasarkan periode aktif
        $activePeriode = $this->periodeRepository->findActive();
        $user->is_pic_active = $activePeriode
            ? $activePicPeriodes->contains($activePeriode->id)
            : false;

        return [
            'user'               => $user,
            'active_pic_periode' => $activePicPeriodes,   // array of periode_id
        ];
    }
}
