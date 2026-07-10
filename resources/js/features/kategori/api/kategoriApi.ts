import api from '@/shared/lib/api';
import type { Kategori, KategoriFormData } from '../types/kategori.types';
import type { PaginatedResponse } from '@/features/plo-clo/types/plo.types';

const BASE = '/kategori';

export async function getKategoriList(params: {
    page?: number;
    per_page?: number;
    search?: string;
}): Promise<PaginatedResponse<Kategori>> {
    const { data } = await api.get(BASE, { params });
    return data;
}

export async function getKategori(id: number): Promise<Kategori> {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
}

export async function createKategori(payload: KategoriFormData): Promise<Kategori> {
    const { data } = await api.post(BASE, payload);
    return data.data;
}

export async function updateKategori(id: number, payload: Partial<KategoriFormData>): Promise<Kategori> {
    const { data } = await api.put(`${BASE}/${id}`, payload);
    return data.data;
}

export async function deleteKategori(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}
