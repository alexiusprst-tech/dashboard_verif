import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDosenList, getDosen, createDosen, updateDosen, deleteDosen } from '../api/dosenApi';
import type { DosenFormData } from '../types/dosen.types';

const QUERY_KEY = 'dosen';

export function useDosenList(params?: {
    page?: number;
    per_page?: number;
    q?: string;
    prodi_id?: number | string;
    tipe_dosen?: string;
}) {
    return useQuery({
        queryKey: [QUERY_KEY, params],
        queryFn: () => getDosenList(params),
    });
}

export function useDosenDetail(id: number) {
    return useQuery({
        queryKey: [QUERY_KEY, id],
        queryFn: () => getDosen(id),
        enabled: !!id,
    });
}

export function useCreateDosen() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: DosenFormData) => createDosen(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

export function useUpdateDosen() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<DosenFormData> }) =>
            updateDosen(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

export function useDeleteDosen() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteDosen(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}
