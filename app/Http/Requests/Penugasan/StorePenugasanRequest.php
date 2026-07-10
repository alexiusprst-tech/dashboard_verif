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
            'periode_id' => 'required|exists:periode,id',
            'pic_dosen_id' => 'required|exists:users,id',
            'target_dosen_id' => 'required|array|min:1',
            'target_dosen_id.*' => 'required|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'periode_id.required' => 'Periode wajib ditentukan.',
            'periode_id.exists' => 'Periode tidak valid.',
            'pic_dosen_id.required' => 'Dosen PIC wajib dipilih.',
            'pic_dosen_id.exists' => 'Dosen PIC tidak terdaftar.',
            'target_dosen_id.required' => 'Dosen target wajib ditentukan.',
            'target_dosen_id.array' => 'Format dosen target harus berupa list/array.',
            'target_dosen_id.min' => 'Minimal tentukan 1 dosen target untuk diverifikasi.',
            'target_dosen_id.*.exists' => 'Salah satu dosen target tidak terdaftar.',
        ];
    }
}
