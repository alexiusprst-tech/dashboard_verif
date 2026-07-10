import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Bell,
    Menu,
    LogOut,
    ChevronDown,
    CheckCheck,
    Info,
    AlertTriangle,
    CalendarClock,
    ShieldCheck,
    Megaphone,
    X,
} from 'lucide-react';
import { cn, getInitials, formatDate } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';
import api from '@/shared/lib/api';

/* ── Types ─────────────────────────────────────────────────── */

interface Notifikasi {
    id: number;
    judul: string;
    pesan: string;
    tipe: 'info' | 'warning' | 'deadline' | 'verifikasi' | 'broadcast';
    tipe_label: string;
    is_read: boolean;
    reference_type: string | null;
    reference_id: number | null;
    created_at: string;
}

/* ── Breadcrumb helper ──────────────────────────────────────── */

const ROUTE_LABELS: Record<string, string> = {
    '/dashboard':     'Dashboard',
    '/plo-clo':       'PLO & CLO',
    '/soal':          'Soal Saya',
    '/soal/semua':    'Semua Soal',
    '/verifikasi':    'Verifikasi Soal',
    '/berita-acara':  'Berita Acara',
    '/penugasan-pic': 'Penugasan PIC',
    '/periode':       'Periode & Deadline',
    '/kategori':      'Kategori & Template',
    '/broadcast':     'Broadcast',
    '/monitoring':    'Monitoring Prodi',
};

function Breadcrumb() {
    const { pathname } = useLocation();
    const label = ROUTE_LABELS[pathname] ?? 'Halaman';

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <span className="text-gray-400">Beranda</span>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-[var(--color-secondary)]">{label}</span>
        </nav>
    );
}

/* ── Notification type icon ─────────────────────────────────── */

function NotifIcon({ tipe }: { tipe: Notifikasi['tipe'] }) {
    const map = {
        info:       { icon: <Info size={14} />, color: 'text-blue-500', bg: 'bg-blue-50' },
        warning:    { icon: <AlertTriangle size={14} />, color: 'text-amber-500', bg: 'bg-amber-50' },
        deadline:   { icon: <CalendarClock size={14} />, color: 'text-red-500', bg: 'bg-red-50' },
        verifikasi: { icon: <ShieldCheck size={14} />, color: 'text-green-600', bg: 'bg-green-50' },
        broadcast:  { icon: <Megaphone size={14} />, color: 'text-purple-600', bg: 'bg-purple-50' },
    };
    const cfg = map[tipe] ?? map.info;
    return (
        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
            <span className={cfg.color}>{cfg.icon}</span>
        </div>
    );
}

/* ── Notification Panel ─────────────────────────────────────── */

function NotificationPanel({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const qc = useQueryClient();
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handler(e: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, onClose]);

    const { data, isLoading } = useQuery({
        queryKey: ['notifikasi-panel'],
        queryFn: async () => {
            const res = await api.get('/notifikasi', { params: { per_page: 20 } });
            return {
                items: res.data.data as Notifikasi[],
                unread_count: res.data.unread_count as number,
            };
        },
        enabled: open,
        staleTime: 10_000,
    });

    const markOneMut = useMutation({
        mutationFn: (id: number) => api.patch(`/notifikasi/${id}/read`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifikasi-panel'] });
            qc.invalidateQueries({ queryKey: ['notifikasi-unread-count'] });
        },
    });

    const markAllMut = useMutation({
        mutationFn: () => api.patch('/notifikasi/read-all'),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifikasi-panel'] });
            qc.invalidateQueries({ queryKey: ['notifikasi-unread-count'] });
        },
    });

    if (!open) return null;

    const items = data?.items ?? [];
    const unreadCount = data?.unread_count ?? 0;

    return (
        <div
            ref={panelRef}
            className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-1rem)] rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                    <Bell size={16} className="text-[var(--color-primary)]" />
                    <h3 className="text-sm font-bold text-gray-800">Notifikasi</h3>
                    {unreadCount > 0 && (
                        <span className="rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={() => markAllMut.mutate()}
                            disabled={markAllMut.isPending}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition disabled:opacity-50"
                            title="Tandai semua dibaca"
                        >
                            <CheckCheck size={13} />
                            Baca semua
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="max-h-[420px] overflow-y-auto">
                {isLoading && (
                    <div className="space-y-1 p-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex gap-3 rounded-xl p-3">
                                <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100 flex-shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                                    <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                                    <div className="h-2 w-1/4 animate-pulse rounded bg-gray-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && items.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                            <Bell size={24} strokeWidth={1.25} className="text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">Belum ada notifikasi</p>
                            <p className="text-xs text-gray-400 mt-0.5">Notifikasi akan muncul di sini</p>
                        </div>
                    </div>
                )}

                {!isLoading && items.length > 0 && (
                    <div className="divide-y divide-gray-50 p-2 space-y-0.5">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (!item.is_read) {
                                        markOneMut.mutate(item.id);
                                    }
                                }}
                                className={cn(
                                    'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-gray-50',
                                    !item.is_read && 'bg-[var(--color-primary-light)]',
                                )}
                            >
                                <NotifIcon tipe={item.tipe} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn(
                                            'text-sm leading-tight',
                                            item.is_read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'
                                        )}>
                                            {item.judul}
                                        </p>
                                        {!item.is_read && (
                                            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                        {item.pesan}
                                    </p>
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        {formatDate(item.created_at)}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2.5">
                    <p className="text-center text-xs text-gray-400">
                        Menampilkan {items.length} notifikasi terbaru
                    </p>
                </div>
            )}
        </div>
    );
}

