<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Clo extends Model
{
    protected $fillable = [
        'course_id',
        'plo_id',
        'code',
        'description',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function plo(): BelongsTo
    {
        return $this->belongsTo(Plo::class);
    }
}
