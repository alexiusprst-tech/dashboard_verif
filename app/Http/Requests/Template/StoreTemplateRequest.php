<?php

namespace App\Http\Requests\Template;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Support\Facades\Log;

class StoreTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kategori_id' => 'required|exists:categories,id',
            'file_template' => 'required|file|mimes:doc,docx,pdf,rtf|max:10240', // Max 10MB
            'versi' => 'required|string|max:20',
        ];
    }

    public function messages(): array
    {
        return [
            'kategori_id.required' => 'Kategori wajib dipilih.',
            'kategori_id.exists' => 'Kategori tidak valid.',
            'file_template.required' => 'File template wajib diunggah.',
            'file_template.file' => 'File yang diunggah harus berupa file.',
            'file_template.mimes' => 'Format file template harus berupa doc, docx, pdf, atau rtf.',
            'file_template.max' => 'Ukuran file template maksimal 10MB.',
            'versi.required' => 'Versi template wajib diisi.',
            'versi.max' => 'Versi template maksimal 20 karakter.',
        ];
    }

    /**
     * Log incoming request data when validation fails to aid debugging.
     */
    protected function failedValidation(Validator $validator)
    {
        try {
            Log::error('Template upload validation failed', [
                'input' => $this->all(),
                'file_keys' => array_keys($this->allFiles()),
                'errors' => $validator->errors()->toArray(),
            ]);
        } catch (\Throwable $e) {
            // ensure we don't break the normal validation flow
            Log::error('Failed logging template upload validation details', ['exception' => $e->getMessage()]);
        }

        parent::failedValidation($validator);
    }
}
