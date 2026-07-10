import type { Periode } from '@/features/periode/types/periode.types';
import type { ProgramStudi, MataKuliah, Clo } from '@/features/plo-clo/types/plo.types';
import type { Kategori, TemplateSoal } from '@/features/kategori/types/kategori.types';

export interface Soal {
    id: number;
    uuid: string;
    dosen_id: number;
    dosen_name?: string;
    mata_kuliah_id: number;
    mata_kuliah_kode?: string;
    mata_kuliah_nama?: string;
    mata_kuliah?: MataKuliah;
    clo_id: number;
    clo_kode?: string;
    clo?: Clo;
    periode_id: number;
    periode_nama?: string;
    periode?: Periode;
    template_id: number;
    template_nama_file?: string;
    template?: TemplateSoal;
    judul_soal: string;
    file_soal: string;
    file_url?: string;
    versi: string;
    status: 'draft' | 'submitted' | 'in_review' | 'revisi' | 'approved' | 'rejected';
    uploaded_at: string;
    created_at: string;
    updated_at: string;
}

export interface SoalFormData {
    periode_id: number | '';
    mata_kuliah_id: number | '';
    clo_id: number | '';
    template_id: number | '';
    judul_soal: string;
    file_soal: FileList | null;
}
