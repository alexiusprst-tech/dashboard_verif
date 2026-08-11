/* ── PLO Types ──────────────────────────────────────────────── */

export interface Plo {
    id: number;
    kode: string;
    deskripsi: string;
    prodi_id: number;
    prodi_name?: string;
    prodi?: ProgramStudi;
    periode_id?: number;
    created_by?: number;
    created_at: string;
    updated_at: string;
    clo_count?: number;
    clo?: Clo[];
}

export interface PloFormData {
    kode: string;
    deskripsi: string;
    prodi_id: number | '';
    periode_id?: number;
}

/* ── CLO Types ──────────────────────────────────────────────── */

export interface Clo {
    id: number;
    kode: string;
    deskripsi: string;
    plo_id: number;
    plo_kode?: string;
    plo?: Plo;
    courses?: MataKuliah[];
    courses_count?: number;
    created_at: string;
    updated_at: string;
}

export interface CloFormData {
    kode: string;
    deskripsi: string;
    plo_id: number | '';
    periode_id?: number;
}

export interface PloImportPreviewRow {
    row: number;
    kode_plo: string;
    deskripsi: string;
    kode_prodi: string;
    status: 'valid' | 'invalid';
    errors: string[];
}

export interface CloImportPreviewRow {
    row: number;
    kode_mk: string;
    kode_clo: string;
    deskripsi: string;
    kode_plo: string;
    status: 'valid' | 'invalid';
    errors: string[];
}

export interface ImportPreviewResult<T> {
    total: number;
    valid: number;
    invalid: number;
    rows: T[];
    errors: Array<{
        row: number;
        errors: string[];
    }>;
}

/* ── Pagination Meta ────────────────────────────────────────── */

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
}

/* ── Program Studi ──────────────────────────────────────────── */

export interface ProgramStudi {
    id: number;
    nama_prodi: string;
    kode_prodi: string;
}

/* ── Mata Kuliah ────────────────────────────────────────────── */

export interface MataKuliah {
    id: number;
    nama_mk: string;
    kode_mk: string;
    prodi_id?: number;
}
