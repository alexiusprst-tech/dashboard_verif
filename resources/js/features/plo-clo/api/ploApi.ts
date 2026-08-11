import api from '@/shared/lib/api';
import type {
    Plo,
    PloFormData,
    PaginatedResponse,
    ImportPreviewResult,
    PloImportPreviewRow,
} from '../types/plo.types';

const BASE = '/plo';

/* ── List (paginated) ───────────────────────────────────────── */

export async function getPloList(params: {
    prodi_id: number | string;
    mata_kuliah_id?: number | string;
    periode_id?: number | string;
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

export async function previewImportPlo(file: File, sheet?: string): Promise<ImportPreviewResult<PloImportPreviewRow>> {
    const formData = new FormData();
    formData.append('file', file);
    if (sheet) formData.append('sheet', sheet);
    const { data } = await api.post(`${BASE}/preview-import`, formData);
    return data.data;
}

export async function importPlo(file: File, sheet?: string): Promise<{ created: number; total: number }> {
    const formData = new FormData();
    formData.append('file', file);
    if (sheet) formData.append('sheet', sheet);
    const { data } = await api.post(`${BASE}/import`, formData);
    return data.data;
}

export async function exportPlo(): Promise<Blob> {
    const response = await api.get(`${BASE}/export`, { responseType: 'blob' });
    return response.data;
}
