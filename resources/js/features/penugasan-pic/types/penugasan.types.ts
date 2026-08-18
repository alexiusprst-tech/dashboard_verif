export interface PenugasanVerifikatorCourse {
    id: number;
    kode_mk: string;
    nama_mk: string;
    sks?: number;
    semester?: number;
}

export interface PenugasanVerifikatorDosen {
    id: number;
    nama_lengkap: string;
    kode_dosen: string;
    email?: string;
}

export interface PenugasanVerifikatorPeriode {
    id: number;
    nama_periode: string;
}

export interface PenugasanVerifikatorAssignedBy {
    id: number;
    nama_lengkap: string;
}

export interface PenugasanVerifikator {
    id: number;
    course_id: number;
    dosen_id: number;
    periode_id: number;
    assigned_at: string;
    created_at?: string;
    course?: PenugasanVerifikatorCourse | null;
    dosen?: PenugasanVerifikatorDosen | null;
    assigned_by_user?: PenugasanVerifikatorAssignedBy | null;
    periode?: PenugasanVerifikatorPeriode | null;
}

export interface PenugasanFormData {
    periode_id: number | '';
    dosen_id?: number | '';
    pic_dosen_id?: number | '';
    course_id?: number | null | '';
}

// Alias backward-compat
export type Penugasan = PenugasanVerifikator;
