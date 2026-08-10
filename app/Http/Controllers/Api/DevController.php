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
        
        \Illuminate\Support\Facades\Cache::put('dev_mode_active', $mode);
        
        if ($mode) {
            return response()->json(['success' => true, 'message' => 'Switch Mode ON: Semua dosen menjadi Super Admin dan Koordinator.']);
        } else {
            return response()->json(['success' => true, 'message' => 'Switch Mode OFF: Hak akses dikembalikan ke default.']);
        }
    }
}

