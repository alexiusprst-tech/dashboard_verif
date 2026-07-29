import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
} from 'recharts';
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
    PieChart as PieIcon,
    Sparkles,
    CheckSquare,
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

/* ── Status Color Map ───────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    approved: { label: 'Disetujui', color: '#16A34A', bg: 'bg-green-50' },
    in_review: { label: 'Dalam Review', color: '#4F46E5', bg: 'bg-indigo-50' },
    submitted: { label: 'Dikirim', color: '#2563EB', bg: 'bg-blue-50' },
    revisi: { label: 'Perlu Revisi', color: '#D97706', bg: 'bg-amber-50' },
    rejected: { label: 'Ditolak', color: '#DC2626', bg: 'bg-red-50' },
    draft: { label: 'Draft', color: '#9CA3AF', bg: 'bg-gray-100' },
};

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

/* ── Periode Banner ─────────────────────────────────────────── */

function PeriodeBanner({ periode }: { periode: DashboardPeriode | null }) {
    if (!periode) {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-4">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 font-medium">Tidak ada periode aktif saat ini. Hubungi Koordinator untuk mengaktifkan periode.</p>
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

/* ── Custom Recharts Tooltip ────────────────────────────────── */

function CustomChartTooltip({ active, payload }: any) {
    if (active && payload && payload.length) {
        const item = payload[0];
        return (
            <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-lg text-xs">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.payload?.color || item.color }} />
                    <span className="font-semibold text-gray-700">{item.name || item.payload?.name}:</span>
                    <span className="font-bold text-gray-900">{item.value} Soal</span>
                </div>
            </div>
        );
    }
    return null;
}

/* ── Status Pie/Donut Chart Component ────────────────────────── */

function StatusPieChart({ counts }: { counts: SoalStatusCounts }) {
    const data = [
        { name: 'Disetujui', value: counts.approved, color: STATUS_CONFIG.approved.color },
        { name: 'Dalam Review', value: counts.in_review, color: STATUS_CONFIG.in_review.color },
        { name: 'Dikirim', value: counts.submitted, color: STATUS_CONFIG.submitted.color },
        { name: 'Perlu Revisi', value: counts.revisi, color: STATUS_CONFIG.revisi.color },
        { name: 'Ditolak', value: counts.rejected, color: STATUS_CONFIG.rejected.color },
        { name: 'Draft', value: counts.draft, color: STATUS_CONFIG.draft.color },
    ].filter((item) => item.value > 0);

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-52 text-center text-gray-400">
                <PieIcon size={32} strokeWidth={1.5} className="mb-2 text-gray-300" />
                <p className="text-xs font-medium">Belum ada data soal pada periode ini</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row items-center gap-4 py-2">
            <div className="w-full md:w-1/2 h-52 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center total text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-gray-900">{total}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Total Soal</span>
                </div>
            </div>

            {/* Legend Breakdown */}
            <div className="w-full md:w-1/2 grid grid-cols-2 gap-2 text-xs">
                {data.map((item) => {
                    const pct = Math.round((item.value / total) * 100);
                    return (
                        <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-2 truncate">
                                <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-gray-600 font-medium truncate">{item.name}</span>
                            </div>
                            <span className="font-bold text-gray-900 ml-1">{item.value} <span className="text-[10px] text-gray-400 font-normal">({pct}%)</span></span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ── Status Bar Chart Component ─────────────────────────────── */

function StatusBarChart({ counts }: { counts: SoalStatusCounts }) {
    const data = [
        { name: 'Draft', value: counts.draft, color: STATUS_CONFIG.draft.color },
        { name: 'Dikirim', value: counts.submitted, color: STATUS_CONFIG.submitted.color },
        { name: 'In Review', value: counts.in_review, color: STATUS_CONFIG.in_review.color },
        { name: 'Revisi', value: counts.revisi, color: STATUS_CONFIG.revisi.color },
        { name: 'Disetujui', value: counts.approved, color: STATUS_CONFIG.approved.color },
        { name: 'Ditolak', value: counts.rejected, color: STATUS_CONFIG.rejected.color },
    ];

    return (
        <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/* ── Status Summary Grid ────────────────────────────────────── */

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
        <div className="grid grid-cols-3 gap-2.5">
            {items.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${item.bg} flex-shrink-0`}>
                        <span className={item.color}>{item.icon}</span>
                    </div>
                    <div>
                        <p className="text-base font-bold text-gray-900 leading-none">{item.value}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.label}</p>
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
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-gray-50"
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

/* ── Coordinator Dashboard ─────────────────────────────────── */

function CoordinatorDashboard() {
    const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', 'coordinator'],
        queryFn: async (): Promise<SuperAdminData> => {
            const res = await api.get('/dashboard/coordinator');
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

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Visual Chart & Analytics Section */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    {/* Main Chart Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={16} className="text-[var(--color-primary)]" />
                                <h3 className="text-sm font-bold text-gray-800">Visualisasi Distribusi Status Soal</h3>
                            </div>

                            {/* View Switcher Button */}
                            <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                                <button
                                    onClick={() => setChartType('donut')}
                                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${chartType === 'donut' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <PieIcon size={13} /> Donut
                                </button>
                                <button
                                    onClick={() => setChartType('bar')}
                                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${chartType === 'bar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <BarChart3 size={13} /> Batang
                                </button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="h-56 animate-pulse rounded-xl bg-gray-100" />
                        ) : chartType === 'donut' ? (
                            <StatusPieChart counts={counts} />
                        ) : (
                            <StatusBarChart counts={counts} />
                        )}

                        {/* Overall Progress Bar */}
                        {progress && (
                            <div className="mt-4 border-t border-gray-100 pt-4">
                                <div className="mb-2 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-gray-700">Target Verifikasi Periode Ini</span>
                                    <span className="font-bold text-[var(--color-primary)]">{progress.verified} dari {progress.total} soal terverifikasi ({progress.percentage}%)</span>
                                </div>
                                <div className="h-3.5 rounded-full bg-gray-100 overflow-hidden p-0.5">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] transition-all duration-700"
                                        style={{ width: `${progress.percentage}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Metric Cards Grid */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Ringkasan Angka Per Status</h3>
                        {isLoading ? (
                            <div className="grid grid-cols-3 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
                                ))}
                            </div>
                        ) : (
                            <StatusSummaryGrid counts={counts} />
                        )}
                    </div>
                </div>

                {/* Right Column: Insights & Quick Actions */}
                <div className="flex flex-col gap-5">
                    {/* Analytical Insight Panel */}
                    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={16} className="text-[var(--color-primary)]" />
                            <h3 className="text-sm font-bold text-gray-800">Insight & Performa</h3>
                        </div>

                        <div className="space-y-3 text-xs text-gray-600">
                            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-green-50/70 border border-green-100">
                                <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-green-900">
                                        {total > 0 ? Math.round((counts.approved / total) * 100) : 0}% Soal Disetujui
                                    </p>
                                    <p className="text-green-700 mt-0.5">
                                        {counts.approved} soal telah lulus verifikasi dan siap digunakan.
                                    </p>
                                </div>
                            </div>

                            {counts.submitted + counts.in_review > 0 && (
                                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                                    <Clock size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-blue-900">
                                            {counts.submitted + counts.in_review} Soal Menunggu PIC
                                        </p>
                                        <p className="text-blue-700 mt-0.5">
                                            Perlu pemantauan antrian verifikator agar tidak terlambat.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {counts.revisi > 0 && (
                                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                                    <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-900">
                                            {counts.revisi} Soal Dalam Perbaikan
                                        </p>
                                        <p className="text-amber-700 mt-0.5">
                                            Dosen pengampu sedang melakukan perbaikan sesuai catatan PIC.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
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
    const totalSoal = Object.values(counts).reduce((a, b) => a + b, 0);

    return (
        <div className="flex flex-col gap-5">
            <PeriodeBanner periode={data?.periode ?? null} />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Soal Saya" value={isLoading ? '…' : totalSoal} icon={<FileText size={18} />} color="text-[var(--color-primary)]" bg="bg-[var(--color-primary-light)]" to="/soal" />
                <StatCard label="Disetujui" value={isLoading ? '…' : counts.approved} icon={<CheckCircle2 size={18} />} color="text-green-600" bg="bg-green-50" border="border-green-100" />
                <StatCard label="Dalam Review" value={isLoading ? '…' : counts.in_review} icon={<Activity size={18} />} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard label="Perlu Revisi" value={isLoading ? '…' : counts.revisi} icon={<AlertTriangle size={18} />} color="text-amber-600" bg="bg-amber-50" />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Left Area: Visual Diagram & Alur */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    {/* Status Chart Card */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <PieIcon size={16} className="text-[var(--color-primary)]" />
                                <h3 className="text-sm font-bold text-gray-800">Diagram Status Soal Saya</h3>
                            </div>
                            <span className="text-xs font-semibold text-gray-400">{totalSoal} Soal Terdaftar</span>
                        </div>

                        {isLoading ? (
                            <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
                        ) : (
                            <StatusPieChart counts={counts} />
                        )}
                    </div>

                    {/* Step-by-Step Workflow Guide */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-800 mb-4">Alur Verifikasi Soal Ujian</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="flex flex-col p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Langkah 1</span>
                                <span className="text-xs font-bold text-gray-800 mt-1">1. Buat Draft Soal</span>
                                <p className="text-[11px] text-gray-500 mt-1">Pilih periode & CLO matakuliah.</p>
                            </div>
                            <div className="flex flex-col p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                                <span className="text-[10px] font-bold text-blue-500 uppercase">Langkah 2</span>
                                <span className="text-xs font-bold text-blue-900 mt-1">2. Unggah Berkas</span>
                                <p className="text-[11px] text-blue-700 mt-1">Gunakan template format Word.</p>
                            </div>
                            <div className="flex flex-col p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                                <span className="text-[10px] font-bold text-indigo-500 uppercase">Langkah 3</span>
                                <span className="text-xs font-bold text-indigo-900 mt-1">3. Peninjauan PIC</span>
                                <p className="text-[11px] text-indigo-700 mt-1">PIC memeriksa kesesuaian soal.</p>
                            </div>
                            <div className="flex flex-col p-3 rounded-xl bg-green-50/50 border border-green-100">
                                <span className="text-[10px] font-bold text-green-600 uppercase">Langkah 4</span>
                                <span className="text-xs font-bold text-green-900 mt-1">4. Disetujui</span>
                                <p className="text-[11px] text-green-700 mt-1">Masuk ke Berita Acara resmi.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Area: Deadline Reminder & Quick Actions */}
                <div className="flex flex-col gap-5">
                    {/* Deadline Reminder */}
                    {data?.deadline && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <CalendarClock size={16} className="text-amber-600" />
                                <h3 className="text-sm font-bold text-amber-900">Pengingat Tenggat Waktu</h3>
                            </div>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Batas akhir pengunggahan dan revisi soal untuk <span className="font-bold">{data.deadline.nama_periode}</span> adalah:
                            </p>
                            <div className="mt-3 p-3 rounded-xl bg-white border border-amber-200 text-center">
                                <p className="text-sm font-extrabold text-amber-900">
                                    {formatDate(data.deadline.tanggal_deadline)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <QuickActions
                        actions={[
                            { label: 'Unggah Soal', desc: 'Kirim soal baru ke sistem', icon: <FileText size={16} />, to: '/soal', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
                            { label: 'Lihat PLO & CLO', desc: 'Referensi capaian pembelajaran', icon: <BookOpen size={16} />, to: '/plo-clo', color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Pengumuman', desc: 'Lihat broadcast terbaru', icon: <Megaphone size={16} />, to: '/broadcast', color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Berita Acara', desc: 'Unduh berita acara verifikasi', icon: <ShieldCheck size={16} />, to: '/berita-acara', color: 'text-blue-600', bg: 'bg-blue-50' },
                        ]}
                    />
                </div>
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

    const donutData = [
        { name: 'Selesai', value: summary.done, color: '#16A34A' },
        { name: 'Menunggu', value: summary.pending, color: '#D97706' },
    ].filter((i) => i.value > 0);

    return (
        <div className="flex flex-col gap-5">
            <PeriodeBanner periode={data?.periode ?? null} />

            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Total Soal Ditugaskan" value={isLoading ? '…' : summary.total} icon={<Layers size={18} />} color="text-[var(--color-primary)]" bg="bg-[var(--color-primary-light)]" />
                <StatCard label="Belum Diverifikasi" value={isLoading ? '…' : summary.pending} icon={<Clock size={18} />} color="text-amber-600" bg="bg-amber-50" to="/verifikasi" />
                <StatCard label="Sudah Diverifikasi" value={isLoading ? '…' : summary.done} icon={<CheckCircle2 size={18} />} color="text-green-600" bg="bg-green-50" border="border-green-100" />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                        <CheckSquare size={16} className="text-[var(--color-primary)]" />
                        <h3 className="text-sm font-bold text-gray-800">Progress Verifikasi PIC</h3>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
                            <div className="h-8 animate-pulse rounded-xl bg-gray-100" />
                            <div className="h-4 animate-pulse rounded bg-gray-100 w-3/4" />
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-full sm:w-1/2 h-48 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {donutData.map((entry, index) => (
                                                <Cell key={`pic-cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomChartTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-black text-gray-900">{pct}%</span>
                                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Selesai</span>
                                </div>
                            </div>

                            <div className="w-full sm:w-1/2 flex flex-col justify-center gap-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                                    <span className="text-xs font-semibold text-green-800">Sudah Diverifikasi</span>
                                    <span className="text-base font-bold text-green-900">{summary.done} Soal</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                                    <span className="text-xs font-semibold text-amber-800">Perlu Peninjauan</span>
                                    <span className="text-base font-bold text-amber-900">{summary.pending} Soal</span>
                                </div>
                                {summary.pending > 0 && (
                                    <Link
                                        to="/verifikasi"
                                        className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[var(--color-primary-dark)]"
                                    >
                                        Periksa Antrian Sekarang <ArrowRight size={14} />
                                    </Link>
                                )}
                            </div>
                        </div>
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

    const roleLabel = role === 'coordinator'
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
                    to={role === 'coordinator' ? '/monitoring' : '/soal'}
                    className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[var(--color-primary-dark)]"
                >
                    {role === 'coordinator' ? 'Lihat Monitoring' : 'Lihat Soal Saya'}
                    <ArrowRight size={15} />
                </Link>
            </div>

            {/* ── Role-based Dashboard ─────────────────────────── */}
            {role === 'coordinator' && <CoordinatorDashboard />}
            {role === 'pic' && <PicDashboard />}
            {role === 'dosen' && <DosenDashboard />}
        </div>
    );
}
