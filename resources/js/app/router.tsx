import { createBrowserRouter, Navigate } from 'react-router-dom';

import { MainLayout } from '@/shared/layouts/MainLayout';
import { RouteErrorBoundary } from '@/shared/components/ui/ErrorBoundary';

import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

import { PloCloPage } from '@/features/plo-clo/PloCloPage';
import { PloDetailPage } from '@/features/plo-clo/PloDetailPage';
import { SoalPage } from '@/features/soal/SoalPage';
import { VerifikasiPage } from '@/features/verifikasi/VerifikasiPage';
import { BeritaAcaraPage } from '@/features/berita-acara/BeritaAcaraPage';
import { PenugasanPicPage } from '@/features/penugasan-pic/PenugasanPicPage';
import { PenugasanKoordinatorPage } from '@/features/penugasan-koordinator/PenugasanKoordinatorPage';
import { PeriodePage } from '@/features/periode/PeriodePage';
import { KategoriPage } from '@/features/kategori/KategoriPage';
import { TemplateBaPage } from '@/features/berita-acara/TemplateBaPage';
import { MonitoringPage } from '@/features/monitoring/MonitoringPage';
import { DosenPage } from '@/features/dosen/DosenPage';
import { MatkulPage } from '@/features/matkul/MatkulPage';
import { MatkulDetailPage } from '@/features/matkul/MatkulDetailPage';
import { KelolaCloPage } from '@/features/matkul/KelolaCloPage';

/**
 * Router aplikasi Sistem Verifikasi Soal.
 *
 * Struktur route:
 * - /login                 → halaman login (public)
 * - /                      → redirect ke /dashboard
 * - /dashboard             → dashboard (protected, MainLayout)
 * - ... (tambahkan fitur lain di sini)
 *
 * Route guard (autentikasi) dihandle di MainLayout:
 * jika belum login → redirect ke /login.
 *
 * Route guard per-role (mis. hanya Super Admin yang boleh ke /penugasan-pic)
 * akan ditambahkan sebagai wrapper component per route saat fitur dibangun.
 */
export const router = createBrowserRouter([
    /* ── Public Routes ──────────────────────────────────────── */
    {
        path: '/login',
        element: <LoginPage />,
        errorElement: <RouteErrorBoundary />,
    },

    /* ── Protected Routes (MainLayout sebagai guard) ─────────── */
    {
        path: '/',
        element: <MainLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />,
            },

            {
                path: 'dashboard',
                element: <DashboardPage />,
            },

            {
                path: 'plo-clo',
                element: <PloCloPage />,
            },

            {
                path: 'plo/:id',
                element: <PloDetailPage />,
            },

            {
                path: 'soal',
                element: <SoalPage />,
            },

            {
                path: 'soal/semua',
                element: <SoalPage />,
            },

            {
                path: 'verifikasi',
                element: <VerifikasiPage />,
            },

            {
                path: 'berita-acara',
                element: <BeritaAcaraPage />,
            },

            {
                path: 'penugasan-koordinator',
                element: <PenugasanKoordinatorPage />,
            },

            {
                path: 'penugasan-verifikator',
                element: <PenugasanPicPage />,
            },

            {
                path: 'penugasan-pic',
                element: <Navigate to="/penugasan-verifikator" replace />,
            },

            {
                path: 'periode',
                element: <PeriodePage />,
            },

            {
                path: 'kategori',
                element: <KategoriPage />,
            },

            {
                path: 'template-ba',
                element: <TemplateBaPage />,
            },

            {
                path: 'monitoring',
                element: <MonitoringPage />,
            },

            {
                path: 'dosen',
                element: <DosenPage />,
            },

            {
                path: 'matkul',
                element: <MatkulPage />,
            },

            {
                path: 'matkul/:id',
                element: <MatkulDetailPage />,
            },

            {
                path: 'matkul/:id/kelola-clo',
                element: <KelolaCloPage />,
            },
        ],
    },

    /* ── 404 Fallback ────────────────────────────────────────── */
    {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
    },
]);
