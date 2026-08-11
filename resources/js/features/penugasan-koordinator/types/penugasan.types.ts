import type { Periode } from '@/features/periode/types/periode.types';

/** Representasi satu baris dari tabel user_roles (role Koordinator) */
export interface UserRoleKoordinator {
    id: number;
    user_id: number;
    periode_id: number;
    assigned_at: string;
    created_at: string;
    /** User yang diberi role Koordinator */
    user?: {
        id: number;
        nama_lengkap: string;
        kode_dosen: string;
        email?: string;
    };
    /** Super Admin yang melakukan assignment */
    assigned_by_user?: {
        id: number;
        nama_lengkap: string;
    };
}

/** Form data untuk assign Koordinator — simpel, tanpa target_dosen */
export interface PenugasanFormData {
    periode_id: number | '';
    user_id: number | '';
}

// Alias backward-compat untuk komponen yang masih pakai nama Penugasan
export type Penugasan = UserRoleKoordinator;
