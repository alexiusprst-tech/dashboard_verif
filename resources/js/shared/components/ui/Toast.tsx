import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToast, type ToastItem } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';

/* ── Config per type ────────────────────────────────────────── */

const CONFIG = {
    success: {
        icon: CheckCircle,
        classes: 'bg-[var(--color-success-light)] border-[var(--color-success)] text-[var(--color-success)]',
        iconClass: 'text-[var(--color-success)]',
    },
    error: {
        icon: XCircle,
        classes: 'bg-[var(--color-danger-light)] border-[var(--color-danger)] text-[var(--color-danger)]',
        iconClass: 'text-[var(--color-danger)]',
    },
    info: {
        icon: Info,
        classes: 'bg-[var(--color-info-light)] border-[var(--color-info)] text-[var(--color-info)]',
        iconClass: 'text-[var(--color-info)]',
    },
    warning: {
        icon: AlertTriangle,
        classes: 'bg-[var(--color-warning-light)] border-[var(--color-warning)] text-[var(--color-warning)]',
        iconClass: 'text-[var(--color-warning)]',
    },
} as const;

/* ── Single Toast Item ──────────────────────────────────────── */

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
    const cfg = CONFIG[item.type];
    const Icon = cfg.icon;

    return (
        <div
            className={cn(
                'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg',
                'w-80 max-w-[calc(100vw-2rem)]',
                'animate-in slide-in-from-right-4 duration-300',
                cfg.classes,
            )}
            role="alert"
            aria-live="assertive"
        >
            <Icon size={18} className={cn('mt-0.5 flex-shrink-0', cfg.iconClass)} />
            <p className="flex-1 text-sm font-medium leading-snug">{item.message}</p>
            <button
                onClick={onDismiss}
                className="flex-shrink-0 opacity-60 transition hover:opacity-100"
                aria-label="Tutup notifikasi"
            >
                <X size={15} />
            </button>
        </div>
    );
}

/* ── Toast Container ────────────────────────────────────────── */

export function ToastContainer() {
    const { toasts, dismiss } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div
            aria-label="Notifikasi"
            className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2"
        >
            {toasts.map((t) => (
                <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
            ))}
        </div>
    );
}
