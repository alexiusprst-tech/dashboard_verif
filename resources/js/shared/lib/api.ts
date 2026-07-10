import axios from 'axios';

/**
 * Axios instance terpusat untuk semua request API.
 *
 * - Base URL: /api (relative, mengikuti domain Laravel)
 * - Header Accept: application/json
 * - Header Authorization: Bearer {token} dari localStorage
 * - Interceptor 401: hapus token dan reload ke /login
 */
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    withCredentials: true,
});

/* ── Request Interceptor: inject token ─────────────────────── */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/* ── Response Interceptor: handle 401 ──────────────────────── */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);

export default api;
