/* ── PLO Types ──────────────────────────────────────────────── */

export interface Plo {
    id: number;
    kode: string;
    deskripsi: string;
    prodi_id: number;
    prodi_name?: string;
    created_by?: number;
    created_at: string;
    updated_at: string;
    clo_count?: number;
}

export interface PloFormData {
    kode: string;
    deskripsi: string;
    prodi_id: number | '';
}

/* ── CLO Types ──────────────────────────────────────────────── */

export interface Clo {
    id: number;
    kode: string;
    deskripsi: string;
    plo_id: number;
    plo_kode?: string;
    mata_kuliah_id?: number;
    mata_kuliah_nama?: string;
    created_at: string;
    updated_at: string;
}

export interface CloFormData {
    kode: string;
    deskripsi: string;
    plo_id: number | '';
    mata_kuliah_id?: number | '';
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
