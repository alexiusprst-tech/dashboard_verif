import type { Periode } from '@/features/periode/types/periode.types';

export type TargetBroadcast = 'semua' | 'prodi_tertentu';

export interface Broadcast {
    id: number;
    judul: string;
    isi: string;
    target: TargetBroadcast;
    target_label: string;
    prodi?: { id: number; nama_prodi: string } | null;
    periode?: Periode | null;
    creator_name: string | null;
    published_at: string | null;
    created_at: string;
}

export interface BroadcastListResponse {
    data: Broadcast[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

export interface CreateBroadcastPayload {
    judul: string;
    isi: string;
    target: TargetBroadcast;
    prodi_id?: number | null;
    periode_id?: number | null;
}
