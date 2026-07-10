<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VerificationResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'soal_id' => $this->soal_id,
            'verifier' => new UserResource($this->whenLoaded('verifier')),
            'tipe_verifikator' => $this->tipe_verifikator->value,
            'tipe_verifikator_label' => $this->tipe_verifikator->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'catatan' => $this->catatan,
            'verified_at' => $this->verified_at?->toIso8601String(),
        ];
    }
}
