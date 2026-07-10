import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTemplateList, uploadTemplate, deleteTemplate } from '../api/templateApi';

const QUERY_KEY = 'templates';

export function useTemplateList(kategoriId: number | string) {
    return useQuery({
        queryKey: [QUERY_KEY, kategoriId],
        queryFn: () => getTemplateList(kategoriId),
        enabled: !!kategoriId,
    });
}

export function useUploadTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: FormData) => uploadTemplate(payload),
        onSuccess: (_, variables) => {
            const katId = variables.get('kategori_id');
            if (katId) {
                qc.invalidateQueries({ queryKey: [QUERY_KEY, katId.toString()] });
            }
        },
    });
}

export function useDeleteTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, kategoriId }: { id: number; kategoriId: number | string }) => deleteTemplate(id),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY, variables.kategoriId.toString()] });
        },
    });
}
