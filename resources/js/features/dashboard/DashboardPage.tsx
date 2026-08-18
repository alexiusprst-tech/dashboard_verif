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
    ClipboardList,
    UserCheck,
} from 'lucide-react';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatDate } from '@/shared/lib/utils';
import api from '@/shared/lib/api';
import { UploadProgressWidget } from './components/UploadProgressWidget';

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

interface KoordinatorMkCourse {
    course_id: number;
    kode_mk?: string;
    nama_mk?: string;
    sks?: number;
    semester?: number;
    total_soal?: number;
    approved_soal?: number;
    pending_soal?: number;
    revisi_soal?: number;
    verifikators: Array<{
        id: number;
        nama_lengkap: string;
        kode_dosen: string;
        assigned_by?: string;
        assigned_at?: string;
    }>;
}

interface KoordinatorMkDashboardData {
    total_mata_kuliah: number;
    total_verifikator: number;
    total_soal_mk?: number;
    approved_soal_mk?: number;
    courses: KoordinatorMkCourse[];
}

interface DosenData {
    periode: DashboardPeriode | null;
    soal_status_counts: SoalStatusCounts;
    deadline: { nama_periode: string; tanggal_deadline: string } | null;
    koordinator_mk?: KoordinatorMkDashboardData | null;
}

interface PicData {
    periode: DashboardPeriode | null;
    summary: { total: number; pending: number; done: number };
}

/* ── Status Color Map ───────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    in_review: { label: 'In Review', color: '#4F46E5', bg: 'bg-indigo-50' },
    revisi: { label: 'Revisi', color: '#D97706', bg: 'bg-amber-50' },
    approved: { label: 'Disetujui', color: '#16A34A', bg: 'bg-green-50' },
    rejected: { label: 'Ditolak', color: '#DC2626', bg: 'bg-red-50' },
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

function PeriodeBanner({ periode, isLoading = false }: { periode: DashboardPeriode | null, isLoading?: boolean }) {
    if (isLoading) return null;

    if (!periode) {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-5 py-4">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 font-medium">Tidak ada periode aktif saat ini. Hubungi Koordinator untuk mengaktifkan periode.</p>
            </div>
        );
    }

    return null;
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
    const inReviewVal = counts.in_review + counts.submitted + counts.draft;
    const data = [
        { name: 'In Review', value: inReviewVal, color: STATUS_CONFIG.in_review.color },
        { name: 'Revisi', value: counts.revisi, color: STATUS_CONFIG.revisi.color },
        { name: 'Disetujui', value: counts.approved, color: STATUS_CONFIG.approved.color },
        { name: 'Ditolak', value: counts.rejected, color: STATUS_CONFIG.rejected.color },
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
        { name: 'In Review', value: counts.in_review + counts.submitted + counts.draft, color: STATUS_CONFIG.in_review.color },
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
        { label: 'In Review', value: counts.in_review + counts.submitted + counts.draft, icon: <Activity size={14} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Revisi', value: counts.revisi, icon: <AlertTriangle size={14} />, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Disetujui', value: counts.approved, icon: <CheckCircle2 size={14} />, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Ditolak', value: counts.rejected, icon: <XCircle size={14} />, color: 'text-red-500', bg: 'bg-red-50' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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

interface RoleDashboardProps {
    selectedPeriodeId: string;
    setSelectedPeriodeId: (id: string) => void;
    periodes: DashboardPeriode[];
    activePeriode: DashboardPeriode | null;
}

/* ── Coordinator Dashboard ─────────────────────────────────── */

