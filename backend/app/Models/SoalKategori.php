<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * SoalKategori Model
 *
 * Represents a category for exam questions (soal).
 * Source: AGENTS.md Section 8, tech-spec.md Section 3.3
 *
 * NEEDS CONFIRMATION: Tabel soal_kategori di database existing belum terkonfirmasi.
 * Model ini dibuat sebagai skeleton — verifikasi skema database sebelum digunakan.
 */
class SoalKategori extends Model
{
    protected $table = 'soal_kategori';

    protected $fillable = [
        'nama',
        'deskripsi',
    ];
}
