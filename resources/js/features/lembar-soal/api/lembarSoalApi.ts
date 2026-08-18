import api from '@/shared/lib/api';
import type { LembarSoalData, CourseStructureResponse } from '../types/lembarSoal.types';

const BASE = '/lembar-soal';

export async function getCourseStructure(courseId: number): Promise<CourseStructureResponse> {
    const { data } = await api.get(`${BASE}/course-structure/${courseId}`);
    return data.data;
}

export async function downloadDocx(payload: LembarSoalData): Promise<Blob> {
    const response = await api.post(`${BASE}/download-docx`, payload, {
        responseType: 'blob',
    });
    return response.data;
}

export async function downloadPdf(payload: LembarSoalData): Promise<Blob> {
    const response = await api.post(`${BASE}/download-pdf`, payload, {
        responseType: 'blob',
    });
    return response.data;
}

/**
 * Trigger browser file download helper from a Blob
 */
export function triggerFileDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
