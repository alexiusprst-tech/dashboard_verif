import api from '@/shared/lib/api';
import type { Plo, PloFormData, PaginatedResponse } from '../types/plo.types';

const BASE = '/plo';

/* ── List (paginated) ───────────────────────────────────────── */

export async function getPloList(params: {
    prodi_id: number | string;
    page?: number;
    per_page?: number;
    search?: string;
}): Promise<PaginatedResponse<Plo>> {
    const { data } = await api.get(BASE, { params });
    return data;
}

/* ── Single ─────────────────────────────────────────────────── */

export async function getPlo(id: number): Promise<Plo> {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
}

/* ── Create ─────────────────────────────────────────────────── */

export async function createPlo(payload: PloFormData): Promise<Plo> {
    const { data } = await api.post(BASE, payload);
    return data.data;
}

/* ── Update ─────────────────────────────────────────────────── */

export async function updatePlo(id: number, payload: Partial<PloFormData>): Promise<Plo> {
    const { data } = await api.put(`${BASE}/${id}`, payload);
    return data.data;
}

/* ── Delete ─────────────────────────────────────────────────── */

export async function deletePlo(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}
