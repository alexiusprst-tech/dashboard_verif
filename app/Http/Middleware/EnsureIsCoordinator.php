<?php

namespace App\Http\Middleware;

use App\Repositories\Contracts\PeriodeRepositoryContract;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsCoordinator
{
    protected PeriodeRepositoryContract $periodeRepository;

    public function __construct(PeriodeRepositoryContract $periodeRepository)
    {
        $this->periodeRepository = $periodeRepository;
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

        // Super Admin boleh mengakses seluruh fitur Coordinator
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Coordinator permanen diizinkan
        if ($user->isCoordinator()) {
            return $next($request);
        }

        // Dosen yang sedang bertugas sebagai PIC di periode aktif
        // juga mendapatkan akses fitur coordinator
        $activePeriode = $this->periodeRepository->findActive();
        if ($activePeriode && $user->isPicOnPeriode($activePeriode->id)) {
            return $next($request);
        }

        abort(403, 'Anda tidak memiliki hak akses sebagai Coordinator.');
    }
}
