<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        if (!$user->isSuperAdmin()) {
            abort(403, 'Anda tidak memiliki hak akses sebagai Super Admin.');
        }

        return $next($request);
    }
}
