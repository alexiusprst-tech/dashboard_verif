export type TimelineStatus =
    | 'draft'
    | 'submitted'
    | 'in_review'
    | 'revision_requested'
    | 'revision_uploaded'
    | 'approved'
    | 'rejected'
    | 'berita_acara_generated';

export interface TimelineItem {
    id: string | number;
    status: TimelineStatus | string;
    status_label: string;
    icon_status: string;
    color: 'blue' | 'amber' | 'green' | 'red' | 'indigo' | 'purple' | string;
    actor_name: string;
    actor_role?: string;
    description: string;
    date: string;
    time: string;
    created_at?: string;
}

export interface RevisionHistoryItem {
    id: number;
    revision: number;
    status: string;
    status_label?: string;
    notes: string;
    version: string;
    file_soal?: string | null;
    verifier_name: string;
    created_at: string;
}
