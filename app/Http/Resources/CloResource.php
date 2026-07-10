<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CloResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode' => $this->kode,
            'deskripsi' => $this->deskripsi,
            'mata_kuliah' => new CourseResource($this->whenLoaded('mataKuliah')),
            'plo' => new PloResource($this->whenLoaded('plo')),
            'created_by' => $this->created_by,
            'creator_name' => $this->relationLoaded('creator') ? $this->creator?->nama_lengkap : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
