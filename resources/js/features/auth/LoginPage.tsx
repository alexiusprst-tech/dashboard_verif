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
        <div className="relative hidden min-h-screen overflow-hidden lg:flex">

            {/* Background Image */}
            <img
                src="/images/gedung telkom.jpg"
                alt="Telkom University"
                className="
                    absolute inset-0
                    h-full
                    w-full
                    object-cover
                "
            />

            {/* Maroon Overlay */}
            <div className="absolute inset-0 bg-[var(--color-primary)]/20" />

            {/* Gradient */}
            <div
                className="
                    absolute inset-0
                    bg-gradient-to-br
                    from-[var(--color-primary)]/25
                    via-[var(--color-primary)]/10
                    to-transparent
                "
            />

            {/* Vignette */}
            <div
                className="
                    absolute inset-0
                    bg-gradient-to-r
                    from-black/30
                    via-transparent
                    to-black/10
                "
            />

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-5">
                <svg
                    width="100%"
                    height="100%"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern
                            id="grid-pattern"
                            width="40"
                            height="40"
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d="M40 0L0 0 0 40"
                                fill="none"
                                stroke="white"
                                strokeWidth="0.5"
                            />
                        </pattern>
                    </defs>

                    <rect
                        width="100%"
                        height="100%"
                        fill="url(#grid-pattern)"
                    />
                </svg>
            </div>

            {/* Blur Decorations */}
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

            {/* Content */}
            <div className="relative z-10 flex h-full w-full flex-col justify-center px-16 text-white">

                {/* Icon */}
                <div className="
                    mb-8
                    flex h-20 w-20 items-center justify-center
                    rounded-3xl
                    bg-white/20
                    border border-white/20
                    backdrop-blur-xl
                    shadow-2xl
                ">
                    <GraduationCap size={42} />
                </div>

                {/* Title */}
                <h2
                    style={{ color: "#fff" }}
                    className="
                        max-w-lg
                        text-5xl
                        font-bold
                        leading-tight
                        drop-shadow-[0_6px_24px_rgba(0,0,0,.45)]
                    "
                >
                    Sistem Verifikasi
                    <br />
                    Soal Ujian
                </h2>

                {/* Description */}
                <p
                    className="
                        mt-6
                        max-w-xl
                        text-lg
                        leading-8
                        text-white/90
                        drop-shadow
                    "
                >
                    Platform digital untuk mengelola, memverifikasi,
                    dan mendokumentasikan soal ujian secara aman,
                    cepat, dan terintegrasi di lingkungan
                    Telkom University.
                </p>

                {/* Feature Cards */}
                <div className="mt-12 space-y-5">

                    <div className="
                        flex items-center gap-4
                        rounded-2xl
                        bg-white/15
                        border border-white/10
                        backdrop-blur-md
                        shadow-xl
                        px-5 py-4
                    ">
                        <FileText size={22} />
                        <span>Upload & Kelola Soal per Semester</span>
                    </div>

                    <div className="
                        flex items-center gap-4
                        rounded-2xl
                        bg-white/15
                        border border-white/10
                        backdrop-blur-md
                        shadow-xl
                        px-5 py-4
                    ">
                        <CheckCircle size={22} />
                        <span>Verifikasi Soal oleh PIC Terverifikasi</span>
                    </div>

                    <div className="
                        flex items-center gap-4
                        rounded-2xl
                        bg-white/15
                        border border-white/10
                        backdrop-blur-md
                        shadow-xl
                        px-5 py-4
                    ">
                        <BookOpen size={22} />
                        <span>Berita Acara Otomatis & Monitoring</span>
                    </div>

                </div>

                <p className="mt-16 text-sm text-white/70">
                    © Telkom University • Sistem Internal
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
    <div className="min-h-screen bg-gray-100 lg:grid lg:grid-cols-[530px_1fr]">

        {/* LEFT */}
        <div className="flex items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-14">

            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl lg:shadow-none">

                {/* Logo & Title */}
                <div className="mb-10">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]">
                            <GraduationCap size={22} className="text-white" />
                        </div>

                        <span className="text-sm font-semibold tracking-wide text-gray-400">
                            TELKOM UNIVERSITY
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold text-[var(--color-secondary)] whitespace-nowrap">
                        Selamat datang kembali!
                    </h1>

                    <p className="mt-1.5 text-sm text-gray-500">
                        Masuk ke Sistem Verifikasi Soal dengan akun dosen Anda.
                    </p>
                </div>

                {/* Error */}
                {errorMessage && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                        <AlertCircle
                            size={16}
                            className="mt-0.5 flex-shrink-0"
                        />
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Form */}
                <form
                    id="login-form"
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-5"
                >

                    {/* Email */}
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
                            />

                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@telkomuniversity.ac.id"
                                disabled={isPending}
                                className={cn(
                                    "w-full rounded-lg border py-2.5 pl-9 pr-4 text-sm",
                                    "border-gray-200",
                                    "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
                                    isError && "border-red-400"
                                )}
                            />
                        </div>
                    </div>

                    {/* Password */}
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
                            />

                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={isPending}
                                className={cn(
                                    "w-full rounded-lg border py-2.5 pl-9 pr-11 text-sm",
                                    "border-gray-200",
                                    "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
                                    isError && "border-red-400"
                                )}
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Button */}
                    <button
                        type="submit"
                        disabled={isPending || !email.trim() || !password}
                        className={cn(
                            "w-full rounded-lg bg-[var(--color-primary)] py-3 text-sm font-semibold text-white",
                            "hover:bg-[var(--color-primary-dark)]",
                            "disabled:opacity-60"
                        )}
                    >
                        {isPending ? "Memproses..." : "Masuk"}
                    </button>

                </form>

                {/* Footer */}
                <p className="mt-8 text-center text-xs text-gray-400">
                    Sistem Verifikasi Soal &mdash; Telkom University
                </p>

            </div>

        </div>

        {/* RIGHT */}
        <DecorativePanel />

    </div>
    );
}
