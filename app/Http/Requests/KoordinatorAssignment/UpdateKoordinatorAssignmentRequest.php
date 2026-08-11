<?php

namespace App\Http\Requests\KoordinatorAssignment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateKoordinatorAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'user_id.required' => 'Dosen pengganti wajib dipilih.',
            'user_id.exists' => 'Dosen pengganti tidak ditemukan.',
        ];
    }
}
