<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateKoordinatorAssignmentRequest
 *
 * Validates input for updating (replacing) a Koordinator on an existing assignment.
 * BR-04: Super Admin dapat mengganti Koordinator dari user 1 ke user 2.
 *
 * Only user_id is updatable — course_id and semester_id are fixed on the assignment.
 */
class UpdateKoordinatorAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // TODO: Check that authenticated user is SuperAdmin
        return true;
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
            'user_id.exists' => 'Dosen pengganti yang dipilih tidak valid.',
        ];
    }
}
