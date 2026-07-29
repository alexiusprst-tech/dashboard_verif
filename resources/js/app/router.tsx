import { createBrowserRouter, Navigate } from 'react-router-dom';

import { MainLayout } from '@/shared/layouts/MainLayout';

import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

import { PloCloPage } from '@/features/plo-clo/PloCloPage';
import { SoalPage } from '@/features/soal/SoalPage';
import { VerifikasiPage } from '@/features/verifikasi/VerifikasiPage';
import { BeritaAcaraPage } from '@/features/berita-acara/BeritaAcaraPage';
import { PenugasanPicPage } from '@/features/penugasan-pic/PenugasanPicPage';
import { PeriodePage } from '@/features/periode/PeriodePage';
import { KategoriPage } from '@/features/kategori/KategoriPage';
import { BroadcastPage } from '@/features/broadcast/BroadcastPage';
import { TemplateBaPage } from '@/features/berita-acara/TemplateBaPage';
import { MonitoringPage } from '@/features/monitoring/MonitoringPage';

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
    },

    /* ── Protected Routes (MainLayout sebagai guard) ─────────── */
    {
        path: '/',
        element: <MainLayout />,
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
                path: 'penugasan-pic',
                element: <PenugasanPicPage />,
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
                path: 'broadcast',
                element: <BroadcastPage />,
            },

            {
                path: 'monitoring',
                element: <MonitoringPage />,
            },
        ],
    },

    /* ── 404 Fallback ────────────────────────────────────────── */
    {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
    },
]);
