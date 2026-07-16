<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsCoordinator
{
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

        // Hanya Coordinator yang diizinkan
        if (!$user->isCoordinator()) {
            abort(403, 'Anda tidak memiliki hak akses sebagai Coordinator.');
        }

        return $next($request);
    }
}
