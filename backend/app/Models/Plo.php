<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plo extends Model
{
    protected $fillable = [
        'code',
        'description',
    ];

    public function clos(): HasMany
    {
        return $this->hasMany(Clo::class);
    }
}
