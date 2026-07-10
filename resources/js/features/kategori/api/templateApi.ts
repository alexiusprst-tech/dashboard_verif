import api from '@/shared/lib/api';
import type { TemplateSoal } from '../types/kategori.types';

const BASE = '/templates';

export async function getTemplateList(kategoriId: number | string): Promise<TemplateSoal[]> {
    const { data } = await api.get(BASE, { params: { kategori_id: kategoriId } });
    return data.data;
}

export async function uploadTemplate(payload: FormData): Promise<TemplateSoal> {
    const { data } = await api.post(BASE, payload, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data.data;
}

export async function deleteTemplate(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}
