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

    protected function prepareForValidation(): void
    {
        $this->merge([
            'tipe_verifikator' => 'pic',
        ]);
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:' . implode(',', array_column(VerifikasiStatus::cases(), 'value')),
            'tipe_verifikator' => 'required|in:pic,coordinator',
            'catatan' => 'required_if:status,' . VerifikasiStatus::Revisi->value . ',' . VerifikasiStatus::Rejected->value . '|nullable|string',
            'catatan_clo' => 'nullable|array',
            'catatan_clo.*.clo_id' => 'nullable|integer',
            'catatan_clo.*.kode' => 'nullable|string',
            'catatan_clo.*.catatan' => 'nullable|string',
            'catatan_clo.*.status' => 'nullable|string',
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
