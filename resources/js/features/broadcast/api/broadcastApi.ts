import api from '@/shared/lib/api';
import type { BroadcastListResponse, CreateBroadcastPayload } from '../types/broadcast.types';

export async function getBroadcastList(params?: {
    page?: number;
    per_page?: number;
}): Promise<BroadcastListResponse> {
    const res = await api.get('/broadcast', { params });
    // Handle both paginated and flat responses
    if (res.data.data && Array.isArray(res.data.data)) {
        return {
            data: res.data.data,
            meta: res.data.meta ?? {
                current_page: 1,
                last_page: 1,
                per_page: params?.per_page ?? 15,
                total: res.data.data.length,
                from: 1,
                to: res.data.data.length,
            },
        };
    }
    return res.data;
}

export async function getBroadcastFeed(params?: {
    page?: number;
    per_page?: number;
}): Promise<BroadcastListResponse> {
    const res = await api.get('/broadcast/feed', { params });
    if (res.data.data && Array.isArray(res.data.data)) {
        return {
            data: res.data.data,
            meta: res.data.meta ?? {
                current_page: 1,
                last_page: 1,
                per_page: params?.per_page ?? 15,
                total: res.data.data.length,
                from: 1,
                to: res.data.data.length,
            },
        };
    }
    return res.data;
}

export async function createBroadcast(payload: CreateBroadcastPayload) {
    const res = await api.post('/broadcast', payload);
    return res.data.data;
}

export async function publishBroadcast(id: number) {
    const res = await api.patch(`/broadcast/${id}/publish`);
    return res.data.data;
}
