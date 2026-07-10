<?php

namespace App\Models;

use App\Enums\NotificationType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Notifikasi — hanya created_at, tidak ada updated_at.
 */
class Notifikasi extends Model
{
    protected $table = 'notifikasi';

    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'judul',
        'pesan',
        'tipe',
        'is_read',
        'reference_type',
        'reference_id',
    ];

    protected function casts(): array
    {
        return [
            'tipe'    => NotificationType::class,
            'is_read' => 'boolean',
        ];
    }

    /* ── Relations ──────────────────────────────────────────── */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /* ── Scopes ─────────────────────────────────────────────── */

    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
