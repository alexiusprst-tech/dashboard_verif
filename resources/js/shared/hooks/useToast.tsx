import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from 'react';

/* ── Types ─────────────────────────────────────────────────── */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextValue {
    toasts: ToastItem[];
    toast: {
        success: (message: string) => void;
        error: (message: string) => void;
        info: (message: string) => void;
        warning: (message: string) => void;
    };
    dismiss: (id: string) => void;
}

/* ── Context ───────────────────────────────────────────────── */

const ToastContext = createContext<ToastContextValue | null>(null);

/* ── Provider ──────────────────────────────────────────────── */

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { id, type, message }]);

        // Auto-dismiss setelah 3.5 detik
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (message: string) => addToast('success', message),
        error:   (message: string) => addToast('error', message),
        info:    (message: string) => addToast('info', message),
        warning: (message: string) => addToast('warning', message),
    };

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss }}>
            {children}
        </ToastContext.Provider>
    );
}

/* ── Hook ──────────────────────────────────────────────────── */

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}
