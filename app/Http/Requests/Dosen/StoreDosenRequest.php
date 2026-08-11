<?php

namespace App\Http\Requests\Dosen;

use Illuminate\Foundation\Http\FormRequest;

class StoreDosenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => 'required|string|max:255',
            'email'        => 'required|string|email|max:255|unique:users,email',
            'password'     => 'required|string|min:6',
            'kode_dosen'   => 'required|string|max:30|unique:users,kode_dosen',
            'tipe_dosen'   => 'required|in:biasa,lb',
            'semester_lb'  => 'nullable|required_if:tipe_dosen,lb|in:ganjil,genap',
            'prodi_id'          => 'nullable|exists:program_studi,id',
            'is_koordinator_mk' => 'boolean',
            'is_coordinator'    => 'boolean',
            'status_aktif'      => 'boolean',
            'dev_mode_enabled'  => 'boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'        => 'Nama lengkap wajib diisi.',
            'email.required'       => 'Email wajib diisi.',
            'email.email'          => 'Format email tidak valid.',
            'email.unique'         => 'Email sudah digunakan.',
            'password.required'    => 'Password wajib diisi.',
            'password.min'         => 'Password minimal 6 karakter.',
            'kode_dosen.required'  => 'Kode Dosen / NIDN wajib diisi.',
            'kode_dosen.unique'    => 'Kode Dosen / NIDN sudah terdaftar.',
            'tipe_dosen.required'  => 'Tipe dosen wajib dipilih.',
            'tipe_dosen.in'        => 'Tipe dosen harus biasa atau lb.',
            'semester_lb.required_if' => 'Semester LB wajib diisi jika tipe dosen LB.',
            'prodi_id.exists'      => 'Program Studi tidak valid.',
        ];
    }
}
