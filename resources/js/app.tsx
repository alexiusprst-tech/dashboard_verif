import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/shared/hooks/useAuth';
import { router } from '@/app/router';
import '../css/app.css';

/* ── TanStack Query Client ──────────────────────────────────── */
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 menit
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

/* ── Mount ──────────────────────────────────────────────────── */
const rootElement = document.getElementById('app');

if (!rootElement) {
    throw new Error(
        '[app.tsx] Root element #app not found. Pastikan resources/views/app.blade.php memiliki <div id="app"></div>.',
    );
}

createRoot(rootElement).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </QueryClientProvider>
    </StrictMode>,
);
