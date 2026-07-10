import type { Soal } from '@/features/soal/types/soal.types';

export interface Verification {
    id: number;
    soal_id: number;
    soal?: Soal;
    verifier_id: number;
    tipe_verifikator: 'pic' | 'coordinator';
    status: 'approved' | 'revisi' | 'rejected';
    catatan: string | null;
    verified_at: string;
    created_at: string;
    updated_at: string;
}

export interface VerifikasiFormData {
    status: 'approved' | 'revisi' | 'rejected';
    tipe_verifikator: 'pic' | 'coordinator';
    catatan: string;
}
