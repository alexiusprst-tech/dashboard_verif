import api from '@/shared/lib/api';
import type { PaginatedResponse } from '@/shared/types/api.types';
import type { PenugasanKoordinator, PenugasanKoordinatorFormData } from '../types/penugasanKoordinator.types';

const BASE = '/penugasan-koordinator';

export async function getPenugasanKoordinatorList(params: {
    periode_id: string | number;
    course_id?: string | number;
    q?: string;
    page?: number;
    per_page?: number;
}): Promise<PaginatedResponse<PenugasanKoordinator>> {
    const res = await api.get(BASE, { params });
    return res.data;
}

export async function createPenugasanKoordinator(payload: PenugasanKoordinatorFormData): Promise<any> {
    const res = await api.post(BASE, payload);
    return res.data;
}

export async function deletePenugasanKoordinator(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}
