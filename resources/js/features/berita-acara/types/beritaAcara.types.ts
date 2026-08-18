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
    soal_id?: number;
    soal?: {
        id: number;
        judul_soal: string;
        status: string;
        mata_kuliah?: {
            id: number;
            kode_mk: string;
            nama_mk: string;
        };
        dosen?: {
            id: number;
            nama_lengkap: string;
        };
    };
    periode_id: number;
    periode?: Periode;
    verifier_id: number;
    verifier?: AuthUser;
    generated_at: string;
    file_pdf: string | null;
    file_url?: string;
    file_docx: string | null;
    file_docx_url?: string;
    items?: BeritaAcaraItem[];
}

export interface GenerateBaFormData {
    periode_id: number | '';
    verifier_id: number | '';
    regenerate?: boolean;
}
