<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class RevisiHistoryResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'soal_id' => $this->soal_id,
            'versi' => $this->versi,
            'file_soal' => $this->file_soal,
            'file_url' => $this->file_soal ? Storage::disk('public')->url($this->file_soal) : null,
            'catatan_verifikator' => $this->catatan_verifikator,
            'uploaded_by' => $this->uploaded_by,
            'uploader_name' => $this->relationLoaded('uploader') ? $this->uploader?->nama_lengkap : null,
            'uploaded_at' => $this->uploaded_at?->toIso8601String(),
        ];
    }
}
