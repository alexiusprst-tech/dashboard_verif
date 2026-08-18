import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPenugasanKoordinatorList,
    createPenugasanKoordinator,
    deletePenugasanKoordinator,
} from '../api/penugasanKoordinatorApi';
import type { PenugasanKoordinatorFormData } from '../types/penugasanKoordinator.types';

const QUERY_KEY = 'penugasan-koordinator';

export function usePenugasanKoordinatorList(params: {
    periode_id: string | number;
    course_id?: string | number;
    q?: string;
    page?: number;
    per_page?: number;
}) {
    return useQuery({
        queryKey: [QUERY_KEY, params],
        queryFn: () => getPenugasanKoordinatorList(params),
        enabled: Boolean(params.periode_id),
    });
}

export function useCreatePenugasanKoordinator() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: PenugasanKoordinatorFormData) => createPenugasanKoordinator(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
            qc.invalidateQueries({ queryKey: ['dosen'] });
        },
    });
}

export function useDeletePenugasanKoordinator() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deletePenugasanKoordinator(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
            qc.invalidateQueries({ queryKey: ['dosen'] });
        },
    });
}
