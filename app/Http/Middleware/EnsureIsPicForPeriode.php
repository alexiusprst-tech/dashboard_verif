<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Repositories\Contracts\PenugasanRepositoryContract;
use App\Repositories\Contracts\PeriodeRepositoryContract;

class EnsureIsPicForPeriode
{
    protected PenugasanRepositoryContract $penugasanRepository;
    protected PeriodeRepositoryContract $periodeRepository;

    public function __construct(
        PenugasanRepositoryContract $penugasanRepository,
        PeriodeRepositoryContract $periodeRepository
    ) {
        $this->penugasanRepository = $penugasanRepository;
        $this->periodeRepository = $periodeRepository;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Cari periodeId dari request parameter, query string, request body, atau periode aktif
        $periodeId = $request->route('periode_id') 
            ?? $request->input('periode_id') 
            ?? $request->query('periode_id');

        if (!$periodeId) {
            $activePeriode = $this->periodeRepository->findActive();
            if ($activePeriode) {
                $periodeId = $activePeriode->id;
            }
        }

        if (!$periodeId) {
            return response()->json([
                'success' => false,
                'message' => 'Periode tidak dispesifikasikan dan tidak ada periode aktif saat ini.'
            ], 422);
        }

        // Cek assignment di tabel penugasan
        $isPic = $this->penugasanRepository->isActivePic($user->id, (int)$periodeId);

        if (!$isPic && !$user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Anda bukan PIC yang ditugaskan untuk periode ini.'
            ], 403);
        }

        return $next($request);
    }
}
