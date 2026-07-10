import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPloList, createPlo, updatePlo, deletePlo } from '../api/ploApi';
import type { PloFormData } from '../types/plo.types';

const QUERY_KEY = 'plo';

export function usePloList(params: {
    prodi_id: number | string;
    page: number;
    per_page: number;
    search: string;
}) {
    return useQuery({
        queryKey: [QUERY_KEY, params],
        queryFn: () => getPloList(params),
        enabled: !!params.prodi_id,
    });
}

export function useCreatePlo() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: PloFormData) => createPlo(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useUpdatePlo() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<PloFormData> }) =>
            updatePlo(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useDeletePlo() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deletePlo(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}
