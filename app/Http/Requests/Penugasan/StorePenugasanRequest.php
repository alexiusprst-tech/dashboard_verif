<?php

namespace App\Http\Requests\Penugasan;

use Illuminate\Foundation\Http\FormRequest;

class StorePenugasanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'periode_id'   => 'required|exists:periode,id',
            'pic_dosen_id' => 'required|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'periode_id.required'   => 'Periode wajib ditentukan.',
            'periode_id.exists'     => 'Periode tidak valid.',
            'pic_dosen_id.required' => 'Dosen PIC wajib dipilih.',
            'pic_dosen_id.exists'   => 'Dosen PIC tidak terdaftar.',
        ];
    }
}
