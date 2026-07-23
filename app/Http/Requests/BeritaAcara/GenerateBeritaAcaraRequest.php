<?php

namespace App\Http\Requests\BeritaAcara;

use Illuminate\Foundation\Http\FormRequest;

class GenerateBeritaAcaraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'periode_id'   => 'required|exists:periode,id',
            'verifier_id'  => 'required|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'periode_id.required'  => 'Periode wajib ditentukan untuk generate Berita Acara.',
            'periode_id.exists'    => 'Periode tidak valid.',
            'verifier_id.required' => 'PIC (verifikator) wajib ditentukan.',
            'verifier_id.exists'   => 'PIC yang dipilih tidak ditemukan.',
        ];
    }
}
