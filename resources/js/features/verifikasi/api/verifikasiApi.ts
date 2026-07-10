import api from '@/shared/lib/api';
import type { Verification, VerifikasiFormData } from '../types/verifikasi.types';
import type { Soal } from '@/features/soal/types/soal.types';
import type { PaginatedResponse } from '@/features/plo-clo/types/plo.types';

export async function getTugasSaya(params: {
    periode_id?: number | string;
    page: number;
    per_page: number;
}): Promise<PaginatedResponse<Soal>> {
    const { data } = await api.get('/verifikasi/tugas-saya', { params });
    return data;
}

export async function submitVerifikasi(soalId: number, payload: VerifikasiFormData): Promise<Verification> {
    const { data } = await api.post(`/soal/${soalId}/verifikasi`, payload);
    return data.data;
}

export async function getVerifikasiHistory(soalId: number): Promise<Verification[]> {
    const { data } = await api.get(`/soal/${soalId}/verifikasi/history`);
    return data.data;
}
