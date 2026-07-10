import { cn } from '@/shared/lib/utils';

/* ── Types ─────────────────────────────────────────────────── */

export type SoalStatus =
    | 'draft'
    | 'submitted'
    | 'in_review'
    | 'approved'
    | 'revisi'
    | 'rejected';

interface StatusConfig {
    label: string;
    className: string;
}

/* ── Config Map ─────────────────────────────────────────────── */

const STATUS_CONFIG: Record<SoalStatus, StatusConfig> = {
    draft: {
        label: 'Draft',
        className: 'bg-[var(--color-gray-100)] text-[var(--color-gray-600)] border-[var(--color-gray-300)]',
    },
    submitted: {
        label: 'Submitted',
        className: 'bg-[var(--color-info-light)] text-[var(--color-info)] border-[var(--color-info)]',
    },
    in_review: {
        label: 'Dalam Review',
        className: 'bg-[var(--color-info-light)] text-[var(--color-info)] border-[var(--color-info)]',
    },
    approved: {
        label: 'Disetujui',
        className: 'bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)]',
    },
    revisi: {
        label: 'Perlu Revisi',
        className: 'bg-[var(--color-warning-light)] text-[var(--color-warning)] border-[var(--color-warning)]',
    },
    rejected: {
        label: 'Ditolak',
        className: 'bg-[var(--color-danger-light)] text-[var(--color-danger)] border-[var(--color-danger)]',
    },
};

/* ── Component ──────────────────────────────────────────────── */

interface StatusBadgeProps {
    status: SoalStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                config.className,
                className,
            )}
        >
            {config.label}
        </span>
    );
}
