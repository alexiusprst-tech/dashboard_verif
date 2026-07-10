import { cn } from '@/shared/lib/utils';

/* ── Skeleton variants ──────────────────────────────────────── */

interface SkeletonProps {
    className?: string;
}

/** Blok skeleton generik */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-gray-200',
                className,
            )}
            aria-hidden="true"
        />
    );
}

/** Skeleton untuk satu baris tabel (N kolom) */
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
    return (
        <tr className="border-b border-gray-100">
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}

/** Skeleton untuk tabel lengkap */
export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonTableRow key={i} cols={cols} />
            ))}
        </>
    );
}

/** Skeleton untuk card */
export function SkeletonCard() {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <Skeleton className="mb-3 h-4 w-1/3" />
            <Skeleton className="mb-2 h-8 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
        </div>
    );
}

/** Skeleton untuk stat cards (grid 4 kolom) */
export function SkeletonStatCards({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
