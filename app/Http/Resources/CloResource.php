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
            'plo_id' => $this->plo_id,
            'plo' => new PloResource($this->whenLoaded('plo')),
            'courses' => CourseResource::collection($this->whenLoaded('courses')),
            'courses_count' => $this->relationLoaded('courses') ? $this->courses->count() : 0,
            'created_by' => $this->created_by,
            'creator_name' => $this->relationLoaded('creator') ? $this->creator?->nama_lengkap : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
