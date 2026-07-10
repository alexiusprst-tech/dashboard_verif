<?php

namespace App\Http\Requests\Plo;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePloRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('plo');

        return [
            'kode' => 'required|string|max:30|unique:plo,kode,' . $id . ',id,prodi_id,' . $this->prodi_id,
            'deskripsi' => 'nullable|string',
            'prodi_id' => 'required|exists:program_studi,id',
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required' => 'Kode PLO wajib diisi.',
            'kode.max' => 'Kode PLO maksimal 30 karakter.',
            'kode.unique' => 'Kode PLO sudah terdaftar di program studi ini.',
            'prodi_id.required' => 'Program Studi wajib dipilih.',
            'prodi_id.exists' => 'Program Studi tidak valid.',
        ];
    }
}
