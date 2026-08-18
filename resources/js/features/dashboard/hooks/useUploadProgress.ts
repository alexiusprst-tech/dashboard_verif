import { useQuery } from '@tanstack/react-query';
import { getUploadProgress } from '../api/dashboardApi';
import type { CourseUploadProgress } from '../types/uploadProgress.types';

export function useUploadProgress(periodeId?: string | number, role?: string) {
    return useQuery<CourseUploadProgress[]>({
        queryKey: ['upload-progress', periodeId, role],
        queryFn: () => getUploadProgress(periodeId, role),
        staleTime: 0,
    });
}
