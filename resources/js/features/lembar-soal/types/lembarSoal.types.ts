export interface LembarSoalClo {
    id?: number;
    kode: string;
    deskripsi: string;
    bobot_lo: string;
    soal_text?: string;
}

export interface LembarSoalPlo {
    id?: number;
    kode: string;
    deskripsi: string;
    clo: LembarSoalClo[];
}

export interface LembarSoalData {
    nama_evaluasi: string;
    kode_nama_mk: string;
    kode_dosen: string;
    tipe_ujian: string;
    tanggal_evaluasi: string;
    tipe_soal: string;
    form_no?: string;
    petunjuk_pengerjaan: string[];
    plo: LembarSoalPlo[];
}

export interface CourseStructureResponse {
    course: {
        id: number;
        kode_mk: string;
        nama_mk: string;
        sks: number;
        kode_nama_mk: string;
    };
    kode_dosen: string;
    periode_nama: string;
    plo_structure: LembarSoalPlo[];
}
