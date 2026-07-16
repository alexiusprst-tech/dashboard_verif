<?php

namespace App\Http\Requests\Soal;

use Illuminate\Foundation\Http\FormRequest;

class StoreSoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mata_kuliah_id' => 'required|exists:courses,id',
            'clo_id'         => 'required|exists:clo,id',
            'periode_id'     => 'required|exists:periode,id',
            'template_id'    => 'required|exists:templates,id',
            'judul_soal'     => 'required|string|max:255',
            'file_soal'      => ['required', 'file', 'mimes:pdf', 'max:10240'], // 10MB, PDF only
        ];
    }

    public function messages(): array
    {
        return [
            'mata_kuliah_id.required' => 'Mata kuliah wajib dipilih.',
            'mata_kuliah_id.exists'   => 'Mata kuliah tidak valid.',
            'clo_id.required'         => 'CLO wajib dipilih.',
            'clo_id.exists'           => 'CLO tidak valid.',
            'periode_id.required'     => 'Periode wajib dipilih.',
            'periode_id.exists'       => 'Periode tidak valid.',
            'template_id.required'    => 'Template wajib dipilih.',
            'template_id.exists'      => 'Template tidak valid.',
            'judul_soal.required'     => 'Judul soal wajib diisi.',
            'judul_soal.max'          => 'Judul soal maksimal 255 karakter.',
            'file_soal.required'      => 'Berkas soal wajib diunggah.',
            'file_soal.file'          => 'Berkas harus berupa file.',
            'file_soal.mimes'         => 'File harus berformat PDF.',
            'file_soal.max'           => 'Ukuran berkas soal maksimal 10MB.',
        ];
    }
}
