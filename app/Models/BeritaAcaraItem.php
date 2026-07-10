<?php

namespace App\Models;

use App\Enums\VerifikasiStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * BeritaAcaraItem — immutable snapshot.
 *
 * Hanya punya created_at, tidak ada updated_at.
 * Setelah record ini dibuat, tidak boleh di-update.
 * Jika BA di-regenerate, record lama dihapus dan snapshot baru dibuat.
 */
class BeritaAcaraItem extends Model
{
    protected $table = 'berita_acara_items';

    /** Nonaktifkan updated_at — tabel ini immutable */
    const UPDATED_AT = null;

    protected $fillable = [
        'berita_acara_id',
        'soal_id',
        'verification_id',
        'status_snapshot',
        'catatan_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'status_snapshot' => VerifikasiStatus::class,
        ];
    }

    /* ── Relations ──────────────────────────────────────────── */

    public function beritaAcara(): BelongsTo
    {
        return $this->belongsTo(BeritaAcara::class, 'berita_acara_id');
    }

    public function soal(): BelongsTo
    {
        return $this->belongsTo(Soal::class, 'soal_id');
    }

    public function verification(): BelongsTo
    {
        return $this->belongsTo(Verification::class, 'verification_id');
    }
}
