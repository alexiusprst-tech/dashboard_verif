import { FileX, SearchX, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/* ── Types ─────────────────────────────────────────────────── */

interface EmptyStateProps {
    icon?: LucideIcon;
    title?: string;
    description?: string;
    action?: ReactNode;
    /** Jika true: mode search-empty (icon lain + pesan berbeda) */
    isSearchEmpty?: boolean;
}

/* ── Component ──────────────────────────────────────────────── */

/**
 * EmptyState — Ilustrasi kosong yang ditampilkan saat tidak ada data.
 *
 * Dua mode:
 * - Default: belum ada data sama sekali (FileX icon)
 * - Search empty: hasil pencarian kosong (SearchX icon)
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    isSearchEmpty = false,
}: EmptyStateProps) {
    const Icon = icon ?? (isSearchEmpty ? SearchX : FileX);

    const defaultTitle = isSearchEmpty
        ? 'Tidak ada hasil ditemukan'
        : 'Belum ada data';

    const defaultDesc = isSearchEmpty
        ? 'Coba ubah kata kunci atau filter pencarian Anda.'
        : 'Data akan muncul di sini setelah ditambahkan.';

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            {/* Illustrated icon container */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <Icon
                    size={36}
                    strokeWidth={1.25}
                    className="text-gray-400"
                />
            </div>

            <div className="max-w-xs">
                <p className="text-base font-semibold text-gray-700">
                    {title ?? defaultTitle}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                    {description ?? defaultDesc}
                </p>
            </div>

            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
