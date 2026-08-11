<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Curriculum extends Model
{
    protected $table = 'curriculums';

    protected $fillable = [
        'code',
        'name',
        'created_by',
    ];

    public function courses(): HasMany
    {
        return $this->hasMany(Course::class, 'curriculum_id');
    }

    public function plos(): HasMany
    {
        return $this->hasMany(Plo::class, 'curriculum_id');
    }
}
