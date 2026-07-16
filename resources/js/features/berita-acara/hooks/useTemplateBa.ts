import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getTemplateBaList,
    getActiveTemplateBa,
    uploadTemplateBa,
    activateTemplateBa,
    deleteTemplateBa
} from '../api/templateBaApi';

const QUERY_KEY = 'template-ba';

export function useTemplateBaList() {
    return useQuery({
        queryKey: [QUERY_KEY],
        queryFn: getTemplateBaList,
    });
}

export function useActiveTemplateBa() {
    return useQuery({
        queryKey: [QUERY_KEY, 'active'],
        queryFn: getActiveTemplateBa,
        retry: false,
    });
}

export function useUploadTemplateBa() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: FormData) => uploadTemplateBa(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
            qc.invalidateQueries({ queryKey: [QUERY_KEY, 'active'] });
        },
    });
}

export function useActivateTemplateBa() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => activateTemplateBa(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
            qc.invalidateQueries({ queryKey: [QUERY_KEY, 'active'] });
        },
    });
}

export function useDeleteTemplateBa() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteTemplateBa(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
            qc.invalidateQueries({ queryKey: [QUERY_KEY, 'active'] });
        },
    });
}
