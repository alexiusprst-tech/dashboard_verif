<?php

namespace App\Http\Middleware;

use App\Repositories\Contracts\UserRoleRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsPicForPeriode
{
    protected UserRoleRepositoryContract $userRoleRepository;
    protected PeriodeRepositoryContract $periodeRepository;

    public function __construct(
        UserRoleRepositoryContract $userRoleRepository,
        PeriodeRepositoryContract $periodeRepository
    ) {
        $this->userRoleRepository = $userRoleRepository;
        $this->periodeRepository  = $periodeRepository;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Middleware auth harus dijalankan lebih dulu
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        // Cek apakah akun masih aktif
        if (!$user->status_aktif) {
            abort(403, 'Akun Anda sudah tidak aktif.');
        }

        // Super Admin selalu boleh mengakses
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        /*
        |--------------------------------------------------------------------------
        | Ambil periode
        |--------------------------------------------------------------------------
        |
        | Prioritas:
        | 1. Route parameter
        | 2. Request body
        | 3. Query string
        | 4. Periode aktif
        |
        */

        $periodeId =
            $request->route('periode_id')
            ?? $request->input('periode_id')
            ?? $request->query('periode_id');

        if (!$periodeId) {
            $activePeriode = $this->periodeRepository->findActive();

            if ($activePeriode) {
                $periodeId = $activePeriode->id;
            }
        }

        if (!$periodeId) {
            abort(422, 'Tidak ada periode aktif atau periode belum dipilih.');
        }

        /*
        |--------------------------------------------------------------------------
        | Cek apakah user adalah PIC di periode ini (via user_roles)
        |--------------------------------------------------------------------------
        */

        $isPic = $this->userRoleRepository->isActivePic(
            $user->id,
            (int) $periodeId
        );

        if (!$isPic) {
            abort(403, 'Anda tidak memiliki penugasan PIC pada periode ini.');
        }

        return $next($request);
    }
}
