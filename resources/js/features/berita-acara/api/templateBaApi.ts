import api from '@/shared/lib/api';

export interface TemplateBa {
    id: number;
    nama_template: string;
    nama_file?: string | null;
    file_path: string;
    is_active: boolean;
    uploaded_by: number;
    uploader?: {
        id: number;
        name: string;
        nama_lengkap?: string;
        email: string;
    };
    created_at: string;
    updated_at: string;
}

const BASE = '/template-ba';

export async function getTemplateBaList(): Promise<{ data: TemplateBa[] }> {
    const { data } = await api.get(BASE);
    return data;
}

export async function getActiveTemplateBa(): Promise<{ data: TemplateBa }> {
    const { data } = await api.get(`${BASE}/active`);
    return data;
}

export async function uploadTemplateBa(formData: FormData): Promise<TemplateBa> {
    const { data } = await api.post(BASE, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data.data;
}

export async function activateTemplateBa(id: number): Promise<TemplateBa> {
    const { data } = await api.put(`${BASE}/${id}/activate`);
    return data.data;
}

export async function deleteTemplateBa(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}

export function getTemplateDownloadUrl(id: number): string {
    return `${api.defaults.baseURL}${BASE}/${id}/download?token=${localStorage.getItem('auth_token')}`;
}
