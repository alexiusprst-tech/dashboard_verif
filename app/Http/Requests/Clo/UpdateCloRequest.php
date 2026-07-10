<?php

namespace App\Http\Requests\Clo;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCloRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('clo');

        return [
            'kode' => 'required|string|max:30|unique:clo,kode,' . $id . ',id,mata_kuliah_id,' . $this->mata_kuliah_id,
            'deskripsi' => 'nullable|string',
            'mata_kuliah_id' => 'required|exists:courses,id',
            'plo_id' => 'required|exists:plo,id',
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required' => 'Kode CLO wajib diisi.',
            'kode.max' => 'Kode CLO maksimal 30 karakter.',
            'kode.unique' => 'Kode CLO sudah terdaftar di mata kuliah ini.',
            'mata_kuliah_id.required' => 'Mata Kuliah wajib dipilih.',
            'mata_kuliah_id.exists' => 'Mata Kuliah tidak valid.',
            'plo_id.required' => 'PLO wajib dipilih.',
            'plo_id.exists' => 'PLO tidak valid.',
        ];
    }
}
