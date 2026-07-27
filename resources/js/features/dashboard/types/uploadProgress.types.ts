export type UploadProgressStatus =
    | 'belum_upload'
    | 'draft'
    | 'submitted'
    | 'sedang_diverifikasi'
    | 'revisi'
    | 'approved'
    | 'rejected';

export interface CourseUploadProgress {
    course_id: number;
    course: string;
    kode_mk: string;
    status: UploadProgressStatus | string;
    status_label: string;
    progress: number;
    deadline: string;
    deadline_formatted?: string;
    days_remaining: number;
    is_critical_deadline: boolean;
    soal_id?: number | null;
}
