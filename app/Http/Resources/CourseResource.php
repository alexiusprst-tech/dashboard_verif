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
            'prodi' => new ProgramStudiResource($this->whenLoaded('programStudi')),
        ];
    }
}
