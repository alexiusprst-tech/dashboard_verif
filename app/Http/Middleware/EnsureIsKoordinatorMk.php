<?php

namespace App\Http\Middleware;

use App\Repositories\Contracts\PeriodeRepositoryContract;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware: EnsureIsKoordinatorMk
 *
 * Mengizinkan akses hanya untuk:
 * - Super Admin
 * - Dosen Koordinator Mata Kuliah (is_koordinator_mk = true)
 *
 * Menggantikan EnsureIsCoordinator yang menggunakan konsep Coordinator + PIC.
 */
class EnsureIsKoordinatorMk
{
    public function __construct(
        protected PeriodeRepositoryContract $periodeRepository
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        if (!$user->status_aktif) {
            abort(403, 'Akun Anda sudah tidak aktif.');
        }

        // Super Admin memiliki akses penuh
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Dosen Koordinator Mata Kuliah diizinkan (cek via model yang sudah mempertimbangkan assignment dan fallback)
        if ($user->isKoordinatorMk()) {
            return $next($request);
        }

        abort(403, 'Anda tidak memiliki hak akses sebagai Koordinator Mata Kuliah pada periode aktif.');
    }
}
