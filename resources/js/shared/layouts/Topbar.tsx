import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu, LogOut, ChevronDown } from 'lucide-react';
import { cn, getInitials } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';

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

/* ── Notification Bell ──────────────────────────────────────── */

interface TopbarProps {
    onMobileMenuToggle: () => void;
    notificationCount?: number;
}

/* ── Topbar Component ───────────────────────────────────────── */

export function Topbar({ onMobileMenuToggle, notificationCount = 0 }: TopbarProps) {
    const { user, logout } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);

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

                {/* Notification Bell */}
                <button
                    className="relative flex items-center justify-center rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
                    aria-label={`${notificationCount} notifikasi belum dibaca`}
                >
                    <Bell size={20} />
                    {notificationCount > 0 && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-primary)] px-0.5 text-[10px] font-bold text-white">
                            {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                    )}
                </button>

                {/* User Menu */}
                <div className="relative">
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
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
