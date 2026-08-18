<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RevisionHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this['id'] ?? null,
            'revision'      => $this['revision'] ?? 1,
            'status'        => $this['status'] ?? 'revisi',
            'notes'         => $this['notes'] ?? '',
            'catatan_clo'   => $this['catatan_clo'] ?? null,
            'version'       => $this['version'] ?? 'v1',
            'file_soal'     => $this['file_soal'] ?? null,
            'verifier_name' => $this['verifier_name'] ?? 'PIC Verifikator',
            'created_at'    => $this['created_at'] ?? null,
            'ba_pdf_url'    => $this['ba_pdf_url'] ?? null,
            'ba_docx_url'   => $this['ba_docx_url'] ?? null,
            'ba_nomor'      => $this['ba_nomor'] ?? null,
        ];
    }
}
