import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/* ── Types ─────────────────────────────────────────────────── */

interface FilterBarProps {
    children: ReactNode;
    onReset?: () => void;
    className?: string;
}

/* ── Component ──────────────────────────────────────────────── */

/**
 * FilterBar — Container row untuk filter + search + reset.
 *
 * Tempatkan SearchBar, dropdown filter, dan komponen lain sebagai children.
 * Tombol "Reset Filter" muncul otomatis jika prop onReset diberikan.
 */
export function FilterBar({ children, onReset, className }: FilterBarProps) {
    return (
        <div
            className={cn(
                'mb-4 flex flex-wrap items-center gap-2',
                className,
            )}
        >
            {children}
            {onReset && (
                <button
                    onClick={onReset}
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-800"
                >
                    <RotateCcw size={13} />
                    Reset Filter
                </button>
            )}
        </div>
    );
}

/* ── FilterSelect ───────────────────────────────────────────── */

interface FilterSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
    placeholder?: string;
    className?: string;
}

/**
 * FilterSelect — Dropdown filter sederhana dengan placeholder.
 */
export function FilterSelect({
    value,
    onChange,
    options,
    placeholder = 'Semua',
    className,
}: FilterSelectProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
                'h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700',
                'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]',
                className,
            )}
        >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
