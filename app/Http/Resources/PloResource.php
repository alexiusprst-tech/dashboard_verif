<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PloResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode' => $this->kode,
            'deskripsi' => $this->deskripsi,
            'prodi' => new ProgramStudiResource($this->whenLoaded('programStudi')),
            'created_by' => $this->created_by,
            'creator_name' => $this->relationLoaded('creator') ? $this->creator?->nama_lengkap : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
