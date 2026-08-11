<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class DevController extends Controller
{
    /**
     * Toggle per-user Dev Mode.
     * Hanya mengubah mode untuk user yang sedang login.
     */
    public function switchMode(Request $request)
    {
        $mode = filter_var($request->input('mode', true), FILTER_VALIDATE_BOOLEAN);
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $user->dev_mode_enabled = $mode;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => $mode
                ? 'Dev Mode ON untuk akun ini.'
                : 'Dev Mode OFF untuk akun ini.',
            'active' => $mode,
        ]);
    }

    public function status(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        return response()->json([
            'success' => true,
            'active' => (bool) ($user?->dev_mode_enabled ?? false),
        ]);
    }

}

