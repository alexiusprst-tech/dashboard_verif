<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KoordinatorAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'user' => [
                'id' => $this->user->id,
                'nama_lengkap' => $this->user->nama_lengkap,
                'kode_dosen' => $this->user->kode_dosen,
                'prodi' => $this->user->prodi ? [
                    'id' => $this->user->prodi->id,
                    'nama_prodi' => $this->user->prodi->nama_prodi,
                ] : null,
            ],
            'periode_id' => $this->periode_id,
            'periode' => $this->whenLoaded('periode', fn () => [
                'id' => $this->periode->id,
                'nama_periode' => $this->periode->nama_periode,
                'semester' => $this->periode->semester,
                'tahun_akademik' => $this->periode->tahun_akademik,
            ]),
            'assigned_by' => $this->assigned_by,
            'assigned_by_user' => $this->whenLoaded('assignedByUser', fn () => [
                'id' => $this->assignedByUser->id,
                'nama_lengkap' => $this->assignedByUser->nama_lengkap,
            ]),
            'assigned_at' => $this->assigned_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
