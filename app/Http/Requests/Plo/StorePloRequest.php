<?php

namespace App\Http\Requests\Plo;

use Illuminate\Foundation\Http\FormRequest;

class StorePloRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('prodi_id') || !$this->prodi_id) {
            $siProdi = \App\Models\ProgramStudi::where('kode_prodi', 'SI')
                ->orWhere('nama_prodi', 'like', '%Sistem Informasi%')
                ->first();
            $prodiId = $siProdi ? $siProdi->id : \App\Models\ProgramStudi::value('id');
            $this->merge(['prodi_id' => $prodiId]);
        }
    }

    public function rules(): array
    {
        return [
            'kode' => 'required|string|max:30|unique:plo,kode,NULL,id,prodi_id,' . $this->prodi_id,
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
