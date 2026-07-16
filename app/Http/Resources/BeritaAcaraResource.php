<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class BeritaAcaraResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nomor_ba' => $this->nomor_ba,
            'periode' => new PeriodeResource($this->whenLoaded('periode')),
            'verifier' => new UserResource($this->whenLoaded('verifier')),
            'file_pdf' => $this->file_pdf,
            'file_url' => $this->file_pdf ? Storage::disk('public')->url($this->file_pdf) : null,
            'file_docx' => $this->file_docx,
            'file_docx_url' => $this->file_docx ? url("/api/berita-acara/{$this->id}/download") : null,
            'generated_at' => $this->generated_at?->toIso8601String(),
            'items' => BeritaAcaraItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
