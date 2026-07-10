import api from '@/shared/lib/api';
import type { Periode, PeriodeFormData } from '../types/periode.types';
import type { PaginatedResponse } from '@/features/plo-clo/types/plo.types';

const BASE = '/periode';

export async function getPeriodeList(params: {
    page?: number;
    per_page?: number;
    search?: string;
}): Promise<PaginatedResponse<Periode>> {
    const { data } = await api.get(BASE, { params });
    return data;
}

export async function getPeriode(id: number): Promise<Periode> {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
}

export async function createPeriode(payload: PeriodeFormData): Promise<Periode> {
    const { data } = await api.post(BASE, payload);
    return data.data;
}

export async function updatePeriode(id: number, payload: Partial<PeriodeFormData>): Promise<Periode> {
    const { data } = await api.put(`${BASE}/${id}`, payload);
    return data.data;
}

export async function deletePeriode(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}

export async function activatePeriode(id: number): Promise<Periode> {
    const { data } = await api.patch(`${BASE}/${id}/activate`);
    return data.data;
}
