<?php

namespace App\Http\Requests\Dosen;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDosenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $dosenId = (int) $this->route('dosen');

        return [
            'name'         => 'sometimes|required|string|max:255',
            'email'        => 'sometimes|required|string|email|max:255|unique:users,email,' . $dosenId,
            'password'     => 'nullable|string|min:6',
            'kode_dosen'   => 'sometimes|required|string|max:30|unique:users,kode_dosen,' . $dosenId,
            'tipe_dosen'   => 'sometimes|required|in:biasa,lb',
            'semester_lb'  => 'nullable|in:ganjil,genap',
            'prodi_id'          => 'nullable|exists:program_studi,id',
            'is_koordinator_mk' => 'boolean',
            'is_coordinator'    => 'boolean',
            'status_aktif'      => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'        => 'Nama lengkap wajib diisi.',
            'email.required'       => 'Email wajib diisi.',
            'email.email'          => 'Format email tidak valid.',
            'email.unique'         => 'Email sudah digunakan.',
            'password.min'         => 'Password minimal 6 karakter.',
            'kode_dosen.required'  => 'Kode Dosen / NIDN wajib diisi.',
            'kode_dosen.unique'    => 'Kode Dosen / NIDN sudah terdaftar.',
            'tipe_dosen.required'  => 'Tipe dosen wajib dipilih.',
            'prodi_id.exists'      => 'Program Studi tidak valid.',
        ];
    }
}
