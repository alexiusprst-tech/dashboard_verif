<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        Role::updateOrCreate(
            [
                'nama_role' => 'pic',
            ],
            [
                'deskripsi' => 'Person In Charge Verifikasi Soal',
            ]
        );
    }
}
