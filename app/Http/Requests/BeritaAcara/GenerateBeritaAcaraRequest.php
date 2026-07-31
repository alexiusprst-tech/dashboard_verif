<?php

namespace App\Http\Requests\BeritaAcara;

use Illuminate\Foundation\Http\FormRequest;

class GenerateBeritaAcaraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // verifier_id wajib diisi oleh Super Admin (untuk memilih PIC yang di-generate).
        // Untuk PIC biasa, verifier otomatis = diri sendiri → field bersifat opsional.
        $verifierRule = $this->user()?->isSuperAdmin()
            ? 'required|exists:users,id'
            : 'nullable|exists:users,id';

        return [
            'periode_id'  => 'required|exists:periode,id',
            'verifier_id' => $verifierRule,
        ];
    }

    public function messages(): array
    {
        return [
            'periode_id.required'  => 'Periode wajib ditentukan untuk generate Berita Acara.',
            'periode_id.exists'    => 'Periode tidak valid.',
            'verifier_id.required' => 'PIC (verifikator) wajib ditentukan.',
            'verifier_id.exists'   => 'PIC yang dipilih tidak ditemukan.',
        ];
    }
}
