export interface Periode {
    id: number;
    nama_periode: string;
    semester: string | null;
    tahun_akademik: string | null;
    tanggal_mulai: string;
    tanggal_deadline: string;
    status: 'draft' | 'aktif' | 'selesai';
    created_at: string;
    updated_at: string;
}

export interface PeriodeFormData {
    nama_periode: string;
    semester: string;
    tahun_akademik: string;
    tanggal_mulai: string;
    tanggal_deadline: string;
}
