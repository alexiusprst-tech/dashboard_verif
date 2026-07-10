<?php

namespace App\Services;

use App\Repositories\Contracts\UserRepositoryContract;
use App\Repositories\Contracts\PenugasanRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthService
{
    protected UserRepositoryContract $userRepository;
    protected PenugasanRepositoryContract $penugasanRepository;
    protected PeriodeRepositoryContract $periodeRepository;
    protected ActivityLogService $activityLogService;

    public function __construct(
        UserRepositoryContract $userRepository,
        PenugasanRepositoryContract $penugasanRepository,
        PeriodeRepositoryContract $periodeRepository,
        ActivityLogService $activityLogService
    ) {
        $this->userRepository = $userRepository;
        $this->penugasanRepository = $penugasanRepository;
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

        // Get active period PIC assignments
        $activePeriode = $this->periodeRepository->findActive();
        $isPicActive = false;
        if ($activePeriode) {
            $isPicActive = $this->penugasanRepository->isActivePic($user->id, $activePeriode->id);
        }

        $user->is_pic_active = $isPicActive;

        $this->activityLogService->log('User melakukan login', 'Auth', $user->id);

        return [
            'token' => $token,
            'user' => $user,
            'active_assignments' => $this->penugasanRepository->getActivePicPeriodes($user->id)
        ];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
        $this->activityLogService->log('User melakukan logout', 'Auth', $user->id);
    }

    public function me(User $user): array
    {
        $activePeriode = $this->periodeRepository->findActive();
        $isPicActive = false;
        if ($activePeriode) {
            $isPicActive = $this->penugasanRepository->isActivePic($user->id, $activePeriode->id);
        }
        
        $user->is_pic_active = $isPicActive;

        return [
            'user' => $user,
            'active_assignments' => $this->penugasanRepository->getActivePicPeriodes($user->id)
        ];
    }
}
