<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'kode_dosen' => 'D' . fake()->unique()->numerify('#####'),
            'nama_lengkap' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
            'prodi_id' => null,
            'is_super_admin' => false,
            'is_coordinator' => false,
            'status_aktif' => true,
            'remember_token' => Str::random(10),
        ];
    }


}
