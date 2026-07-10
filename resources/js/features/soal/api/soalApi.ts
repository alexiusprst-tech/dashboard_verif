import api from '@/shared/lib/api';
import type { Soal } from '../types/soal.types';
import type { PaginatedResponse } from '@/features/plo-clo/types/plo.types';

const BASE = '/soal';

export async function getSoalList(params: {
    page?: number;
    per_page?: number;
    search?: string;
    periode_id?: string;
    status?: string;
}): Promise<PaginatedResponse<Soal>> {
    const { data } = await api.get(BASE, { params });
    return data;
}

export async function getSoal(id: number): Promise<Soal> {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
}

export async function uploadSoal(payload: FormData): Promise<Soal> {
    const { data } = await api.post(BASE, payload, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return data.data;
}

export async function updateSoal(id: number, payload: FormData): Promise<Soal> {
    const { data } = await api.post(`${BASE}/${id}`, payload, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'X-HTTP-Method-Override': 'PUT', // standard Laravel override for multipart PUT
        },
    });
    return data.data;
}

export async function deleteSoal(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}
