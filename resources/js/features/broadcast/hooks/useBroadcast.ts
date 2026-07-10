import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getBroadcastList,
    getBroadcastFeed,
    createBroadcast,
    publishBroadcast,
} from '../api/broadcastApi';
import type { CreateBroadcastPayload } from '../types/broadcast.types';

const QUERY_KEY = 'broadcast';

export function useBroadcastList(params?: { page?: number; per_page?: number }) {
    return useQuery({
        queryKey: [QUERY_KEY, 'list', params],
        queryFn: () => getBroadcastList(params),
    });
}

export function useBroadcastFeed(params?: { page?: number; per_page?: number }) {
    return useQuery({
        queryKey: [QUERY_KEY, 'feed', params],
        queryFn: () => getBroadcastFeed(params),
    });
}

export function useCreateBroadcast() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateBroadcastPayload) => createBroadcast(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}

export function usePublishBroadcast() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => publishBroadcast(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY] });
        },
    });
}
