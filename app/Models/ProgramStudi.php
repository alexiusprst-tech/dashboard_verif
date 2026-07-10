<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProgramStudi extends Model
{
    protected $table = 'program_studi';

    protected $fillable = [
        'nama_prodi',
        'kode_prodi',
    ];

    /* ── Relations ──────────────────────────────────────────── */

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'prodi_id');
    }

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class, 'prodi_id');
    }

    public function broadcasts(): HasMany
    {
        return $this->hasMany(Broadcast::class, 'prodi_id');
    }
}
