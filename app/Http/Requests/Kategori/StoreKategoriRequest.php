<?php

namespace App\Http\Requests\Kategori;

use Illuminate\Foundation\Http\FormRequest;

class StoreKategoriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Ensure we have an integer id (avoid empty string causing SQL errors)
        $id = (int) $this->route('kategori');

        return [
            'nama_kategori' => 'required|string|max:100|unique:categories,nama_kategori,' . $id,
            'deskripsi' => 'nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'nama_kategori.required' => 'Nama kategori wajib diisi.',
            'nama_kategori.max' => 'Nama kategori maksimal 100 karakter.',
            'nama_kategori.unique' => 'Nama kategori sudah terdaftar.',
        ];
    }
}
