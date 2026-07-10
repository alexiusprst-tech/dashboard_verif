import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSoalList, uploadSoal, updateSoal, deleteSoal } from '../api/soalApi';

const QUERY_KEY = 'soal';

export function useSoalList(params: {
    page: number;
    per_page: number;
    search: string;
    periode_id?: string;
    status?: string;
}) {
    return useQuery({
        queryKey: [QUERY_KEY, params],
        queryFn: () => getSoalList(params),
    });
}

export function useUploadSoal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: FormData) => uploadSoal(payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useUpdateSoal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: FormData }) => updateSoal(id, payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}

export function useDeleteSoal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteSoal(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
}
