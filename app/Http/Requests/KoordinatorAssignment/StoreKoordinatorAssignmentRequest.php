<?php

namespace App\Http\Requests\KoordinatorAssignment;

use Illuminate\Foundation\Http\FormRequest;

class StoreKoordinatorAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'periode_id' => ['required', 'integer', 'exists:periode,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'Dosen wajib dipilih.',
            'user_id.exists' => 'Dosen tidak ditemukan.',
            'periode_id.required' => 'Periode wajib dipilih.',
            'periode_id.exists' => 'Periode tidak ditemukan.',
        ];
    }
}