/* ── Topbar Props ───────────────────────────────────────────── */

interface TopbarProps {
    onMobileMenuToggle: () => void;
    notificationCount?: number;
}

/* ── Topbar Component ───────────────────────────────────────── */

export function Topbar({ onMobileMenuToggle, notificationCount = 0 }: TopbarProps) {
    const { user, logout } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    return (
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[var(--color-gray-200)] bg-white px-4 md:px-6">

            {/* ── Left: hamburger (mobile) + breadcrumb ── */}
            <div className="flex items-center gap-4">
                {/* Hamburger — mobile only */}
                <button
                    onClick={onMobileMenuToggle}
                    className="flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 md:hidden"
                    aria-label="Buka menu navigasi"
                >
                    <Menu size={20} />
                </button>

                <Breadcrumb />
            </div>

            {/* ── Right: notifications + user menu ── */}
            <div className="flex items-center gap-2">

                {/* ── Notification Bell + Panel ── */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setNotifOpen((v) => !v);
                            setUserMenuOpen(false);
                        }}
                        className={cn(
                            'relative flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-gray-100',
                            notifOpen && 'bg-gray-100 text-[var(--color-primary)]',
                        )}
                        aria-label={`${notificationCount} notifikasi belum dibaca`}
                    >
                        <Bell size={20} />
                        {notificationCount > 0 && (
                            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-0.5 text-[10px] font-bold text-white">
                                {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                        )}
                    </button>

                    <NotificationPanel
                        open={notifOpen}
                        onClose={() => setNotifOpen(false)}
                    />
                </div>

                {/* ── User Menu ── */}
                <div className="relative">
                    <button
                        onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-gray-100"
                        aria-expanded={userMenuOpen}
                        aria-haspopup="true"
                    >
                        {/* Avatar */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
                            {user ? getInitials(user.name) : '?'}
                        </div>
                        {/* Name — hidden on small screens */}
                        <div className="hidden text-left sm:block">
                            <p className="text-sm font-medium text-gray-800 leading-tight">
                                {user?.name ?? 'Pengguna'}
                            </p>
                            <p className="text-xs text-gray-400 leading-tight">
                                {user?.is_super_admin
                                    ? 'Super Admin'
                                    : user?.is_coordinator
                                        ? 'Koordinator'
                                        : 'Dosen'}
                                {user?.is_pic_active && (
                                    <span className="ml-1 rounded-sm bg-[var(--color-primary-light)] px-1 py-px text-[10px] font-semibold text-[var(--color-primary)]">
                                        PIC
                                    </span>
                                )}
                            </p>
                        </div>
                        <ChevronDown
                            size={14}
                            className={cn(
                                'text-gray-400 transition-transform',
                                userMenuOpen && 'rotate-180',
                            )}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {userMenuOpen && (
                        <>
                            {/* Invisible backdrop */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setUserMenuOpen(false)}
                                aria-hidden="true"
                            />
                            <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                                <button
                                    onClick={logout}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                                >
                                    <LogOut size={15} />
                                    Keluar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
