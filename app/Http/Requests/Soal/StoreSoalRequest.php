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
            'clo_id'         => 'required_without:clo_ids|nullable|exists:clo,id',
            'clo_ids'        => 'nullable|array',
            'clo_ids.*'      => 'exists:clo,id',
            'periode_id'     => 'required|exists:periode,id',
            'jenis_asesmen'  => 'nullable|array',
            'kategori_id'    => 'nullable',
            'template_id'    => 'nullable',
            'judul_soal'     => 'required|string|max:255',
            'file_soal'      => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'], // 10MB, PDF or Word
        ];
    }

    public function messages(): array
    {
        return [
            'mata_kuliah_id.required' => 'Mata kuliah wajib dipilih.',
            'mata_kuliah_id.exists'   => 'Mata kuliah tidak valid.',
            'clo_id.required_without' => 'Minimal satu CLO wajib dipilih.',
            'clo_id.exists'           => 'CLO tidak valid.',
            'clo_ids.*.exists'        => 'Salah satu CLO yang dipilih tidak valid.',
            'periode_id.required'     => 'Periode wajib dipilih.',
            'periode_id.exists'       => 'Periode tidak valid.',
            'judul_soal.required'     => 'Judul soal wajib diisi.',
            'judul_soal.max'          => 'Judul soal maksimal 255 karakter.',
            'file_soal.required'      => 'Berkas soal wajib diunggah.',
            'file_soal.file'          => 'Berkas harus berupa file.',
            'file_soal.mimes'         => 'File harus berformat PDF atau Word (.doc, .docx).',
            'file_soal.max'           => 'Ukuran berkas soal maksimal 10MB.',
        ];
    }
}
