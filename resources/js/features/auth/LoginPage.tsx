import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
    GraduationCap,
    Mail,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    BookOpen,
    CheckCircle,
    FileText,
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { useLogin } from './useLogin';
import { cn } from '@/shared/lib/utils';

/* ── Decorative background pattern ─────────────────────────── */

function DecorativePanel() {
    return (
        <div className="relative hidden h-full flex-col overflow-hidden bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] lg:flex">
            {/* Subtle geometric patterns */}
            <div className="absolute inset-0 opacity-10">
                <svg
                    width="100%"
                    height="100%"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                >
                    <defs>
                        <pattern
                            id="grid-pattern"
                            width="40"
                            height="40"
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d="M 40 0 L 0 0 0 40"
                                fill="none"
                                stroke="white"
                                strokeWidth="0.5"
                            />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                </svg>
            </div>

            {/* Large decorative circles */}
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white opacity-5" />
            <div className="absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-white opacity-5" />
            <div className="absolute right-12 bottom-32 h-40 w-40 rounded-full bg-white opacity-5" />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-12 py-16 text-white">

                {/* Icon cluster */}
                <div className="mb-10 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                        <GraduationCap size={32} className="text-white" />
                    </div>
                </div>

                <h2 className="mb-4 text-center text-3xl font-bold leading-snug">
                    Sistem Verifikasi<br />Soal Ujian
                </h2>
                <p className="mb-12 text-center text-sm leading-relaxed text-white/70">
                    Platform pengelolaan dan verifikasi soal ujian<br />
                    berbasis digital untuk civitas akademika.
                </p>

                {/* Feature highlights */}
                <div className="w-full max-w-xs space-y-4">
                    {[
                        { icon: FileText, text: 'Upload & kelola soal per semester' },
                        { icon: CheckCircle, text: 'Verifikasi soal oleh PIC terverifikasi' },
                        { icon: BookOpen, text: 'Dokumentasi Berita Acara otomatis' },
                    ].map(({ icon: Icon, text }) => (
                        <div
                            key={text}
                            className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
                        >
                            <Icon size={16} className="flex-shrink-0 text-white/80" />
                            <span className="text-sm text-white/90">{text}</span>
                        </div>
                    ))}
                </div>

                {/* Footer note */}
                <p className="mt-12 text-center text-xs text-white/40">
                    Telkom University — Sistem Internal
                </p>
            </div>
        </div>
    );
}

/* ── Login Form ─────────────────────────────────────────────── */

export function LoginPage() {
    const { isAuthenticated } = useAuth();
    const { mutate: loginMutate, isPending, error, isError } = useLogin();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Sudah login → langsung ke dashboard
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) return;
        loginMutate({ email: email.trim(), password });
    };

    const errorMessage =
        isError && error
            ? (error as { response?: { data?: { message?: string } } }).response?.data
                  ?.message ?? 'Email atau password salah. Silakan coba lagi.'
            : null;

    return (
        <div className="flex h-screen overflow-hidden bg-white">
            {/* ── Left: Form ── */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10 lg:flex-none lg:w-[480px] lg:px-14">
                <div className="w-full max-w-sm">

                    {/* Logo & Title */}
                    <div className="mb-10">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]">
                                <GraduationCap size={22} className="text-white" />
                            </div>
                            <span className="text-sm font-semibold text-gray-400 tracking-wide">
                                TELKOM UNIVERSITY
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
                            Selamat datang kembali
                        </h1>
                        <p className="mt-1.5 text-sm text-gray-500">
                            Masuk ke Sistem Verifikasi Soal dengan akun dosen Anda.
                        </p>
                    </div>

                    {/* Error Alert */}
                    {errorMessage && (
                        <div
                            role="alert"
                            className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                        >
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form id="login-form" onSubmit={handleSubmit} noValidate className="space-y-5">

                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="login-email"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Email
                            </label>
                            <div className="relative">
                                <Mail
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    aria-hidden="true"
                                />
                                <input
                                    id="login-email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nama@telkomuniversity.ac.id"
                                    disabled={isPending}
                                    className={cn(
                                        'w-full rounded-lg border py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400',
                                        'border-gray-200 bg-white transition',
                                        'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20',
                                        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
                                        isError && 'border-red-400',
                                    )}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="login-password"
                                className="mb-1.5 block text-sm font-medium text-gray-700"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    aria-hidden="true"
                                />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={isPending}
                                    className={cn(
                                        'w-full rounded-lg border py-2.5 pl-9 pr-11 text-sm text-gray-800',
                                        'border-gray-200 bg-white transition',
                                        'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20',
                                        'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400',
                                        isError && 'border-red-400',
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            id="login-submit-btn"
                            type="submit"
                            disabled={isPending || !email.trim() || !password}
                            className={cn(
                                'mt-2 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white',
                                'bg-[var(--color-primary)] transition-all duration-150',
                                'hover:bg-[var(--color-primary-dark)] active:scale-[0.99]',
                                'disabled:cursor-not-allowed disabled:opacity-60',
                                'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:ring-offset-2',
                            )}
                        >
                            {isPending ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Memproses...
                                </span>
                            ) : (
                                'Masuk'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="mt-8 text-center text-xs text-gray-400">
                        Sistem Verifikasi Soal &mdash; Telkom University
                    </p>
                </div>
            </div>

            {/* ── Right: Decorative Panel ── */}
            <DecorativePanel />
        </div>
    );
}
