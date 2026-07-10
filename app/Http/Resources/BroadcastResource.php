<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BroadcastResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'judul' => $this->judul,
            'isi' => $this->isi,
            'target' => $this->target->value,
            'target_label' => $this->target->label(),
            'prodi' => new ProgramStudiResource($this->whenLoaded('programStudi')),
            'periode' => new PeriodeResource($this->whenLoaded('periode')),
            'creator_name' => $this->relationLoaded('creator') ? $this->creator?->nama_lengkap : null,
            'published_at' => $this->published_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
