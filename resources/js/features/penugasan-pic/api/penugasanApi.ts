import api from '@/shared/lib/api';
import type { Penugasan, PenugasanFormData } from '../types/penugasan.types';
import type { PaginatedResponse } from '@/shared/types/api.types';

const BASE = '/penugasan-verifikator';

export async function getPenugasanList(params: {
    periode_id: number | string;
    course_id?: number | string;
    q?: string;
    page?: number;
    per_page?: number;
}): Promise<PaginatedResponse<Penugasan>> {
    const { data } = await api.get(BASE, { params });
    return data;
}

export async function createPenugasan(payload: PenugasanFormData): Promise<any> {
    const { data } = await api.post(BASE, payload);
    return data;
}

export async function deletePenugasan(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}

export async function searchDosen(query: string): Promise<any> {
    const { data } = await api.get('/dosen/search', { params: { q: query, per_page: 50 } });
    return data.data;
}
