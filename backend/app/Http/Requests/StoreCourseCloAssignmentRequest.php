<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreCourseCloAssignmentRequest
 *
 * Validates CLO IDs for Course-CLO assignment.
 * Closes audit finding F-03: missing `exists:clos,id` validation.
 *
 * Source: tech-spec.md Section 2.2, AGENTS.md Section 9
 */
class StoreCourseCloAssignmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        // TODO: Check that authenticated user is SuperAdmin
        return true;
    }

    public function rules(): array
    {
        return [
            'clo_ids' => ['required', 'array', 'min:1'],
            'clo_ids.*' => ['required', 'integer', 'exists:clos,id'], // Closes F-03
        ];
    }

    public function messages(): array
    {
        return [
            'clo_ids.required' => 'CLO harus dipilih.',
            'clo_ids.min' => 'Minimal satu CLO harus dipilih.',
            'clo_ids.*.exists' => 'CLO yang dipilih tidak valid.',
        ];
    }
}
