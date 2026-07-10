<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PeriodeResource extends JsonResource
{
    public static $wrap = 'data';

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama_periode' => $this->nama_periode,
            'semester' => $this->semester,
            'tahun_akademik' => $this->tahun_akademik,
            'tanggal_mulai' => $this->tanggal_mulai?->format('Y-m-d'),
            'tanggal_deadline' => $this->tanggal_deadline?->format('Y-m-d'),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'is_active' => $this->isActive(),
            'is_deadline_passed' => $this->isDeadlinePassed(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
