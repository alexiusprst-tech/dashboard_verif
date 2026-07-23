import api from '@/shared/lib/api';
import type { BeritaAcara, GenerateBaFormData } from '../types/beritaAcara.types';
import type { PaginatedResponse } from '@/features/plo-clo/types/plo.types';

const BASE = '/berita-acara';

export async function getBaList(params: {
    periode_id?: number | string;
    verifier_id?: number | string;
    page: number;
    per_page: number;
}): Promise<PaginatedResponse<BeritaAcara>> {
    const { data } = await api.get(BASE, { params });
    return data;
}

export async function generateBa(payload: GenerateBaFormData): Promise<BeritaAcara> {
    const params: any = {};
    if (payload.regenerate) {
        params.regenerate = 1;
    }
    const { data } = await api.post(
        `${BASE}/generate`,
        { periode_id: payload.periode_id, verifier_id: payload.verifier_id },
        { params }
    );
    return data.data;
}

export function getPrintUrl(id: number, type: 'ba' | 'soal' | 'both' = 'ba'): string {
    return `${api.defaults.baseURL}${BASE}/${id}/print?type=${type}&token=${localStorage.getItem('auth_token')}`;
}
