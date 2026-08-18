<?php

namespace App\Http\Requests\Penugasan;

use Illuminate\Foundation\Http\FormRequest;

class StorePenugasanKoordinatorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'periode_id' => 'required|exists:periode,id',
            'dosen_id'   => 'required|exists:users,id',
            'course_id'  => 'nullable|exists:courses,id',
        ];
    }

    public function messages(): array
    {
        return [
            'periode_id.required' => 'Periode wajib dipilih.',
            'periode_id.exists'   => 'Periode tidak valid.',
            'dosen_id.required'   => 'Dosen Koordinator wajib dipilih.',
            'dosen_id.exists'     => 'Dosen tidak terdaftar.',
            'course_id.exists'    => 'Mata kuliah tidak valid.',
        ];
    }
}
