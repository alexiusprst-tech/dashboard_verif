<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BeritaAcaraItemResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'soal' => new SoalResource($this->whenLoaded('soal')),
            'verification_id' => $this->verification_id,
            'status_snapshot' => $this->status_snapshot->value,
            'status_snapshot_label' => $this->status_snapshot->label(),
            'catatan_snapshot' => $this->catatan_snapshot,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
