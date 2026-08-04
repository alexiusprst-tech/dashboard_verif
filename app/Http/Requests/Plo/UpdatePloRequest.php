<?php

namespace App\Http\Requests\Plo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePloRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('prodi_id') || !$this->prodi_id) {
            $siProdi = \App\Models\ProgramStudi::where('kode_prodi', 'SI')
                ->orWhere('nama_prodi', 'like', '%Sistem Informasi%')
                ->first();
            $prodiId = $siProdi ? $siProdi->id : \App\Models\ProgramStudi::value('id');
            $this->merge(['prodi_id' => $prodiId]);
        }

        if ($this->has('mata_kuliah_id') && ($this->mata_kuliah_id === '' || $this->mata_kuliah_id === 'null' || $this->mata_kuliah_id === 0 || $this->mata_kuliah_id === '0')) {
            $this->merge(['mata_kuliah_id' => null]);
        }

        if ($this->has('periode_id') && ($this->periode_id === '' || $this->periode_id === 'null' || $this->periode_id === 0 || $this->periode_id === '0')) {
            $this->merge(['periode_id' => null]);
        }
    }

    public function rules(): array
    {
        $id = $this->route('plo');
        $mataKuliahId = $this->mata_kuliah_id;
        $prodiId = $this->prodi_id;

        return [
            'kode' => [
                'required',
                'string',
                'max:30',
                Rule::unique('plo', 'kode')->ignore($id)->where(function ($query) use ($mataKuliahId, $prodiId) {
                    if ($mataKuliahId) {
                        return $query->where('mata_kuliah_id', $mataKuliahId);
                    } else {
                        return $query->whereNull('mata_kuliah_id')->where('prodi_id', $prodiId);
                    }
                }),
            ],
            'nama_plo'       => 'nullable|string|max:255',
            'deskripsi'      => 'nullable|string',
            'prodi_id'       => 'required|exists:program_studi,id',
            'mata_kuliah_id' => 'nullable|exists:courses,id',
            'periode_id'     => 'nullable|exists:periode,id',
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required' => 'Kode PLO wajib diisi.',
            'kode.max' => 'Kode PLO maksimal 30 karakter.',
            'kode.unique' => 'Kode PLO sudah terdaftar untuk mata kuliah ini.',
            'prodi_id.required' => 'Program Studi wajib dipilih.',
            'prodi_id.exists' => 'Program Studi tidak valid.',
        ];
    }
}