function CoordinatorDashboard({ selectedPeriodeId, setSelectedPeriodeId, periodes, activePeriode }: RoleDashboardProps) {
    const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', 'coordinator', selectedPeriodeId],
        queryFn: async (): Promise<SuperAdminData> => {
            const res = await api.get('/dashboard/coordinator', {
                params: { periode_id: selectedPeriodeId || undefined },
            });
            return res.data.data;
        },
        staleTime: 0,
    });

    const raw = data?.soal_status_counts;
    const counts = {
        draft:      raw?.draft      ?? 0,
        submitted:  raw?.submitted  ?? 0,
        in_review:  raw?.in_review  ?? 0,
        approved:   raw?.approved   ?? 0,
        revisi:     raw?.revisi     ?? 0,
        rejected:   raw?.rejected   ?? 0,
    };
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const progress = data?.progress;

    return (
        <div className="flex flex-col gap-5">
            <PeriodeBanner periode={activePeriode} isLoading={isLoading} />

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
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={16} className="text-[var(--color-primary)]" />
                                <h3 className="text-sm font-bold text-gray-800">Visualisasi Distribusi Status Soal</h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Filter Periode Dropdown */}
                                <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/80 px-2.5 py-1 transition hover:bg-white">
                                    <CalendarClock size={13} className="text-[var(--color-primary)] flex-shrink-0" />
                                    <select
                                        value={selectedPeriodeId}
                                        onChange={(e) => setSelectedPeriodeId(e.target.value)}
                                        className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value="">Periode Aktif</option>
                                        {periodes.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nama_periode} {p.status === 'aktif' ? '(Aktif)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* View Switcher Button */}
                                <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                                    <button
                                        onClick={() => setChartType('donut')}
                                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${chartType === 'donut' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <PieIcon size={13} /> Donut
                                    </button>
                                    <button
                                        onClick={() => setChartType('bar')}
                                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${chartType === 'bar' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <BarChart3 size={13} /> Batang
                                    </button>
                                </div>
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
                                            {counts.submitted + counts.in_review} Soal Menunggu Verifikator
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
                                            Dosen pengampu sedang melakukan perbaikan sesuai catatan verifikator.
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
                            { label: 'Penugasan Verifikator', desc: 'Assign verifikator ke dosen', icon: <Users size={16} />, to: '/penugasan-verifikator', color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Kategori & Template', desc: 'Kelola template soal DOCX', icon: <BookOpen size={16} />, to: '/kategori', color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Monitoring', desc: 'Pantau progres verifikasi', icon: <TrendingUp size={16} />, to: '/monitoring', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        ]}
                    />
                </div>
            </div>

            {/* Progress Upload per Mata Kuliah (Super Admin) */}
            <div className="mt-2">
                <UploadProgressWidget selectedPeriodeId={selectedPeriodeId} role="super_admin" title="Progress Upload per Mata Kuliah (Seluruh Mata Kuliah)" />
            </div>
        </div>
    );
}

/* ── Dosen Dashboard (Dosen Biasa / Pengampu) ────────────────── */

