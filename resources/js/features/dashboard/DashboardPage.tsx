import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    FileText,
    CheckCircle2,
    Clock,
    AlertTriangle,
    TrendingUp,
    Users,
    BarChart3,
    ArrowRight,
    BookOpen,
    ShieldCheck,
    Megaphone,
    ChevronRight,
    CalendarClock,
    Activity,
    XCircle,
    Layers,
    Send,
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatDate } from '@/shared/lib/utils';
import api from '@/shared/lib/api';

/* ── Types ─────────────────────────────────────────────────── */

interface SoalStatusCounts {
    draft: number;
    submitted: number;
    in_review: number;
    approved: number;
    revisi: number;
    rejected: number;
}

interface DashboardPeriode {
    id: number;
    nama_periode: string;
    tanggal_mulai: string;
    tanggal_deadline: string;
    status: string;
}

interface SuperAdminData {
    periode: DashboardPeriode | null;
    soal_status_counts: SoalStatusCounts;
    progress: { total: number; verified: number; percentage: number } | null;
}

interface DosenData {
    periode: DashboardPeriode | null;
    soal_status_counts: SoalStatusCounts;
    deadline: { nama_periode: string; tanggal_deadline: string } | null;
}

interface PicData {
    periode: DashboardPeriode | null;
    summary: { total: number; pending: number; done: number };
}

interface CoordinatorData {
    periode: DashboardPeriode | null;
    progress_by_prodi: {
        prodi: string;
        total: number;
        approved: number;
        percentage: number;
    }[];
}

/* ── Stat Card ─────────────────────────────────────────────── */

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border?: string;
    to?: string;
    trend?: string;
}

function StatCard({ label, value, icon, color, bg, border = 'border-gray-200', to, trend }: StatCardProps) {
    const inner = (
        <div className={`group flex flex-col gap-3 rounded-2xl border ${border} bg-white px-5 py-5 shadow-sm transition hover:shadow-md ${to ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}>
            <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                    <span className={color}>{icon}</span>
                </div>
                {to && (
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition" />
                )}
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
                <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
            {trend && (
                <p className="text-xs text-gray-400">{trend}</p>
            )}
        </div>
    );

    if (to) {
        return <Link to={to}>{inner}</Link>;
    }
    return inner;
}

/* ── Progress Bar ─────────────────────────────────────────── */

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 truncate max-w-[180px]">{label}</span>
                <span className="text-gray-400 font-medium">{value}/{total} <span className="text-[var(--color-primary)] font-bold">({pct}%)</span></span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                    className="h-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] transition-all duration-700"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/* ── Periode Banner ─────────────────────────────────────────── */

function PeriodeBanner({ periode }: { periode: DashboardPeriode | null }) {
    if (!periode) {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-4">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 font-medium">Tidak ada periode aktif saat ini. Hubungi Super Admin untuk mengaktifkan periode.</p>
            </div>
        );
    }

    const deadline = new Date(periode.tanggal_deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = diffDays <= 7;

    return (
        <div className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${isUrgent ? 'border-red-200 bg-red-50' : 'border-[var(--color-primary-light)] bg-[var(--color-primary-light)]'}`}>
            <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isUrgent ? 'bg-red-100' : 'bg-[var(--color-primary)]/10'}`}>
                    <CalendarClock size={18} className={isUrgent ? 'text-red-600' : 'text-[var(--color-primary)]'} />
                </div>
                <div>
                    <p className={`text-sm font-bold ${isUrgent ? 'text-red-800' : 'text-[var(--color-secondary)]'}`}>
                        Periode Aktif: <span className="font-extrabold">{periode.nama_periode}</span>
                    </p>
                    <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-600' : 'text-[var(--color-primary)]'}`}>
                        Deadline: {formatDate(periode.tanggal_deadline)}
                        {diffDays > 0 ? ` — ${diffDays} hari lagi` : ' — Sudah lewat!'}
                    </p>
                </div>
            </div>
            {isUrgent && (
                <span className="animate-pulse rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">SEGERA!</span>
            )}
        </div>
    );
}

