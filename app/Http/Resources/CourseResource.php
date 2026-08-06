<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourseResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode_mk' => $this->kode_mk,
            'nama_mk' => $this->nama_mk,
            'sks' => $this->sks,
            'semester' => $this->semester,
            'kategori' => $this->kategori,
            'prodi_id' => $this->prodi_id,
            'prodi' => new ProgramStudiResource($this->whenLoaded('programStudi')),
            'clo_count' => $this->clo_count ?? ($this->relationLoaded('clo') ? $this->clo->count() : 0),
            'clo' => CloResource::collection($this->whenLoaded('clo')),
        ];
    }
}
