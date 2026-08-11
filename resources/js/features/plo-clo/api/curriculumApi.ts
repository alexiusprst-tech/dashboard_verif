import api from '@/shared/lib/api';

export async function downloadTemplate(type: string): Promise<Blob> {
    const response = await api.get(`/curriculum/template/${encodeURIComponent(type)}`, { responseType: 'blob' });
    return response.data;
}
