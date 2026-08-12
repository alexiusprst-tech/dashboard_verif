<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Soal extends Model
{
    protected $table = 'soal';

    protected $fillable = [
        'course_id',
        'semester_id',
        'soal_kategori_id',
        'uploader_id',
        'file_path',
        'status',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function semester(): BelongsTo
    {
        return $this->belongsTo(Semester::class);
    }

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(SoalKategori::class, 'soal_kategori_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploader_id');
    }
}
