import type { ProgramStudi } from '@/features/plo-clo/types/plo.types';

export type TipeDosen = 'biasa' | 'lb';
export type SemesterLb = 'ganjil' | 'genap';

export interface DosenUser {
    id: number;
    uuid?: string;
    kode_dosen: string;
    nama_lengkap: string;
    name: string;
    email: string;
    prodi_id: number | null;
    prodi?: ProgramStudi | null;
    tipe_dosen: TipeDosen;
    semester_lb?: SemesterLb | null;
    is_super_admin: boolean;
    is_koordinator_mk?: boolean;
    is_coordinator?: boolean;
    dev_mode_enabled?: boolean;
    is_verifikator_aktif?: boolean;
    is_pic_active?: boolean;
    status_aktif: boolean;
    last_login_at?: string | null;
    created_at?: string;
}

export interface DosenFormData {
    name: string;
    email: string;
    password?: string;
    kode_dosen: string;
    tipe_dosen: TipeDosen;
    semester_lb?: SemesterLb | '';
    prodi_id: number | string | '';
    is_koordinator_mk?: boolean;
    is_coordinator?: boolean;
    dev_mode_enabled?: boolean;
    status_aktif: boolean;
}
