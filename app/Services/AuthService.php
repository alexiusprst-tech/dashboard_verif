<?php

namespace App\Services;

use App\Repositories\Contracts\UserRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthService
{
    protected UserRepositoryContract $userRepository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        UserRepositoryContract $userRepository,
        PeriodeRepositoryContract $periodeRepository,
        ActivityLogService $activityLogService
    ) {
        $this->userRepository    = $userRepository;
        $this->periodeRepository = $periodeRepository;
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

        // Set virtual attributes is_verifikator_aktif & is_koordinator_mk berdasarkan periode aktif
        $activePeriode = $this->periodeRepository->findActive();
        $user->is_verifikator_aktif = $activePeriode
            ? $user->isVerifikatorPadaPeriode($activePeriode->id)
            : false;
        $user->is_pic_active = $user->is_verifikator_aktif;

        $user->is_koordinator_mk = $activePeriode
            ? $user->isKoordinatorPadaPeriode($activePeriode->id)
            : false;
        $user->is_coordinator = $user->is_koordinator_mk;

        $this->activityLogService->log('User melakukan login', 'Auth', $user->id);

        return [
            'token' => $token,
            'user'  => $user,
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
        $this->activityLogService->log('User melakukan logout', 'Auth', $user->id);
    }

    public function me(User $user): array
    {
        // Set virtual attributes is_verifikator_aktif & is_koordinator_mk berdasarkan periode aktif
        $activePeriode = $this->periodeRepository->findActive();
        $user->is_verifikator_aktif = $activePeriode
            ? $user->isVerifikatorPadaPeriode($activePeriode->id)
            : false;
        $user->is_pic_active = $user->is_verifikator_aktif;

        $user->is_koordinator_mk = $activePeriode
            ? $user->isKoordinatorPadaPeriode($activePeriode->id)
            : false;
        $user->is_coordinator = $user->is_koordinator_mk;

        return [
            'user' => $user,
        ];
    }
}

