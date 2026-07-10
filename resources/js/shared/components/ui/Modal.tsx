import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/* ── Types ─────────────────────────────────────────────────── */

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
};

/* ── Component ──────────────────────────────────────────────── */

/**
 * Modal — Dialog overlay dengan backdrop, accessible, trap focus.
 *
 * Props:
 * - open: kontrol visibility
 * - onClose: callback ketika backdrop/X diklik
 * - title: judul modal (ditampilkan di header)
 * - footer: opsional slot untuk tombol aksi
 * - size: lebar modal (default: 'md')
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    // Lock body scroll
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                ref={dialogRef}
                className={cn(
                    'relative z-10 w-full rounded-2xl bg-white shadow-2xl',
                    'flex flex-col max-h-[90vh]',
                    SIZE_CLASSES[size],
                )}
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                        <h2
                            id="modal-title"
                            className="text-base font-semibold text-[var(--color-secondary)]"
                        >
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-0.5 text-xs text-gray-500">{description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                        aria-label="Tutup modal"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
