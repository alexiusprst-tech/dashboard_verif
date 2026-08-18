import type { Soal } from '@/features/soal/types/soal.types';

export interface CatatanCloItem {
    clo_id: number;
    kode: string;
    deskripsi?: string;
    catatan: string;
    status?: 'sesuai' | 'revisi' | 'tolak';
}

export interface Verification {
    id: number;
    soal_id: number;
    soal?: Soal;
    verifier_id: number;
    verifier?: {
        id: number;
        nama_lengkap: string;
        email: string;
    };
    tipe_verifikator: 'pic' | 'coordinator';
    tipe_verifikator_label?: string;
    status: 'approved' | 'revisi' | 'rejected';
    status_label?: string;
    catatan: string | null;
    catatan_clo?: CatatanCloItem[] | null;
    verified_at: string;
    created_at: string;
    updated_at: string;
}

export interface VerifikasiFormData {
    status: 'approved' | 'revisi' | 'rejected';
    tipe_verifikator: 'pic' | 'coordinator';
    catatan?: string;
    catatan_clo?: CatatanCloItem[];
}
