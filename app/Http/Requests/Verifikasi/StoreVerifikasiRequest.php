<?php

namespace App\Http\Requests\Verifikasi;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\VerifikasiStatus;
use App\Enums\TipeVerifikator;

class StoreVerifikasiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:' . implode(',', array_column(VerifikasiStatus::cases(), 'value')),
            'tipe_verifikator' => 'required|in:' . implode(',', array_column(TipeVerifikator::cases(), 'value')),
            'catatan' => 'required_if:status,' . VerifikasiStatus::Revisi->value . ',' . VerifikasiStatus::Rejected->value . '|nullable|string',
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Hasil verifikasi (status) wajib diisi.',
            'status.in' => 'Pilihan hasil verifikasi tidak valid.',
            'tipe_verifikator.required' => 'Tipe verifikator wajib ditentukan.',
            'tipe_verifikator.in' => 'Pilihan tipe verifikator tidak valid.',
            'catatan.required_if' => 'Catatan wajib diisi apabila hasil verifikasi adalah Perlu Revisi atau Ditolak.',
        ];
    }
}
