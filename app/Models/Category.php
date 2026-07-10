<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $table = 'categories';

    protected $fillable = [
        'nama_kategori',
        'deskripsi',
    ];

    /* ── Relations ──────────────────────────────────────────── */

    public function templates(): HasMany
    {
        return $this->hasMany(Template::class, 'kategori_id');
    }

    public function activeTemplate(): HasMany
    {
        return $this->hasMany(Template::class, 'kategori_id')
            ->where('is_active', true);
    }
}
