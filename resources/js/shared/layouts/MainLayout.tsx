import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '@/shared/hooks/useAuth';

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
 */
export function MainLayout() {
    const { isAuthenticated } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Guard: redirect ke login jika belum login
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
                    notificationCount={0} /* TODO: ganti dengan data dari TanStack Query */
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
