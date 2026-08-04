import { useQuery } from '@tanstack/react-query';
import { getUploadProgress } from '../api/dashboardApi';
import type { CourseUploadProgress } from '../types/uploadProgress.types';

export function useUploadProgress(periodeId?: string | number) {
    return useQuery<CourseUploadProgress[]>({
        queryKey: ['upload-progress', periodeId],
        queryFn: () => getUploadProgress(periodeId),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}
