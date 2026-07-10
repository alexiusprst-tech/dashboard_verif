<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PenugasanResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'periode_id' => $this->periode_id,
            'periode' => new PeriodeResource($this->whenLoaded('periode')),
            'verifier' => new UserResource($this->whenLoaded('verifier')),
            'target_dosen' => new UserResource($this->whenLoaded('targetDosen')),
            'assigned_by' => $this->assigned_by,
            'assigned_by_user' => new UserResource($this->whenLoaded('assignedBy')),
            'assigned_at' => $this->assigned_at?->toIso8601String(),
        ];
    }
}
