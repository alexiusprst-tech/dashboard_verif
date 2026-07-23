import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth, type AuthUser } from '@/shared/hooks/useAuth';
import api from '@/shared/lib/api';

/**
 * MainLayout — wrapper untuk semua halaman yang membutuhkan autentikasi.
 *
 * Struktur:
 *   ┌────────────┬────────────────────────────────────┐
 *   │  Sidebar   │  Topbar                            │
 *   │  (fixed)   ├────────────────────────────────────┤
 *   │            │  <Outlet /> — konten halaman        │
 *   └────────────┴────────────────────────────────────┘
 *
 * - Redirect ke /login jika belum autentikasi
 * - Sidebar collapsible di desktop, drawer di mobile
 * - Topbar sticky di atas area konten
 * - Sync data user dari /auth/me saat pertama load (agar is_pic_active fresh)
 */
export function MainLayout() {
    const { isAuthenticated, updateUser } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fetch unread notification count — harus dipanggil SEBELUM early return
    // agar urutan hooks selalu konsisten (Rules of Hooks).
    // enabled: false saat belum login supaya tidak trigger request.
    const { data: notifData } = useQuery({
        queryKey: ['notifikasi-unread-count'],
        queryFn: async () => {
            const res = await api.get('/notifikasi', { params: { unread: 1, per_page: 1 } });
            return (res.data.unread_count as number) ?? 0;
        },
        enabled: isAuthenticated,
        refetchInterval: 60_000,
        staleTime: 30_000,
    });

    // Sync data user dari server saat pertama load.
    // Ini memastikan is_pic_active selalu up-to-date (mis. setelah super admin
    // assign role PIC tanpa user perlu logout-login ulang).
    useEffect(() => {
        if (!isAuthenticated) return;

        api.get('/auth/me')
            .then((res) => {
                const userData = res.data?.data as AuthUser | undefined;
                if (userData) {
                    updateUser(userData);
                }
            })
            .catch(() => {
                // Abaikan error — user tetap bisa pakai data dari localStorage
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Hanya saat pertama mount

    // Guard: redirect ke login jika belum autentikasi
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[var(--color-gray-50)]">
            {/* ── Sidebar ── */}
            <Sidebar
                mobileOpen={mobileMenuOpen}
                onMobileClose={() => setMobileMenuOpen(false)}
            />

            {/* ── Main Area ── */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <Topbar
                    onMobileMenuToggle={() => setMobileMenuOpen(true)}
                    notificationCount={notifData ?? 0}
                />

                {/* Page Content */}
                <main
                    id="main-content"
                    className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
