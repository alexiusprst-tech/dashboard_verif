<?php

namespace App\Models;

use App\Enums\TargetBroadcast;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Broadcast extends Model
{
    protected $table = 'broadcasts';

    protected $fillable = [
        'judul',
        'isi',
        'target',
        'prodi_id',
        'periode_id',
        'created_by',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'target'       => TargetBroadcast::class,
            'published_at' => 'datetime',
        ];
    }

    /* ── Relations ──────────────────────────────────────────── */

    public function programStudi(): BelongsTo
    {
        return $this->belongsTo(ProgramStudi::class, 'prodi_id');
    }

    public function periode(): BelongsTo
    {
        return $this->belongsTo(Periode::class, 'periode_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /* ── Helpers ─────────────────────────────────────────────── */

    public function isPublished(): bool
    {
        return $this->published_at !== null;
    }

    /* ── Scopes ──────────────────────────────────────────────── */

    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at');
    }

    public function scopeForUser($query, User $user)
    {
        return $query->published()->where(function ($q) use ($user) {
            $q->where('target', TargetBroadcast::Semua->value)
              ->orWhere(function ($q2) use ($user) {
                  $q2->where('target', TargetBroadcast::ProdiTertentu->value)
                     ->where('prodi_id', $user->prodi_id);
              });
        });
    }
}
