<?php

namespace App\Http\Requests\Clo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCloRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('periode_id') && ($this->periode_id === '' || $this->periode_id === 'null' || $this->periode_id === 0 || $this->periode_id === '0')) {
            $this->merge(['periode_id' => null]);
        }
    }

    public function rules(): array
    {
        $mataKuliahId = $this->mata_kuliah_id;

        return [
            'kode' => [
                'required',
                'string',
                'max:30',
                Rule::unique('clo', 'kode')->where(function ($query) use ($mataKuliahId) {
                    return $query->where('mata_kuliah_id', $mataKuliahId);
                }),
            ],
            'nama_clo'      => 'nullable|string|max:255',
            'deskripsi'     => 'nullable|string',
            'mata_kuliah_id'=> 'required|exists:courses,id',
            'plo_id'        => 'required|exists:plo,id',
            'periode_id'    => 'nullable|exists:periode,id',
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