function DosenDashboard({ selectedPeriodeId, setSelectedPeriodeId, periodes, activePeriode }: RoleDashboardProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', 'dosen', selectedPeriodeId],
        queryFn: async (): Promise<DosenData> => {
            const res = await api.get('/dashboard/dosen', {
                params: { periode_id: selectedPeriodeId || undefined },
            });
            return res.data.data;
        },
        staleTime: 0,
    });

    const raw = data?.soal_status_counts;
    const counts = {
        draft:      raw?.draft      ?? 0,
        submitted:  raw?.submitted  ?? 0,
        in_review:  raw?.in_review  ?? 0,
        approved:   raw?.approved   ?? 0,
        revisi:     raw?.revisi     ?? 0,
        rejected:   raw?.rejected   ?? 0,
    };
    const totalSoal = Object.values(counts).reduce((a, b) => a + b, 0);

    const quickActions = [
        { label: 'Unggah Soal', desc: 'Kirim naskah soal baru ke sistem', icon: <FileText size={16} />, to: '/soal', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
        { label: 'Lihat PLO & CLO', desc: 'Referensi capaian pembelajaran', icon: <BookOpen size={16} />, to: '/plo-clo', color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Berita Acara', desc: 'Unduh berita acara evaluasi soal', icon: <ClipboardList size={16} />, to: '/berita-acara', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="flex flex-col gap-5">
            <PeriodeBanner periode={activePeriode} isLoading={isLoading} />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Total Soal Saya" value={isLoading ? '…' : totalSoal} icon={<FileText size={18} />} color="text-[var(--color-primary)]" bg="bg-[var(--color-primary-light)]" to="/soal" />
                <StatCard label="Disetujui" value={isLoading ? '…' : counts.approved} icon={<CheckCircle2 size={18} />} color="text-green-600" bg="bg-green-50" border="border-green-100" />
                <StatCard label="Dalam Review" value={isLoading ? '…' : counts.in_review} icon={<Activity size={18} />} color="text-indigo-600" bg="bg-indigo-50" />
                <StatCard label="Perlu Revisi" value={isLoading ? '…' : counts.revisi} icon={<AlertTriangle size={18} />} color="text-amber-600" bg="bg-amber-50" />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Left: Chart */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <PieIcon size={16} className="text-[var(--color-primary)]" />
                                <h3 className="text-sm font-bold text-gray-800">Diagram Status Soal Saya</h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/80 px-2.5 py-1 transition hover:bg-white">
                                    <CalendarClock size={13} className="text-[var(--color-primary)] flex-shrink-0" />
                                    <select
                                        value={selectedPeriodeId}
                                        onChange={(e) => setSelectedPeriodeId(e.target.value)}
                                        className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value="">Periode Aktif</option>
                                        {periodes.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nama_periode} {p.status === 'aktif' ? '(Aktif)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <span className="text-xs font-semibold text-gray-400">{totalSoal} Soal</span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
                        ) : (
                            <StatusPieChart counts={counts} />
                        )}
                    </div>
                </div>

                {/* Right: Deadline & Quick Actions */}
                <div className="flex flex-col gap-5">
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

                    <QuickActions actions={quickActions} />
                </div>
            </div>

            {/* Progress Upload per Mata Kuliah (UploadProgressWidget) */}
            <div className="mt-2">
                <UploadProgressWidget selectedPeriodeId={selectedPeriodeId} role="dosen" title="Progress Upload Mata Kuliah Saya" />
            </div>
        </div>
    );
}

/* ── Koordinator MK Dashboard (Dedicated) ───────────────────── */

