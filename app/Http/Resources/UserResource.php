<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        $isSuper = (bool) $this->is_super_admin;

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'kode_dosen' => $this->kode_dosen,
            'nama_lengkap' => $this->nama_lengkap,
            'name' => $this->nama_lengkap,
            'email' => $this->email,
            'prodi_id' => $this->prodi_id,
            'prodi' => new ProgramStudiResource($this->whenLoaded('prodi', fn () => $this->prodi, fn () => $this->whenLoaded('programStudi'))),
            'tipe_dosen' => $this->tipe_dosen ?? 'biasa',
            'semester_lb' => $this->semester_lb,
            'is_super_admin'       => $isSuper,
            'is_koordinator_mk'    => $isSuper || (bool) ($this->is_koordinator_mk ?? false),
            'is_verifikator_aktif' => $isSuper || (bool) ($this->is_verifikator_aktif ?? false),
            'is_coordinator'       => $isSuper || (bool) ($this->is_koordinator_mk ?? false),
            'is_pic_active'        => $isSuper || (bool) ($this->is_verifikator_aktif ?? false),
            'status_aktif'         => $this->status_aktif,
            'last_login_at'        => $this->last_login_at?->toIso8601String(),
            'created_at'           => $this->created_at?->toIso8601String(),
        ];
    }
}
