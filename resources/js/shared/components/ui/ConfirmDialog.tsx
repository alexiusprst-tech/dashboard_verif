import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

/* ── Types ─────────────────────────────────────────────────── */

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmLabel?: string;
    loading?: boolean;
}

/* ── Component ──────────────────────────────────────────────── */

/**
 * ConfirmDialog — Dialog konfirmasi sebelum aksi destruktif (hapus).
 *
 * Menampilkan ikon warning, pesan, dan dua tombol: Batal + Hapus (merah).
 */
export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Konfirmasi Hapus',
    message = 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
    confirmLabel = 'Hapus',
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title=""
            size="sm"
            footer={
                <>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-danger)] px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <Trash2 size={14} />
                        )}
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <div className="flex flex-col items-center gap-4 py-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger-light)]">
                    <AlertTriangle size={28} className="text-[var(--color-danger)]" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-[var(--color-secondary)]">{title}</h3>
                    <p className="mt-1.5 text-sm text-gray-500">{message}</p>
                </div>
            </div>
        </Modal>
    );
}
