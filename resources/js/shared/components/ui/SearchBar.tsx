import { useRef, useEffect, type ChangeEvent } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/* ── Types ─────────────────────────────────────────────────── */

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    debounceMs?: number;
}

/* ── Component ──────────────────────────────────────────────── */

/**
 * SearchBar — Input pencarian dengan debounce bawaan.
 *
 * - Debounce default 400ms (configurable via debounceMs)
 * - Tombol clear (X) muncul saat ada teks
 * - Auto-focus opsional
 */
export function SearchBar({
    value,
    onChange,
    placeholder = 'Cari...',
    className,
    debounceMs = 400,
}: SearchBarProps) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onChange(raw);
        }, debounceMs);
    };

    const handleClear = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        onChange('');
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <div className={cn('relative', className)}>
            <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
            />
            <input
                type="text"
                defaultValue={value}
                onChange={handleChange}
                placeholder={placeholder}
                className={cn(
                    'h-9 w-full rounded-lg border border-gray-200 bg-white',
                    'pl-9 pr-8 text-sm text-gray-800 placeholder-gray-400',
                    'transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]',
                )}
                aria-label={placeholder}
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition hover:text-gray-600"
                    aria-label="Hapus pencarian"
                    type="button"
                >
                    <X size={13} />
                </button>
            )}
        </div>
    );
}
