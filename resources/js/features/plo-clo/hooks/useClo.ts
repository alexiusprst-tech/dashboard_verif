import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCloList, createClo, updateClo, deleteClo } from '../api/cloApi';
import type { CloFormData } from '../types/plo.types';

const QUERY_KEY = 'clo';

export function useCloList(params: {
    plo_id?: number | string;
    page: number;
    per_page: number;
    search: string;
}) {
    return useQuery({
        queryKey: [QUERY_KEY, params],
        queryFn: () => getCloList(params),
    });
}

export function useCreateClo() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CloFormData) => createClo(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useUpdateClo() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<CloFormData> }) =>
            updateClo(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useDeleteClo() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteClo(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}
