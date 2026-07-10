<?php

namespace App\Http\Requests\Soal;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'judul_soal' => 'sometimes|required|string|max:255',
            'clo_id' => 'sometimes|required|exists:clo,id',
            'file_soal' => 'nullable|file|mimes:doc,docx,pdf,zip,rar|max:15360', // Optional, if they want to upload a new version/file
        ];
    }

    public function messages(): array
    {
        return [
            'judul_soal.required' => 'Judul soal wajib diisi.',
            'judul_soal.max' => 'Judul soal maksimal 255 karakter.',
            'clo_id.required' => 'CLO wajib dipilih.',
            'clo_id.exists' => 'CLO tidak valid.',
            'file_soal.mimes' => 'Format berkas soal harus berupa doc, docx, pdf, zip, atau rar.',
            'file_soal.max' => 'Ukuran berkas soal maksimal 15MB.',
        ];
    }
}
