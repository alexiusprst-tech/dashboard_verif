import api from '@/shared/lib/api';
import type { CourseUploadProgress } from '../types/uploadProgress.types';

export async function getUploadProgress(periodeId?: string | number, role?: string): Promise<CourseUploadProgress[]> {
    const { data } = await api.get('/dashboard/upload-progress', {
        params: {
            periode_id: periodeId || undefined,
            role: role || undefined,
        },
    });
    return data.data;
}
