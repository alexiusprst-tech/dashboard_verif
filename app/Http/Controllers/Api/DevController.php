<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class DevController extends Controller
{
    /**
     * Switch Mode (Demo/Testing Only)
     * Mengubah semua user menjadi super admin & koordinator jika mode = true.
     */
    public function switchMode(Request $request)
    {
        $mode = filter_var($request->input('mode', true), FILTER_VALIDATE_BOOLEAN);
        
        if ($mode) {
            User::query()->update([
                'is_super_admin' => true,
                'is_coordinator' => true,
                'is_koordinator_mk' => true,
            ]);
            return response()->json(['success' => true, 'message' => 'Switch Mode ON: Semua dosen menjadi Super Admin dan Koordinator.']);
        } else {
            // Untuk mematikan, kita set semuanya menjadi false KECUALI akun admin utama (ADM001)
            User::where('kode_dosen', '!=', 'ADM001')->update([
                'is_super_admin' => false,
                'is_coordinator' => false,
                'is_koordinator_mk' => false,
            ]);
            return response()->json(['success' => true, 'message' => 'Switch Mode OFF: Hak akses dikembalikan ke default.']);
        }
    }
}

