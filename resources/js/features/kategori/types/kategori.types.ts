export interface Kategori {
    id: number;
    nama_kategori: string;
    deskripsi: string | null;
    created_at: string;
    updated_at: string;
    // Client-side mapping
    icon?: string;
    color?: string;
}

export interface KategoriFormData {
    nama_kategori: string;
    deskripsi: string;
}

export interface TemplateSoal {
    id: number;
    kategori_id: number;
    nama_file: string;
    file_path: string;
    versi: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    kategori?: Kategori;
}

export interface TemplateFormData {
    kategori_id: number;
    file_template: FileList;
    versi: string;
}
