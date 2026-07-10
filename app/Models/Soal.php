<?php

namespace App\Models;

use App\Enums\SoalStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Soal extends Model
{
    use SoftDeletes;

    protected $table = 'soal';

    protected $fillable = [
        'uuid',
        'dosen_id',
        'mata_kuliah_id',
        'clo_id',
        'periode_id',
        'template_id',
        'judul_soal',
        'file_soal',
        'versi',
        'status',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'status'      => SoalStatus::class,
            'uploaded_at' => 'datetime',
        ];
    }

    /* ── Relations ──────────────────────────────────────────── */

    public function dosen(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dosen_id');
    }

    public function mataKuliah(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'mata_kuliah_id');
    }

    public function clo(): BelongsTo
    {
        return $this->belongsTo(Clo::class, 'clo_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class, 'template_id');
    }

    /** Kategori diambil relasional: soal → template → kategori */
    public function kategori(): BelongsTo
    {
        return $this->template()->getRelated()
            ->belongsTo(Category::class, 'kategori_id');
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(Verification::class, 'soal_id');
    }

    public function revisiHistory(): HasMany
    {
        return $this->hasMany(RevisiHistory::class, 'soal_id');
    }

    public function beritaAcaraItems(): HasMany
    {
        return $this->hasMany(BeritaAcaraItem::class, 'soal_id');
    }

    /* ── Helpers ────────────────────────────────────────────── */

    public function isOwnedBy(int $userId): bool
    {
        return $this->dosen_id === $userId;
    }

    public function isEditable(): bool
    {
        return $this->status->isEditable();
    }

    public function isDeletable(): bool
    {
        return $this->status === SoalStatus::Draft;
    }

    /* ── Scopes ─────────────────────────────────────────────── */

    public function scopeByPeriode($query, int $periodeId)
    {
        return $query->where('periode_id', $periodeId);
    }

    public function scopeByDosen($query, int $dosenId)
    {
        return $query->where('dosen_id', $dosenId);
    }

    public function scopeByStatus($query, SoalStatus $status)
    {
        return $query->where('status', $status->value);
    }
}
