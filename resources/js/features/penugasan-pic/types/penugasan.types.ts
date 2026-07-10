import type { Periode } from '@/features/periode/types/periode.types';
import type { AuthUser } from '@/shared/hooks/useAuth';

export interface Penugasan {
    id: number;
    periode_id: number;
    periode?: Periode;
    verifier_id: number;
    verifier?: AuthUser;
    target_dosen_id: number;
    target_dosen?: AuthUser;
    assigned_by: number;
    assigned_by_user?: AuthUser;
    assigned_at: string;
    created_at: string;
    updated_at: string;
}

export interface PenugasanFormData {
    periode_id: number | '';
    pic_dosen_id: number | '';
    target_dosen_id: number[];
}
