import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility untuk menggabungkan Tailwind class names secara aman.
 * Menggabungkan clsx (conditional classes) + tailwind-merge (deduplicate conflicts).
 *
 * @example cn('px-4 py-2', isActive && 'bg-primary', 'py-3') → 'px-4 bg-primary py-3'
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/**
 * Format tanggal ke format lokal Indonesia.
 * @example formatDate('2025-01-15') → '15 Januari 2025'
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Ambil inisial nama untuk avatar.
 * @example getInitials('Budi Santoso') → 'BS'
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
}

/**
 * Truncate string jika melebihi maxLength.
 * @example truncate('Soal Kalkulus Bab 3', 15) → 'Soal Kalkulus B...'
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
}
