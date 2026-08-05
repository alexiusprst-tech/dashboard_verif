<?php

namespace App\Http\Requests\Penugasan;

use Illuminate\Foundation\Http\FormRequest;

class StorePenugasanDosenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'periode_id'         => 'required|exists:periode,id',
            'verifier_id'        => 'required|exists:users,id',
            'target_dosen_ids'   => 'required|array',
            'target_dosen_ids.*' => 'required|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'periode_id.required'         => 'Periode wajib ditentukan.',
            'periode_id.exists'           => 'Periode tidak valid.',
            'verifier_id.required'        => 'PIC Verifikator wajib ditentukan.',
            'verifier_id.exists'          => 'PIC Verifikator tidak terdaftar.',
            'target_dosen_ids.required'   => 'Dosen target wajib dipilih.',
            'target_dosen_ids.array'      => 'Dosen target harus berupa array.',
            'target_dosen_ids.*.exists'   => 'Salah satu dosen target tidak terdaftar.',
        ];
    }
}
