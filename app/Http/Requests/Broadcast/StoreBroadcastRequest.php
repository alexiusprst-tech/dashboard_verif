<?php

namespace App\Http\Requests\Broadcast;

use Illuminate\Foundation\Http\FormRequest;
use App\Enums\TargetBroadcast;

class StoreBroadcastRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'judul' => 'required|string|max:200',
            'isi' => 'required|string',
            'target' => 'required|in:' . implode(',', array_column(TargetBroadcast::cases(), 'value')),
            'prodi_id' => 'required_if:target,' . TargetBroadcast::ProdiTertentu->value . '|nullable|exists:program_studi,id',
            'periode_id' => 'nullable|exists:periode,id',
        ];
    }

    public function messages(): array
    {
        return [
            'judul.required' => 'Judul broadcast wajib diisi.',
            'judul.max' => 'Judul broadcast maksimal 200 karakter.',
            'isi.required' => 'Isi pengumuman wajib diisi.',
            'target.required' => 'Target penerima broadcast wajib ditentukan.',
            'target.in' => 'Target penerima broadcast tidak valid.',
            'prodi_id.required_if' => 'Program studi wajib dipilih jika target broadcast adalah program studi tertentu.',
            'prodi_id.exists' => 'Program studi tidak valid.',
            'periode_id.exists' => 'Periode tidak valid.',
        ];
    }
}
