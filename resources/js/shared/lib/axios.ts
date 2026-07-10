import axios from 'axios';

/**
 * Axios instance terkonfigurasi untuk Sistem Verifikasi Soal.
 *
 * - Base URL: /api (Laravel Sanctum API)
 * - CSRF: otomatis dari cookie (Sanctum SPA mode)
 * - Auth token: Bearer token dari localStorage
 * - Request interceptor: inject token
 * - Response interceptor: handle 401 (token expired → redirect login)
 */
const api = axios.create({
    baseURL: '/api',
    withCredentials: true, // kirim cookie untuk Sanctum CSRF
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

/* ── Request Interceptor ───────────────────────────────────── */
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

/* ── Response Interceptor ──────────────────────────────────── */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired atau tidak valid — bersihkan auth & redirect
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);

export default api;
