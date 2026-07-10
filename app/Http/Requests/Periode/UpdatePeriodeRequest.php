<?php

namespace App\Http\Requests\Periode;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePeriodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_periode' => 'sometimes|required|string|max:100',
            'semester' => 'nullable|string|max:20',
            'tahun_akademik' => 'nullable|string|max:20',
            'tanggal_mulai' => 'sometimes|required|date',
            'tanggal_deadline' => 'sometimes|required|date|after:tanggal_mulai',
        ];
    }

    public function messages(): array
    {
        return [
            'nama_periode.required' => 'Nama periode wajib diisi.',
            'nama_periode.max' => 'Nama periode maksimal 100 karakter.',
            'tanggal_mulai.required' => 'Tanggal mulai wajib diisi.',
            'tanggal_mulai.date' => 'Format tanggal mulai tidak valid.',
            'tanggal_deadline.required' => 'Tanggal deadline wajib diisi.',
            'tanggal_deadline.date' => 'Format tanggal deadline tidak valid.',
            'tanggal_deadline.after' => 'Tanggal deadline harus setelah tanggal mulai.',
        ];
    }
}