function KoordinatorMkDashboard({ selectedPeriodeId, setSelectedPeriodeId, periodes, activePeriode }: RoleDashboardProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard', 'dosen', selectedPeriodeId],
        queryFn: async (): Promise<DosenData> => {
            const res = await api.get('/dashboard/dosen', {
                params: { periode_id: selectedPeriodeId || undefined },
            });
            return res.data.data;
        },
        staleTime: 0,
    });

    const raw = data?.soal_status_counts;
    const counts = {
        draft:      raw?.draft      ?? 0,
        submitted:  raw?.submitted  ?? 0,
        in_review:  raw?.in_review  ?? 0,
        approved:   raw?.approved   ?? 0,
        revisi:     raw?.revisi     ?? 0,
        rejected:   raw?.rejected   ?? 0,
    };
    const totalSoalSaya = Object.values(counts).reduce((a, b) => a + b, 0);
    const koordinatorData = data?.koordinator_mk;

    const quickActions = [
        { label: 'Monitoring Verifikator', desc: 'Pantau verifikator mata kuliah koordinasi', icon: <Users size={16} />, to: '/penugasan-verifikator', color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Kelola PLO & CLO', desc: 'Atur capaian pembelajaran mata kuliah', icon: <BookOpen size={16} />, to: '/plo-clo', color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Unggah Soal Saya', desc: 'Kirim naskah soal ujian mandiri', icon: <FileText size={16} />, to: '/soal', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
        { label: 'Berita Acara', desc: 'Lihat status berita acara evaluasi', icon: <ClipboardList size={16} />, to: '/berita-acara', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="flex flex-col gap-5">
            <PeriodeBanner periode={activePeriode} isLoading={isLoading} />

            {/* Stat Cards Koordinator MK */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                    label="Mata Kuliah Koordinasi"
                    value={isLoading ? '…' : (koordinatorData?.total_mata_kuliah ?? 0)}
                    icon={<BookOpen size={18} />}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                    border="border-indigo-100"
                    trend="Diampu periode ini"
                />
                <StatCard
                    label="Verifikator Ditunjuk"
                    value={isLoading ? '…' : (koordinatorData?.total_verifikator ?? 0)}
                    icon={<Users size={18} />}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    border="border-blue-100"
                    to="/penugasan-verifikator"
                    trend="Oleh Super Admin"
                />
                <StatCard
                    label="Total Soal MK Koordinasi"
                    value={isLoading ? '…' : (koordinatorData?.total_soal_mk ?? 0)}
                    icon={<Layers size={18} />}
                    color="text-amber-600"
                    bg="bg-amber-50"
                    border="border-amber-100"
                    trend={`${koordinatorData?.approved_soal_mk ?? 0} Selesai`}
                />
                <StatCard
                    label="Soal Saya Terunggah"
                    value={isLoading ? '…' : totalSoalSaya}
                    icon={<FileText size={18} />}
                    color="text-[var(--color-primary)]"
                    bg="bg-[var(--color-primary-light)]"
                    to="/soal"
                />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {/* Left: Monitoring Verifikator & Progress MK Koordinasi */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    {/* Monitoring Verifikator Widget */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Verifikator & Progres Mata Kuliah Koordinasi</h3>
                                    <p className="text-xs text-gray-500">Dosen verifikator yang ditunjuk oleh Super Admin untuk mata kuliah Anda</p>
                                </div>
                            </div>
                            <Link
                                to="/penugasan-verifikator"
                                className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                            >
                                Buka Monitoring <ArrowRight size={13} />
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="space-y-3 py-4">
                                <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                                <div className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                            </div>
                        ) : !koordinatorData || koordinatorData.courses.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
                                <p className="text-xs font-semibold text-gray-600">Belum ada mata kuliah yang ditugaskan kepada Anda sebagai Koordinator MK</p>
                                <p className="text-[11px] text-gray-400 mt-1">Penugasan Koordinator MK dilakukan oleh Super Administrator pada menu Penugasan Koordinator MK.</p>
                            </div>
                        ) : (
                            <div className="space-y-3.5">
                                {koordinatorData.courses.map((c) => {
                                    const totalSoal = c.total_soal ?? 0;
                                    const approvedSoal = c.approved_soal ?? 0;
                                    const pendingSoal = c.pending_soal ?? 0;
                                    const pct = totalSoal > 0 ? Math.round((approvedSoal / totalSoal) * 100) : 0;

                                    return (
                                        <div key={c.course_id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition hover:border-gray-200 hover:bg-white shadow-xs">
                                            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-800">
                                                            {c.kode_mk || `MK #${c.course_id}`}
                                                        </span>
                                                        <span className="text-xs font-bold text-gray-900">{c.nama_mk}</span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                                        {c.sks ? `${c.sks} SKS` : ''} {c.semester ? `· Semester ${c.semester}` : ''}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                        {approvedSoal}/{totalSoal} Soal Selesai
                                                    </span>
                                                    {pendingSoal > 0 && (
                                                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                                            {pendingSoal} Menunggu Verifikasi
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress Bar Verifikasi Course */}
                                            <div className="mb-3">
                                                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                                                    <span>Progres Verifikasi Soal MK</span>
                                                    <span className="font-semibold text-gray-700">{pct}%</span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Verifikator Assigned */}
                                            <div className="border-t border-gray-200/60 pt-2.5 flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] font-semibold text-gray-500">Verifikator Soal:</span>
                                                    {c.verifikators.length === 0 ? (
                                                        <span className="text-[11px] font-medium text-amber-600 italic">
                                                            Belum ditunjuk Super Admin
                                                        </span>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {c.verifikators.map((v) => (
                                                                <span
                                                                    key={v.id}
                                                                    className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800 border border-blue-100"
                                                                >
                                                                    <UserCheck size={11} className="text-blue-600" />
                                                                    {v.nama_lengkap} ({v.kode_dosen})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <Link
                                                    to="/plo-clo"
                                                    className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline"
                                                >
                                                    Kelola CLO &rarr;
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Status Diagram Soal Saya (Koordinator MK) */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <PieIcon size={16} className="text-[var(--color-primary)]" />
                                <h3 className="text-sm font-bold text-gray-800">Diagram Status Soal Mandiri Saya</h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/80 px-2.5 py-1 transition hover:bg-white">
                                    <CalendarClock size={13} className="text-[var(--color-primary)] flex-shrink-0" />
                                    <select
                                        value={selectedPeriodeId}
                                        onChange={(e) => setSelectedPeriodeId(e.target.value)}
                                        className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value="">Periode Aktif</option>
                                        {periodes.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nama_periode} {p.status === 'aktif' ? '(Aktif)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <span className="text-xs font-semibold text-gray-400">{totalSoalSaya} Soal</span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
                        ) : (
                            <StatusPieChart counts={counts} />
                        )}
                    </div>
                </div>

                {/* Right: Deadline & Quick Actions */}
                <div className="flex flex-col gap-5">
                    {data?.deadline && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <CalendarClock size={16} className="text-amber-600" />
                                <h3 className="text-sm font-bold text-amber-900">Pengingat Batas Waktu</h3>
                            </div>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Batas akhir pengunggahan & verifikasi soal untuk <span className="font-bold">{data.deadline.nama_periode}</span>:
                            </p>
                            <div className="mt-3 p-3 rounded-xl bg-white border border-amber-200 text-center">
                                <p className="text-sm font-extrabold text-amber-900">
                                    {formatDate(data.deadline.tanggal_deadline)}
                                </p>
                            </div>
                        </div>
                    )}

                    <QuickActions actions={quickActions} />
                </div>
            </div>

            {/* Progress Upload per Mata Kuliah (UploadProgressWidget) */}
            <div className="mt-2">
                <UploadProgressWidget selectedPeriodeId={selectedPeriodeId} role="koordinator" title="Progress Soal Mata Kuliah yang Dikoordinasikan" />
            </div>
        </div>
    );
}

/* ── Verifikator Dashboard (Dosen Verifikator Soal) ─────────── */

function PicDashboard({ selectedPeriodeId, setSelectedPeriodeId, periodes, activePeriode }: RoleDashboardProps) {
    const { data: dosenData, isLoading: dosenLoading } = useQuery({
        queryKey: ['dashboard', 'dosen', selectedPeriodeId],
        queryFn: async (): Promise<DosenData> => {
            const res = await api.get('/dashboard/dosen', {
                params: { periode_id: selectedPeriodeId || undefined },
            });
            return res.data.data;
        },
    });

    const { data: picData, isLoading: picLoading } = useQuery({
        queryKey: ['dashboard', 'pic', selectedPeriodeId],
        queryFn: async (): Promise<PicData> => {
            const res = await api.get('/dashboard/pic', {
                params: { periode_id: selectedPeriodeId || undefined },
            });
            return res.data.data;
        },
        staleTime: 0,
    });

    const isLoading = dosenLoading || picLoading;

    const rawCounts = dosenData?.soal_status_counts;
    const counts = {
        draft:      rawCounts?.draft      ?? 0,
        submitted:  rawCounts?.submitted  ?? 0,
        in_review:  rawCounts?.in_review  ?? 0,
        approved:   rawCounts?.approved   ?? 0,
        revisi:     rawCounts?.revisi     ?? 0,
        rejected:   rawCounts?.rejected   ?? 0,
    };
    const totalSoalSaya = Object.values(counts).reduce((a, b) => a + b, 0);

    const summary = picData?.summary ?? { total: 0, pending: 0, done: 0 };
    const pct = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

    const donutData = [
        { name: 'Selesai', value: summary.done, color: '#16A34A' },
        { name: 'Menunggu', value: summary.pending, color: '#D97706' },
    ].filter((i) => i.value > 0);

    return (
        <div className="flex flex-col gap-5">
            <PeriodeBanner periode={activePeriode} isLoading={isLoading} />

            {/* Verifikator Stats Cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Antrian Verifikasi" value={isLoading ? '…' : summary.total} icon={<Layers size={18} />} color="text-indigo-600" bg="bg-indigo-50" to="/verifikasi" trend={`${summary.pending} Perlu Tindakan`} />
                <StatCard label="Belum Diverifikasi" value={isLoading ? '…' : summary.pending} icon={<Clock size={18} />} color="text-amber-600" bg="bg-amber-50" to="/verifikasi" border="border-amber-100" />
                <StatCard label="Selesai Diverifikasi" value={isLoading ? '…' : summary.done} icon={<CheckCircle2 size={18} />} color="text-green-600" bg="bg-green-50" border="border-green-100" />
                <StatCard label="Soal Saya Mandiri" value={isLoading ? '…' : totalSoalSaya} icon={<FileText size={18} />} color="text-[var(--color-primary)]" bg="bg-[var(--color-primary-light)]" to="/soal" />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2 flex flex-col gap-5">
                    {/* Verifikator Progress Chart */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                            <CheckSquare size={16} className="text-[var(--color-primary)]" />
                            <h3 className="text-sm font-bold text-gray-800">Progress Verifikasi Soal</h3>
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

                    {/* Dosen Chart */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                                <PieIcon size={16} className="text-[var(--color-primary)]" />
                                <h3 className="text-sm font-bold text-gray-800">Diagram Status Soal Mandiri Saya</h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/80 px-2.5 py-1 transition hover:bg-white">
                                    <CalendarClock size={13} className="text-[var(--color-primary)] flex-shrink-0" />
                                    <select
                                        value={selectedPeriodeId}
                                        onChange={(e) => setSelectedPeriodeId(e.target.value)}
                                        className="bg-transparent text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
                                    >
                                        <option value="">Periode Aktif</option>
                                        {periodes.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nama_periode} {p.status === 'aktif' ? '(Aktif)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <span className="text-xs font-semibold text-gray-400">{totalSoalSaya} Soal</span>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
                        ) : (
                            <StatusPieChart counts={counts} />
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-5">
                    {/* Deadline Reminder */}
                    {dosenData?.deadline && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <CalendarClock size={16} className="text-amber-600" />
                                <h3 className="text-sm font-bold text-amber-900">Pengingat Tenggat Waktu</h3>
                            </div>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                Batas akhir pengunggahan dan revisi soal untuk <span className="font-bold">{dosenData.deadline.nama_periode}</span> adalah:
                            </p>
                            <div className="mt-3 p-3 rounded-xl bg-white border border-amber-200 text-center">
                                <p className="text-sm font-extrabold text-amber-900">
                                    {formatDate(dosenData.deadline.tanggal_deadline)}
                                </p>
                            </div>
                        </div>
                    )}

                    <QuickActions
                        actions={[
                            { label: 'Antrian Verifikasi', desc: 'Periksa soal yang ditugaskan', icon: <ShieldCheck size={16} />, to: '/verifikasi', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Unggah Soal Saya', desc: 'Kirim soal mandiri ke sistem', icon: <FileText size={16} />, to: '/soal', color: 'text-[var(--color-primary)]', bg: 'bg-[var(--color-primary-light)]' },
                            { label: 'Berita Acara', desc: 'Generate & cetak berita acara', icon: <ClipboardList size={16} />, to: '/berita-acara', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: 'Lihat PLO & CLO', desc: 'Referensi capaian pembelajaran', icon: <BookOpen size={16} />, to: '/plo-clo', color: 'text-purple-600', bg: 'bg-purple-50' },
                        ]}
                    />
                </div>
            </div>

            {/* Progress Upload per Mata Kuliah (UploadProgressWidget) */}
            <div className="mt-2">
                <UploadProgressWidget selectedPeriodeId={selectedPeriodeId} role="verifikator" title="Progress Soal Mata Kuliah yang Ditugaskan" />
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════════
   Main DashboardPage — role switcher
══════════════════════════════════════════════════════════════ */

export function DashboardPage() {
    const { user, role } = useAuth();
    const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>('');

    const { data: periodes = [], isLoading: periodesLoading } = useQuery<DashboardPeriode[]>({
        queryKey: ['periodes', 'list'],
        queryFn: async () => {
            const res = await api.get('/periode', { params: { per_page: 50 } });
            return res.data?.data ?? [];
        },
        staleTime: 0,
        refetchOnWindowFocus: true,
        refetchOnMount: true,
    });

    // Tentukan periode aktif langsung dari daftar periode
    const activePeriode = periodes.find((p) => p.status === 'aktif') ?? null;

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 11) return 'Selamat pagi';
        if (h < 15) return 'Selamat siang';
        if (h < 18) return 'Selamat sore';
        return 'Selamat malam';
    };

    const isSuperAdmin = user?.is_super_admin ?? false;
    const isKoordinatorMk = user?.is_koordinator_mk ?? user?.is_coordinator ?? false;
    const isVerifikator = user?.is_verifikator_aktif ?? user?.is_pic_active ?? false;

    // State untuk role view jika user memiliki multiple role (misal: Koordinator MK & Verifikator)
    const [viewMode, setViewMode] = useState<'koordinator' | 'verifikator' | 'dosen'>(() => {
        if (isKoordinatorMk) return 'koordinator';
        if (isVerifikator) return 'verifikator';
        return 'dosen';
    });

    const roleLabel = isSuperAdmin
        ? 'Super Admin'
        : isKoordinatorMk && isVerifikator
        ? 'Koordinator MK & Verifikator Soal'
        : isKoordinatorMk
        ? 'Dosen Koordinator Mata Kuliah'
        : isVerifikator
        ? 'Dosen Verifikator Soal'
        : 'Dosen Pengampu';

    const hasMultipleRoles = !isSuperAdmin && isKoordinatorMk && isVerifikator;

    return (
        <div className="flex flex-col gap-5">
            {/* ── Header Greeting ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-[var(--color-secondary)]">
                        {greeting()}, {user?.name?.split(' ')[0] ?? 'Pengguna'} 👋
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Anda masuk sebagai <span className="font-semibold text-[var(--color-primary)]">{roleLabel}</span>
                        {user?.program_studi_name ? ` · ${user.program_studi_name}` : ''}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Multiple role switcher tabs */}
                    {hasMultipleRoles && (
                        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
                            <button
                                onClick={() => setViewMode('koordinator')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'koordinator' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                Dashboard Koordinator MK
                            </button>
                            <button
                                onClick={() => setViewMode('verifikator')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'verifikator' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
                            >
                                Dashboard Verifikator
                            </button>
                        </div>
                    )}

                    <Link
                        to={isSuperAdmin ? '/periode' : isKoordinatorMk ? '/penugasan-verifikator' : isVerifikator ? '/verifikasi' : '/soal'}
                        className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[var(--color-primary-dark)]"
                    >
                        {isSuperAdmin ? 'Manajemen System' : isKoordinatorMk ? 'Monitoring Verifikator' : isVerifikator ? 'Antrian Verifikasi' : 'Soal Saya'}
                        <ArrowRight size={15} />
                    </Link>
                </div>
            </div>

            {/* ── Role-based Dashboard ─────────────────────────── */}
            {isSuperAdmin && (
                <CoordinatorDashboard
                    selectedPeriodeId={selectedPeriodeId}
                    setSelectedPeriodeId={setSelectedPeriodeId}
                    periodes={periodes}
                    activePeriode={periodesLoading ? null : activePeriode}
                />
            )}

            {!isSuperAdmin && (viewMode === 'koordinator' || (isKoordinatorMk && !hasMultipleRoles)) && (
                <KoordinatorMkDashboard
                    selectedPeriodeId={selectedPeriodeId}
                    setSelectedPeriodeId={setSelectedPeriodeId}
                    periodes={periodes}
                    activePeriode={periodesLoading ? null : activePeriode}
                />
            )}

            {!isSuperAdmin && (viewMode === 'verifikator' || (!isKoordinatorMk && isVerifikator)) && (
                <PicDashboard
                    selectedPeriodeId={selectedPeriodeId}
                    setSelectedPeriodeId={setSelectedPeriodeId}
                    periodes={periodes}
                    activePeriode={periodesLoading ? null : activePeriode}
                />
            )}

            {!isSuperAdmin && !isKoordinatorMk && !isVerifikator && (
                <DosenDashboard
                    selectedPeriodeId={selectedPeriodeId}
                    setSelectedPeriodeId={setSelectedPeriodeId}
                    periodes={periodes}
                    activePeriode={periodesLoading ? null : activePeriode}
                />
            )}
        </div>
    );
}
