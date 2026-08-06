<?php

namespace App\Http\Requests\Clo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCloRequest extends FormRequest
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
        $id = $this->route('clo');
        $ploId = $this->plo_id;

        return [
            'kode' => [
                'required',
                'string',
                'max:30',
                Rule::unique('clo', 'kode')->ignore($id)->where(function ($query) use ($ploId) {
                    if ($ploId) {
                        return $query->where('plo_id', $ploId);
                    }
                    return $query;
                }),
            ],
            'nama_clo'   => 'nullable|string|max:255',
            'deskripsi'  => 'required|string',
            'plo_id'     => 'required|exists:plo,id',
            'periode_id' => 'nullable|exists:periode,id',
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required'   => 'Kode CLO wajib diisi.',
            'kode.max'        => 'Kode CLO maksimal 30 karakter.',
            'kode.unique'     => 'Kode CLO sudah terdaftar di PLO ini.',
            'plo_id.required' => 'PLO wajib dipilih.',
            'plo_id.exists'   => 'PLO tidak valid.',
        ];
    }
}
