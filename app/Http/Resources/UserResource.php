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
            'prodi_id' => $this->prodi_id,
            'prodi' => new ProgramStudiResource($this->whenLoaded('prodi', fn () => $this->prodi, fn () => $this->whenLoaded('programStudi'))),
            'tipe_dosen' => $this->tipe_dosen ?? 'biasa',
            'semester_lb' => $this->semester_lb,
            'is_super_admin'       => (bool) $this->is_super_admin,
            'is_koordinator_mk'    => (bool) ($this->is_koordinator_mk ?? $this->is_coordinator),
            'is_verifikator_aktif' => $this->is_verifikator_aktif ?? $this->is_pic_active ?? false,
            'is_coordinator'       => (bool) ($this->is_koordinator_mk ?? $this->is_coordinator),
            'is_pic_active'        => $this->is_verifikator_aktif ?? $this->is_pic_active ?? false,
            'status_aktif'         => $this->status_aktif,
            'last_login_at'        => $this->last_login_at?->toIso8601String(),
            'created_at'           => $this->created_at?->toIso8601String(),
        ];
    }
}
