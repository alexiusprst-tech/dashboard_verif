import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/* ── Types ─────────────────────────────────────────────────── */

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface PaginationProps {
    meta: PaginationMeta;
    onPageChange: (page: number) => void;
    onPerPageChange: (perPage: number) => void;
    perPageOptions?: number[];
}

/* ── Component ──────────────────────────────────────────────── */

/**
 * Pagination — Kontrol halaman + per-page selector.
 *
 * Menampilkan:
 * - "Menampilkan X–Y dari Z data"
 * - Dropdown per page: 10 / 25 / 50 / 100
 * - Tombol Prev / halaman / Next
 */
export function Pagination({
    meta,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
}: PaginationProps) {
    const { current_page, last_page, per_page, total, from, to } = meta;

    /* Buat array halaman yang ditampilkan (max 5 halaman sekitar current) */
    const pages: (number | '...')[] = [];
    if (last_page <= 7) {
        for (let i = 1; i <= last_page; i++) pages.push(i);
    } else {
        pages.push(1);
        if (current_page > 3) pages.push('...');
        const start = Math.max(2, current_page - 1);
        const end = Math.min(last_page - 1, current_page + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (current_page < last_page - 2) pages.push('...');
        pages.push(last_page);
    }

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 py-2">
            {/* Info + per-page */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>
                    {from && to
                        ? `Menampilkan ${from}–${to} dari ${total} data`
                        : `Total ${total} data`}
                </span>
                <label className="flex items-center gap-1.5">
                    <span className="text-xs">Tampilkan</span>
                    <select
                        value={per_page}
                        onChange={(e) => onPerPageChange(Number(e.target.value))}
                        className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        {perPageOptions.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </label>
            </div>

            {/* Page buttons */}
            {last_page > 1 && (
                <div className="flex items-center gap-1">
                    <PageBtn
                        onClick={() => onPageChange(current_page - 1)}
                        disabled={current_page === 1}
                        aria-label="Halaman sebelumnya"
                    >
                        <ChevronLeft size={14} />
                    </PageBtn>

                    {pages.map((p, i) =>
                        p === '...' ? (
                            <span key={`ellipsis-${i}`} className="px-1.5 text-gray-400 text-sm">
                                …
                            </span>
                        ) : (
                            <PageBtn
                                key={p}
                                onClick={() => onPageChange(p as number)}
                                active={p === current_page}
                            >
                                {p}
                            </PageBtn>
                        ),
                    )}

                    <PageBtn
                        onClick={() => onPageChange(current_page + 1)}
                        disabled={current_page === last_page}
                        aria-label="Halaman berikutnya"
                    >
                        <ChevronRight size={14} />
                    </PageBtn>
                </div>
            )}
        </div>
    );
}

/* ── Helper: page button ────────────────────────────────────── */

function PageBtn({
    children,
    onClick,
    active,
    disabled,
    'aria-label': ariaLabel,
}: {
    children: React.ReactNode;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    'aria-label'?: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                active
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50',
            )}
        >
            {children}
        </button>
    );
}
