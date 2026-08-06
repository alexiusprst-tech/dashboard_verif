<?php

namespace App\Http\Middleware;

use App\Repositories\Contracts\PeriodeRepositoryContract;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware: EnsureIsVerifikator
 *
 * Mengizinkan akses hanya untuk:
 * - Super Admin (selalu)
 * - Dosen Verifikator yang terdaftar di penugasan_verifikator pada periode aktif
 *
 * Menggantikan EnsureIsPicForPeriode yang menggunakan konsep PIC + user_roles.
 */
class EnsureIsVerifikator
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

        // Super Admin selalu boleh mengakses
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        /*
        |--------------------------------------------------------------------------
        | Ambil periode
        |--------------------------------------------------------------------------
        | Prioritas:
        | 1. Route parameter
        | 2. Request body
        | 3. Query string
        | 4. Periode aktif
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
        | Cek apakah user adalah verifikator aktif di periode ini
        | (query ke tabel penugasan_verifikator)
        |--------------------------------------------------------------------------
        */

        $isVerifikator = $user->isVerifikatorPadaPeriode((int) $periodeId);

        if (!$isVerifikator) {
            abort(403, 'Anda tidak memiliki penugasan sebagai verifikator pada periode ini.');
        }

        return $next($request);
    }
}
