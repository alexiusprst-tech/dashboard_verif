import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTugasSaya, submitVerifikasi, getVerifikasiHistory } from '../api/verifikasiApi';
import type { VerifikasiFormData } from '../types/verifikasi.types';

const QUERY_KEY = 'verifikasi';

export function useTugasSaya(params: {
    periode_id?: number | string;
    page: number;
    per_page: number;
}) {
    return useQuery({
        queryKey: [QUERY_KEY, 'tugas-saya', params],
        queryFn: () => getTugasSaya(params),
    });
}

export function useSubmitVerifikasi() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ soalId, payload }: { soalId: number; payload: VerifikasiFormData }) =>
            submitVerifikasi(soalId, payload),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
            qc.invalidateQueries({ queryKey: ['soal'] });
            qc.invalidateQueries({ queryKey: ['verifikasi_history', variables.soalId] });
        },
    });
}

export function useVerifikasiHistory(soalId: number) {
    return useQuery({
        queryKey: ['verifikasi_history', soalId],
        queryFn: () => getVerifikasiHistory(soalId),
        enabled: !!soalId,
    });
}
