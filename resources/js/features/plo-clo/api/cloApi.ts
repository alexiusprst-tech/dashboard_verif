import api from '@/shared/lib/api';
import type {
    Clo,
    CloFormData,
    PaginatedResponse,
    ImportPreviewResult,
    CloImportPreviewRow,
} from '../types/plo.types';

const BASE = '/clo';

export async function getCloList(params: {
    plo_id?: number | string;
    mata_kuliah_id?: number | string;
    periode_id?: number | string;
    page?: number;
    per_page?: number;
    search?: string;
}): Promise<PaginatedResponse<Clo>> {
    const { data } = await api.get(BASE, { params });
    return data;
}

export async function getClo(id: number): Promise<Clo> {
    const { data } = await api.get(`${BASE}/${id}`);
    return data.data;
}

export async function createClo(payload: CloFormData): Promise<Clo> {
    const { data } = await api.post(BASE, payload);
    return data.data;
}

export async function updateClo(id: number, payload: Partial<CloFormData>): Promise<Clo> {
    const { data } = await api.put(`${BASE}/${id}`, payload);
    return data.data;
}

export async function deleteClo(id: number): Promise<void> {
    await api.delete(`${BASE}/${id}`);
}

export async function previewImportClo(file: File, sheet?: string): Promise<ImportPreviewResult<CloImportPreviewRow>> {
    const formData = new FormData();
    formData.append('file', file);
    if (sheet) formData.append('sheet', sheet);
    const { data } = await api.post(`${BASE}/preview-import`, formData);
    return data.data;
}

export async function importClo(file: File, sheet?: string): Promise<{ created: number; total: number }> {
    const formData = new FormData();
    formData.append('file', file);
    if (sheet) formData.append('sheet', sheet);
    const { data } = await api.post(`${BASE}/import`, formData);
    return data.data;
}

export async function exportClo(): Promise<Blob> {
    const response = await api.get(`${BASE}/export`, { responseType: 'blob' });
    return response.data;
}
