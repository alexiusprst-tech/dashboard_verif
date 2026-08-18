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
        $soal = $this->soal ?? $this->items->first()?->soal;

        return [
            'id' => $this->id,
            'nomor_ba' => $this->nomor_ba,
            'soal_id' => $this->soal_id,
            'soal' => $soal ? [
                'id' => $soal->id,
                'judul_soal' => $soal->judul_soal,
                'status' => $soal->status?->value ?? (string)$soal->status,
                'mata_kuliah' => $soal->mataKuliah ? [
                    'id' => $soal->mataKuliah->id,
                    'kode_mk' => $soal->mataKuliah->kode_mk,
                    'nama_mk' => $soal->mataKuliah->nama_mk,
                ] : null,
                'dosen' => $soal->dosen ? [
                    'id' => $soal->dosen->id,
                    'nama_lengkap' => $soal->dosen->nama_lengkap ?? $soal->dosen->name,
                ] : null,
            ] : null,
            'periode' => new PeriodeResource($this->whenLoaded('periode')),
            'verifier' => new UserResource($this->whenLoaded('verifier')),
            'file_pdf' => $this->file_pdf,
            'file_url' => $this->file_pdf ? Storage::disk('public')->url($this->file_pdf) : null,
            'file_docx' => $this->file_docx,
            'file_docx_url' => $this->file_docx ? Storage::disk('public')->url($this->file_docx) : null,
            'generated_at' => $this->generated_at?->toIso8601String(),
            'items' => BeritaAcaraItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
