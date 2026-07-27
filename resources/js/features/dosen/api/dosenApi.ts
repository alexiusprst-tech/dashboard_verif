import api from '@/shared/lib/api';
import type { DosenUser, DosenFormData } from '../types/dosen.types';
import type { PaginatedResponse } from '@/features/plo-clo/types/plo.types';

const BASE = '/dosen';

export async function getDosenList(params?: {
    page?: number;
    per_page?: number;
    q?: string;
    search?: string;
    prodi_id?: number | string;
    tipe_dosen?: string;
}): Promise<PaginatedResponse<DosenUser>> {
    const { data } = await api.get(BASE, { params });
    return data;
}

export async function getDosen(id: number): Promise<DosenUser> {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
}

export async function createDosen(payload: DosenFormData): Promise<DosenUser> {
    const { data } = await api.post(BASE, payload);
    return data.data;
}

export async function updateDosen(id: number, payload: Partial<DosenFormData>): Promise<DosenUser> {
    const { data } = await api.put(`${BASE}/${id}`, payload);
    return data.data;
}

export async function deleteDosen(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}
