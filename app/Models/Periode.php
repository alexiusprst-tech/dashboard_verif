<?php

namespace App\Models;

use App\Enums\PeriodeStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Periode extends Model
{
    protected $table = 'periode';

    protected $fillable = [
        'nama_periode',
        'semester',
        'tahun_akademik',
        'tanggal_mulai',
        'tanggal_deadline',
        'status',
    ];

    protected $attributes = [
        'status' => 'draft',
    ];

    protected function casts(): array
    {
        return [
            'status'           => PeriodeStatus::class,
            'tanggal_mulai'    => 'date',
            'tanggal_deadline' => 'date',
        ];
    }

    /* ── Relations ──────────────────────────────────────────── */

    public function soal(): HasMany
    {
        return $this->hasMany(Soal::class, 'periode_id');
    }

    public function penugasan(): HasMany
    {
        return $this->hasMany(Penugasan::class, 'periode_id');
    }

    public function beritaAcara(): HasMany
    {
        return $this->hasMany(BeritaAcara::class, 'periode_id');
    }

    public function broadcasts(): HasMany
    {
        return $this->hasMany(Broadcast::class, 'periode_id');
    }

    /* ── Helpers ────────────────────────────────────────────── */

    public function isDeadlinePassed(): bool
    {
        return $this->tanggal_deadline ? now()->gt($this->tanggal_deadline) : false;
    }

    public function isActive(): bool
    {
        return $this->status === PeriodeStatus::Aktif;
    }
}
