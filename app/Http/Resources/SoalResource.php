<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class SoalResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'uuid'             => $this->uuid,
            'judul_soal'       => $this->judul_soal,
            // Alias untuk MonitoringPage & komponen lain yang pakai `judul`
            'judul'            => $this->judul_soal,
            'file_soal'        => $this->file_soal,
            'file_url'         => $this->file_soal ? Storage::disk('public')->url($this->file_soal) : null,
            'versi'            => $this->versi,
            'status'           => $this->status->value,
            'status_label'     => $this->status->label(),
            'uploaded_at'      => $this->uploaded_at?->toIso8601String(),
            'updated_at'       => $this->updated_at?->toIso8601String(),
            // Flat fields untuk tabel monitoring (tanpa perlu traversal nested object)
            'dosen_nama'       => $this->whenLoaded('dosen',       fn() => $this->dosen->nama_lengkap ?? null),
            'mata_kuliah_nama' => $this->whenLoaded('mataKuliah',  fn() => $this->mataKuliah->nama_mk ?? null),
            'kategori_nama'    => $this->whenLoaded('template',    fn() => $this->template?->kategori?->nama_kategori ?? null),
            // Nested objects (tetap ada untuk kebutuhan halaman detail)
            'dosen'            => new UserResource($this->whenLoaded('dosen')),
            'mata_kuliah'      => new CourseResource($this->whenLoaded('mataKuliah')),
            'clo'              => new CloResource($this->whenLoaded('clo')),
            'periode'          => new PeriodeResource($this->whenLoaded('periode')),
            'template'         => new TemplateResource($this->whenLoaded('template')),
        ];
    }
}
