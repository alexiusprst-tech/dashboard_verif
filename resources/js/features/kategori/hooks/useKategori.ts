import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKategoriList, createKategori, updateKategori, deleteKategori } from '../api/kategoriApi';
import type { KategoriFormData } from '../types/kategori.types';

const QUERY_KEY = 'kategori';

export function useKategoriList(params: {
    page: number;
    per_page: number;
    search: string;
}) {
    return useQuery({
        queryKey: [QUERY_KEY, params],
        queryFn: () => getKategoriList(params),
    });
}

export function useCreateKategori() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: KategoriFormData) => createKategori(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useUpdateKategori() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: Partial<KategoriFormData> }) =>
            updateKategori(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useDeleteKategori() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteKategori(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}
