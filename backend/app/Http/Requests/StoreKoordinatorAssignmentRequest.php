<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreKoordinatorAssignmentRequest
 *
 * Validates input for creating a new Koordinator assignment.
 * BR-03: Super Admin dapat menunjuk Koordinator.
 *
 * Source: AGENTS.md Section 8 (unique constraint: course_id, semester_id)
 */
class StoreKoordinatorAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // TODO: Check that authenticated user is SuperAdmin
        return true;
    }

    public function rules(): array
    {
        return [
            'course_id' => ['required', 'integer', 'exists:courses,id'],
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'semester_id' => ['required', 'integer', 'exists:semesters,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'course_id.exists' => 'Mata kuliah yang dipilih tidak valid.',
            'user_id.exists' => 'Dosen yang dipilih tidak valid.',
            'semester_id.exists' => 'Semester yang dipilih tidak valid.',
        ];
    }
}
