<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SoalKategori extends Model
{
    protected $table = 'soal_kategori';

    protected $fillable = [
        'name',
    ];

    public function soals(): HasMany
    {
        return $this->hasMany(Soal::class);
    }
}
