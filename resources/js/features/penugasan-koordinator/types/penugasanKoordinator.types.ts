export interface PenugasanKoordinatorCourse {
    id: number;
    kode_mk: string;
    nama_mk: string;
    sks?: number;
    semester?: number;
}

export interface PenugasanKoordinatorDosen {
    id: number;
    nama_lengkap: string;
    kode_dosen: string;
    email?: string;
}

export interface PenugasanKoordinatorPeriode {
    id: number;
    nama_periode: string;
}

export interface PenugasanKoordinatorAssignedBy {
    id: number;
    nama_lengkap: string;
}

export interface PenugasanKoordinator {
    id: number;
    course_id: number;
    dosen_id: number;
    periode_id: number;
    assigned_at: string;
    course?: PenugasanKoordinatorCourse | null;
    dosen?: PenugasanKoordinatorDosen | null;
    assigned_by_user?: PenugasanKoordinatorAssignedBy | null;
    periode?: PenugasanKoordinatorPeriode | null;
}

export interface PenugasanKoordinatorFormData {
    periode_id: number | '';
    dosen_id: number | '';
    course_id?: number | null | '';
}

export interface BulkAssignKoordinatorFormData {
    periode_id: number;
    dosen_id: number;
    course_ids: number[]; // if empty, applies to all
}
