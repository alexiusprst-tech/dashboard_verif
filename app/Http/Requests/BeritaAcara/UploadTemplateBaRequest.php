<?php

namespace App\Http\Requests\BeritaAcara;

use Illuminate\Foundation\Http\FormRequest;

class UploadTemplateBaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_template' => 'required|string|max:150',
            // Accept docx by extension or MIME type (browsers may report differently)
            'file_template' => [
                'required',
                'file',
                'max:51200', // Max 50MB
                function ($attribute, $value, $fail) {
                    if (!$value) return;
                    $extension = strtolower($value->getClientOriginalExtension());
                    $validExtensions = ['docx'];
                    $validMimes = [
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'application/msword',
                        'application/octet-stream',
                        'application/zip', // Some browsers report .docx as zip
                    ];
                    if (!in_array($extension, $validExtensions)) {
                        $fail('File harus berformat Word Document (.docx).');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nama_template.required' => 'Nama template wajib diisi.',
            'nama_template.max' => 'Nama template maksimal 150 karakter.',
            'file_template.required' => 'File template wajib diunggah.',
            'file_template.file' => 'File yang diunggah harus berupa file.',
            'file_template.mimes' => 'File harus berformat Word Document (.docx).',
            'file_template.max' => 'Ukuran file template maksimal 10MB.',
        ];
    }
}
