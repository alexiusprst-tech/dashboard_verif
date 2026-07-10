<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'kode_dosen' => $this->kode_dosen,
            'nama_lengkap' => $this->nama_lengkap,
            'name' => $this->nama_lengkap,
            'email' => $this->email,
            'prodi' => new ProgramStudiResource($this->whenLoaded('programStudi')),
            'is_super_admin' => $this->is_super_admin,
            'is_coordinator' => $this->is_coordinator,
            'is_pic_active' => $this->is_pic_active ?? false,
            'status_aktif' => $this->status_aktif,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
