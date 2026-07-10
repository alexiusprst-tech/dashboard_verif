<?php

namespace App\Models;

use App\Enums\TipeVerifikator;
use App\Enums\VerifikasiStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Verification extends Model
{
    use SoftDeletes;

    protected $table = 'verifications';

    protected $fillable = [
        'soal_id',
        'verifier_id',
        'tipe_verifikator',
        'status',
        'catatan',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'tipe_verifikator' => TipeVerifikator::class,
            'status'           => VerifikasiStatus::class,
            'verified_at'      => 'datetime',
        ];
    }

    /* ── Relations ──────────────────────────────────────────── */

    public function soal(): BelongsTo
    {
        return $this->belongsTo(Soal::class, 'soal_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verifier_id');
    }

    public function beritaAcaraItem(): HasOne
    {
        return $this->hasOne(BeritaAcaraItem::class, 'verification_id');
    }

    /* ── Scopes ─────────────────────────────────────────────── */

    public function scopeByTipe($query, TipeVerifikator $tipe)
    {
        return $query->where('tipe_verifikator', $tipe->value);
    }

    public function scopeLatestBySoal($query, int $soalId)
    {
        return $query->where('soal_id', $soalId)
            ->orderByDesc('verified_at')
            ->latest();
    }
}
