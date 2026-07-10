import type { Periode } from '@/features/periode/types/periode.types';
import type { AuthUser } from '@/shared/hooks/useAuth';

export interface BeritaAcaraItem {
    id: number;
    berita_acara_id: number;
    soal_id: number;
    judul_soal: string;
    mata_kuliah_nama: string;
    dosen_pengampu_nama: string;
    status_soal: string;
    catatan: string | null;
}

export interface BeritaAcara {
    id: number;
    nomor_ba: string;
    periode_id: number;
    periode?: Periode;
    verifier_id: number;
    verifier?: AuthUser;
    generated_at: string;
    file_pdf: string | null;
    file_url?: string;
    items?: BeritaAcaraItem[];
}

export interface GenerateBaFormData {
    periode_id: number | '';
    regenerate?: boolean;
}
