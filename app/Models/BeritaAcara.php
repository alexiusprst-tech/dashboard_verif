<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BeritaAcara extends Model
{
    protected $table = 'berita_acara';

    protected $fillable = [
        'nomor_ba',
        'periode_id',
        'verifier_id',
        'generated_at',
        'file_pdf',
        'file_docx',
    ];

    protected function casts(): array
    {
        return [
            'generated_at' => 'datetime',
        ];
    }

    /* ── Relations ──────────────────────────────────────────── */

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verifier_id');
    }

    /** Snapshot items — immutable setelah di-generate */
    public function items(): HasMany
    {
        return $this->hasMany(BeritaAcaraItem::class, 'berita_acara_id');
    }
}
