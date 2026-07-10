import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPeriodeList, createPeriode, updatePeriode, deletePeriode, activatePeriode } from '../api/periodeApi';
import type { PeriodeFormData } from '../types/periode.types';

const QUERY_KEY = 'periode';

export function usePeriodeList(params: {
    page: number;
    per_page: number;
    search: string;
}) {
    return useQuery({
        queryKey: [QUERY_KEY, params],
        queryFn: () => getPeriodeList(params),
    });
}

export function useCreatePeriode() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: PeriodeFormData) => createPeriode(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useUpdatePeriode() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<PeriodeFormData> }) =>
            updatePeriode(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useDeletePeriode() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deletePeriode(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useActivatePeriode() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => activatePeriode(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}
