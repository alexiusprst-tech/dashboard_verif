import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPenugasanList, createPenugasan, deletePenugasan, searchDosen } from '../api/penugasanApi';
import type { PenugasanFormData } from '../types/penugasan.types';

const QUERY_KEY = 'penugasan';

export function usePenugasanList(params: {
    periode_id: number | string;
    page: number;
    per_page: number;
}) {
    return useQuery({
        queryKey: [QUERY_KEY, params],
        queryFn: () => getPenugasanList(params),
        enabled: !!params.periode_id,
    });
}

export function useCreatePenugasan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: PenugasanFormData) => createPenugasan(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useDeletePenugasan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deletePenugasan(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useSearchDosen(query: string) {
    return useQuery({
        queryKey: ['dosen_search', query],
        queryFn: () => searchDosen(query),
        enabled: query.length >= 2,
    });
}