/* ── Status Donut Visual ────────────────────────────────────── */

function StatusSummaryGrid({ counts }: { counts: SoalStatusCounts }) {
    const items = [
        { label: 'Draft', value: counts.draft, icon: <FileText size={14} />, color: 'text-gray-500', bg: 'bg-gray-100' },
        { label: 'Dikirim', value: counts.submitted, icon: <Send size={14} />, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Dalam Review', value: counts.in_review, icon: <Activity size={14} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Disetujui', value: counts.approved, icon: <CheckCircle2 size={14} />, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Perlu Revisi', value: counts.revisi, icon: <AlertTriangle size={14} />, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Ditolak', value: counts.rejected, icon: <XCircle size={14} />, color: 'text-red-500', bg: 'bg-red-50' },
    ];

    return (
        <div className="grid grid-cols-3 gap-3">
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.bg} flex-shrink-0`}>
                        <span className={item.color}>{item.icon}</span>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900 leading-none">{item.value}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{item.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Quick Actions ─────────────────────────────────────────── */

interface QuickAction {
    label: string;
    desc: string;
    icon: React.ReactNode;
    to: string;
    color: string;
    bg: string;
}

function QuickActions({ actions }: { actions: QuickAction[] }) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Akses Cepat</h3>
            <div className="flex flex-col gap-2">
                {actions.map((a) => (
                    <Link
                        key={a.to}
                        to={a.to}
                        className="group flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-gray-50"
                    >
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${a.bg}`}>
                            <span className={a.color}>{a.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{a.label}</p>
                            <p className="text-xs text-gray-400 truncate">{a.desc}</p>
                        </div>
                        <ArrowRight size={14} className="text-gray-300 group-hover:text-[var(--color-primary)] transition flex-shrink-0" />
                    </Link>
                ))}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   Dashboard Views per Role
══════════════════════════════════════════════════════════════ */

/* ── Super Admin Dashboard ─────────────────────────────────── */

function SuperAdminDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', 'super-admin'],
        queryFn: async (): Promise<SuperAdminData> => {
            const res = await api.get('/dashboard/super-admin');
            return res.data.data;
        },
    });

    const counts = data?.soal_status_counts ?? { draft: 0, submitted: 0, in_review: 0, approved: 0, revisi: 0, rejected: 0 };
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const progress = data?.progress;

    return (
        <div className="flex flex-col gap-5">
            <PeriodeBanner periode={data?.periode ?? null} />

            {/* Top Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Soal" value={isLoading ? '…' : total} icon={<Layers size={18} />} color="text-[var(--color-primary)]" bg="bg-[var(--color-primary-light)]" to="/soal/semua" />
                <StatCard label="Disetujui" value={isLoading ? '…' : counts.approved} icon={<CheckCircle2 size={18} />} color="text-green-600" bg="bg-green-50" border="border-green-100" />
                <StatCard label="Menunggu Verifikasi" value={isLoading ? '…' : (counts.submitted + counts.in_review)} icon={<Clock size={18} />} color="text-indigo-600" bg="bg-indigo-50" to="/verifikasi" />
                <StatCard label="Perlu Revisi" value={isLoading ? '…' : counts.revisi} icon={<AlertTriangle size={18} />} color="text-amber-600" bg="bg-amber-50" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Status breakdown */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={16} className="text-[var(--color-primary)]" />
                            <h3 className="text-sm font-bold text-gray-700">Rekap Status Soal Periode Ini</h3>
                        </div>
                        {progress && (
                            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700">
                                {progress.percentage}% Terverifikasi
                            </span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-3 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
                            ))}
                        </div>
                    ) : (
                        <StatusSummaryGrid counts={counts} />
                    )}

                    {progress && (
                        <div className="mt-4">
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                                <span className="font-medium text-gray-600">Progress Verifikasi Keseluruhan</span>
                                <span className="font-bold text-[var(--color-primary)]">{progress.verified}/{progress.total} soal</span>
                            </div>
                            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className="h-3 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] transition-all duration-700"
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <QuickActions
                    actions={[
                        { label: 'Kelola Periode', desc: 'Buat & aktifkan periode baru', icon: <CalendarClock size={16} />, to: '/periode', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
                        { label: 'Penugasan PIC', desc: 'Assign verifikator ke dosen', icon: <Users size={16} />, to: '/penugasan-pic', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Kategori & Template', desc: 'Kelola template soal DOCX', icon: <BookOpen size={16} />, to: '/kategori', color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Broadcast', desc: 'Kirim pengumuman ke dosen', icon: <Megaphone size={16} />, to: '/broadcast', color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Monitoring', desc: 'Pantau progres verifikasi', icon: <TrendingUp size={16} />, to: '/monitoring', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    ]}
                />
            </div>
        </div>
    );
}

/* ── Dosen Dashboard ────────────────────────────────────────── */

function DosenDashboard() {
    const { user } = useAuth();
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', 'dosen'],
        queryFn: async (): Promise<DosenData> => {
            const res = await api.get('/dashboard/dosen');
            return res.data.data;
        },
    });

    const counts = data?.soal_status_counts ?? { draft: 0, submitted: 0, in_review: 0, approved: 0, revisi: 0, rejected: 0 };
    const totalSubmitted = counts.submitted + counts.in_review + counts.approved + counts.revisi + counts.rejected;

    return (
        <div className="flex flex-col gap-5">
            <PeriodeBanner periode={data?.periode ?? null} />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Soal Saya" value={isLoading ? '…' : Object.values(counts).reduce((a, b) => a + b, 0)} icon={<FileText size={18} />} color="text-[var(--color-primary)]" bg="bg-[var(--color-primary-light)]" to="/soal" />
                <StatCard label="Disetujui" value={isLoading ? '…' : counts.approved} icon={<CheckCircle2 size={18} />} color="text-green-600" bg="bg-green-50" border="border-green-100" />
                <StatCard label="Dalam Review" value={isLoading ? '…' : counts.in_review} icon={<Activity size={18} />} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard label="Perlu Revisi" value={isLoading ? '…' : counts.revisi} icon={<AlertTriangle size={18} />} color="text-amber-600" bg="bg-amber-50" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Status breakdown */}
                <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={16} className="text-[var(--color-primary)]" />
                            <h3 className="text-sm font-bold text-gray-700">Status Soal Saya</h3>
                        </div>
                        {totalSubmitted > 0 && (
                            <span className="text-xs text-gray-400">{totalSubmitted} soal dikirim</span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-3 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
                            ))}
                        </div>
                    ) : (
                        <StatusSummaryGrid counts={counts} />
                    )}

                    {/* Deadline reminder */}
                    {data?.deadline && (
                        <div className="mt-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                            <CalendarClock size={15} className="text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                                <span className="font-bold">Deadline: </span>
                                {formatDate(data.deadline.tanggal_deadline)} — {data.deadline.nama_periode}
                            </p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <QuickActions
                    actions={[
                        { label: 'Upload Soal', desc: 'Kirim soal baru ke sistem', icon: <FileText size={16} />, to: '/soal', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
                        { label: 'Lihat PLO & CLO', desc: 'Referensi capaian pembelajaran', icon: <BookOpen size={16} />, to: '/plo-clo', color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Pengumuman', desc: 'Lihat broadcast terbaru', icon: <Megaphone size={16} />, to: '/broadcast', color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'Berita Acara', desc: 'Unduh berita acara verifikasi', icon: <ShieldCheck size={16} />, to: '/berita-acara', color: 'text-blue-600', bg: 'bg-blue-50' },
                    ]}
                />
            </div>
        </div>
    );
}

/* ── PIC Dashboard ──────────────────────────────────────────── */

function PicDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', 'pic'],
        queryFn: async (): Promise<PicData> => {
            const res = await api.get('/dashboard/pic');
            return res.data.data;
        },
    });

    const summary = data?.summary ?? { total: 0, pending: 0, done: 0 };
    const pct = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

    return (
        <div className="flex flex-col gap-5">
            <PeriodeBanner periode={data?.periode ?? null} />

            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Total Soal Ditugaskan" value={isLoading ? '…' : summary.total} icon={<Layers size={18} />} color="text-[var(--color-primary)]" bg="bg-[var(--color-primary-light)]" />
                <StatCard label="Belum Diverifikasi" value={isLoading ? '…' : summary.pending} icon={<Clock size={18} />} color="text-amber-600" bg="bg-amber-50" to="/verifikasi" />
                <StatCard label="Sudah Diverifikasi" value={isLoading ? '…' : summary.done} icon={<CheckCircle2 size={18} />} color="text-green-600" bg="bg-green-50" border="border-green-100" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-5">
                        <ShieldCheck size={16} className="text-[var(--color-primary)]" />
                        <h3 className="text-sm font-bold text-gray-700">Progress Verifikasi Anda</h3>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            <div className="h-8 animate-pulse rounded-xl bg-gray-100" />
                            <div className="h-4 animate-pulse rounded bg-gray-100 w-3/4" />
                        </div>
                    ) : (
                        <>
                            <div className="flex items-end gap-2 mb-3">
                                <p className="text-5xl font-black text-[var(--color-primary)]">{pct}%</p>
                                <p className="pb-1 text-sm text-gray-500">{summary.done} dari {summary.total} soal terverifikasi</p>
                            </div>
                            <div className="h-4 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className="h-4 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] transition-all duration-700"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                            {summary.pending > 0 && (
                                <Link
                                    to="/verifikasi"
                                    className="mt-4 flex items-center justify-between rounded-xl bg-amber-50 border border-amber-200 p-3 transition hover:bg-amber-100"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Clock size={15} className="text-amber-600" />
                                        <p className="text-sm font-semibold text-amber-800">
                                            {summary.pending} soal menunggu verifikasi Anda
                                        </p>
                                    </div>
                                    <ArrowRight size={15} className="text-amber-600" />
                                </Link>
                            )}
                            {summary.pending === 0 && summary.total > 0 && (
                                <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-green-50 border border-green-200 p-3">
                                    <CheckCircle2 size={15} className="text-green-600" />
                                    <p className="text-sm font-semibold text-green-700">🎉 Semua soal telah diverifikasi!</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <QuickActions
                    actions={[
                        { label: 'Antrian Verifikasi', desc: 'Soal yang perlu diperiksa', icon: <ShieldCheck size={16} />, to: '/verifikasi', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
                        { label: 'Berita Acara', desc: 'Generate & print berita acara', icon: <FileText size={16} />, to: '/berita-acara', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Pengumuman', desc: 'Lihat broadcast terbaru', icon: <Megaphone size={16} />, to: '/broadcast', color: 'text-green-600', bg: 'bg-green-50' },
                    ]}
                />
            </div>
        </div>
    );
}

/* ── Coordinator Dashboard ────────────────────────────────── */

function CoordinatorDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', 'coordinator'],
        queryFn: async (): Promise<CoordinatorData> => {
            const res = await api.get('/dashboard/coordinator');
            return res.data.data;
        },
    });

    const prodiList = data?.progress_by_prodi ?? [];
    const totalApproved = prodiList.reduce((a, b) => a + b.approved, 0);
    const totalAll = prodiList.reduce((a, b) => a + b.total, 0);
    const overallPct = totalAll > 0 ? Math.round((totalApproved / totalAll) * 100) : 0;

    return (
        <div className="flex flex-col gap-5">
            <PeriodeBanner periode={data?.periode ?? null} />

            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Total Program Studi" value={isLoading ? '…' : prodiList.length} icon={<Users size={18} />} color="text-[var(--color-primary)]" bg="bg-[var(--color-primary-light)]" />
                <StatCard label="Total Soal Disetujui" value={isLoading ? '…' : totalApproved} icon={<CheckCircle2 size={18} />} color="text-green-600" bg="bg-green-50" border="border-green-100" />
                <StatCard label="Progress Keseluruhan" value={isLoading ? '…' : `${overallPct}%`} icon={<TrendingUp size={18} />} color="text-indigo-600" bg="bg-indigo-50" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 size={16} className="text-[var(--color-primary)]" />
                        <h3 className="text-sm font-bold text-gray-700">Progress per Program Studi</h3>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <div className="h-3 w-36 animate-pulse rounded bg-gray-200" />
                                        <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
                                    </div>
                                    <div className="h-2 animate-pulse rounded-full bg-gray-100" />
                                </div>
                            ))}
                        </div>
                    ) : prodiList.length === 0 ? (
                        <p className="text-sm text-gray-400 py-8 text-center">Belum ada data progress prodi.</p>
                    ) : (
                        <div className="space-y-4">
                            {prodiList.map((p) => (
                                <ProgressBar
                                    key={p.prodi}
                                    label={p.prodi}
                                    value={p.approved}
                                    total={p.total}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <QuickActions
                    actions={[
                        { label: 'Monitoring', desc: 'Pantau detail per prodi', icon: <TrendingUp size={16} />, to: '/monitoring', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
                        { label: 'PLO & CLO', desc: 'Kelola capaian pembelajaran', icon: <BookOpen size={16} />, to: '/plo-clo', color: 'text-purple-600', bg: 'bg-purple-50' },
                        { label: 'Semua Soal', desc: 'Lihat seluruh soal dosen', icon: <Layers size={16} />, to: '/soal/semua', color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Pengumuman', desc: 'Lihat broadcast terbaru', icon: <Megaphone size={16} />, to: '/broadcast', color: 'text-green-600', bg: 'bg-green-50' },
                    ]}
                />
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   Main DashboardPage — role switcher
══════════════════════════════════════════════════════════════ */

export function DashboardPage() {
    const { user, role } = useAuth();

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 11) return 'Selamat pagi';
        if (h < 15) return 'Selamat siang';
        if (h < 18) return 'Selamat sore';
        return 'Selamat malam';
    };

    const roleLabel = role === 'super_admin'
        ? 'Super Admin'
        : role === 'coordinator'
        ? 'Koordinator'
        : user?.is_pic_active
        ? 'PIC Verifikator'
        : 'Dosen';

    return (
        <div className="flex flex-col gap-5">
            {/* ── Header Greeting ─────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-secondary)]">
                        {greeting()}, {user?.name?.split(' ')[0] ?? 'Pengguna'} 👋
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Anda masuk sebagai <span className="font-semibold text-[var(--color-primary)]">{roleLabel}</span>
                        {user?.program_studi_name ? ` · ${user.program_studi_name}` : ''}
                    </p>
                </div>
                <Link
                    to={role === 'super_admin' ? '/monitoring' : '/soal'}
                    className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[var(--color-primary-dark)]"
                >
                    {role === 'super_admin' ? 'Lihat Monitoring' : 'Lihat Soal Saya'}
                    <ArrowRight size={15} />
                </Link>
            </div>

            {/* ── Role-based Dashboard ─────────────────────────── */}
            {role === 'super_admin' && <SuperAdminDashboard />}
            {role === 'coordinator' && <CoordinatorDashboard />}
            {role === 'dosen' && user?.is_pic_active && <PicDashboard />}
            {role === 'dosen' && !user?.is_pic_active && <DosenDashboard />}
        </div>
    );
}
