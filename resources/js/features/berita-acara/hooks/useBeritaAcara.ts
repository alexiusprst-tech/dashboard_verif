import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBaList, generateBa } from '../api/beritaAcaraApi';
import type { GenerateBaFormData } from '../types/beritaAcara.types';

const QUERY_KEY = 'berita-acara';

export function useBaList(params: {
    periode_id?: number | string;
    verifier_id?: number | string;
    page: number;
    per_page: number;
}) {
    return useQuery({
        queryKey: [QUERY_KEY, params],
        queryFn: () => getBaList(params),
    });
}

export function useGenerateBa() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: GenerateBaFormData) => generateBa(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
            qc.invalidateQueries({ queryKey: ['soal'] });
        },
    });
}
