import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    BarChart3,
    CheckCircle2,
    Clock,
    FileText,
    RefreshCw,
    AlertTriangle,
    TrendingUp,
    Users,
    BookOpen,
    ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Pagination } from '@/shared/components/ui/Pagination';
import { formatDate } from '@/shared/lib/utils';
import { useAuth } from '@/shared/hooks/useAuth';
import api from '@/shared/lib/api';

/* ── Types ─────────────────────────────────────────────────── */

interface SoalStatusCounts {
    draft?: number;
    submitted?: number;
    in_review?: number;
    approved?: number;
    revisi?: number;
    rejected?: number;
}

interface DashboardProgress {
    total: number;
    approved: number;
    percentage: number;
}

interface ProdiProgress {
    prodi: string;        // nama prodi — sesuai response Laravel progressByProdi()
    total: number;
    approved: number;
    percentage: number;
}

interface SoalItem {
    id: number;
    judul: string;
    status: string;
    kategori_nama: string;
    dosen_nama: string;
    mata_kuliah_nama: string;
    updated_at: string;
}

/* ── Stat Card ─────────────────────────────────────────────── */

interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    bg: string;
}

function StatCard({ label, value, icon, color, bg }: StatCardProps) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                <span className={color}>{icon}</span>
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

/* ── Progress Bar ─────────────────────────────────────────── */

function ProgressBar({ value, total }: { value: number; total: number }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-2 rounded-full bg-[var(--color-primary)] transition-all"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs font-semibold text-gray-600 w-10 text-right">{pct}%</span>
        </div>
    );
}

/* ── Main Component ─────────────────────────────────────────── */

export function MonitoringPage() {
    const { role } = useAuth();
    const [soalPage, setSoalPage] = useState(1);
    const [soalPerPage] = useState(10);
    const [selectedStatus, setSelectedStatus] = useState('');

    /* Dashboard data */
    const dashEndpoint =
        role === 'coordinator'
            ? '/dashboard/coordinator'
            : '/dashboard/dosen';

    const { data: dashData, isLoading: dashLoading, refetch: refetchDash } = useQuery({
        queryKey: ['monitoring-dashboard', dashEndpoint],
        queryFn: async () => {
            const res = await api.get(dashEndpoint);
            return res.data.data;
        },
    });

    /* Soal list */
    const { data: soalData, isLoading: soalLoading, refetch: refetchSoal } = useQuery({
        queryKey: ['monitoring-soal', soalPage, soalPerPage, selectedStatus],
        queryFn: async () => {
            const params: Record<string, any> = {
                page: soalPage,
                per_page: soalPerPage,
            };
            if (selectedStatus) params.status = selectedStatus;
            const res = await api.get('/soal', { params });
            return {
                data: (res.data.data as SoalItem[]) || [],
                meta: res.data.meta,
            };
        },
    });

    const handleRefresh = () => {
        refetchDash();
        refetchSoal();
    };

    /* ── Derived stats ── */
    const statusCounts: SoalStatusCounts = dashData?.soal_status_counts ?? {};
    const progress: DashboardProgress | null = dashData?.progress ?? null;
    const prodiProgress: ProdiProgress[] = dashData?.progress_by_prodi ?? [];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Monitoring & Audit"
                description="Pantau status verifikasi soal secara real-time dan lihat progres per program studi."
                breadcrumb={[{ label: 'Monitoring' }]}
                action={
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
                    >
                        <RefreshCw size={15} /> Refresh Data
                    </button>
                }
            />

            {/* ── Stat Cards ─────────────────────────────────────── */}
            {dashLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <StatCard
                        label="Draft"
                        value={statusCounts.draft ?? 0}
                        icon={<FileText size={18} />}
                        color="text-gray-500"
                        bg="bg-gray-100"
                    />
                    <StatCard
                        label="Submitted"
                        value={statusCounts.submitted ?? 0}
                        icon={<Activity size={18} />}
                        color="text-blue-600"
                        bg="bg-blue-50"
                    />
                    <StatCard
                        label="Dalam Review"
                        value={statusCounts.in_review ?? 0}
                        icon={<Clock size={18} />}
                        color="text-indigo-600"
                        bg="bg-indigo-50"
                    />
                    <StatCard
                        label="Disetujui"
                        value={statusCounts.approved ?? 0}
                        icon={<CheckCircle2 size={18} />}
                        color="text-green-600"
                        bg="bg-green-50"
                    />
                    <StatCard
                        label="Perlu Revisi"
                        value={statusCounts.revisi ?? 0}
                        icon={<AlertTriangle size={18} />}
                        color="text-amber-600"
                        bg="bg-amber-50"
                    />
                    <StatCard
                        label="Ditolak"
                        value={statusCounts.rejected ?? 0}
                        icon={<TrendingUp size={18} />}
                        color="text-red-600"
                        bg="bg-red-50"
                    />
                </div>
            )}

            {/* ── Progress & Prodi ────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Overall progress */}
                {progress && (
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 size={16} className="text-[var(--color-primary)]" />
                            <h3 className="text-sm font-bold text-gray-700">Progress Verifikasi Overall</h3>
                        </div>
                        <div className="flex items-end justify-between mb-3">
                            <div>
                                <p className="text-3xl font-bold text-[var(--color-primary)]">
                                    {progress.percentage}%
                                </p>
                                <p className="text-xs text-gray-400">
                                    {progress.approved} / {progress.total} soal disetujui
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">Target: 100%</p>
                            </div>
                        </div>
                        <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className="h-3 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] transition-all"
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Per-prodi progress */}
                {prodiProgress.length > 0 && (
                    <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Users size={16} className="text-[var(--color-primary)]" />
                            <h3 className="text-sm font-bold text-gray-700">Progress Verifikasi Program Studi</h3>
                        </div>
                        <div className="space-y-3">
                            {prodiProgress.map((p) => (
                                <div key={p.prodi}>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="font-medium text-gray-700 truncate max-w-[200px]">{p.prodi}</span>
                                        <span className="text-gray-400">{p.approved}/{p.total}</span>
                                    </div>
                                    <ProgressBar value={p.approved} total={p.total} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Soal Table ──────────────────────────────────────── */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-[var(--color-primary)]" />
                        <h3 className="text-sm font-bold text-gray-700">Daftar Soal</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-xs text-gray-500 font-medium">Filter Status:</label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => { setSelectedStatus(e.target.value); setSoalPage(1); }}
                            className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                        >
                            <option value="">— Semua —</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="in_review">Dalam Review</option>
                            <option value="approved">Disetujui</option>
                            <option value="revisi">Perlu Revisi</option>
                            <option value="rejected">Ditolak</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-gray-600">
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700">
                            <tr>
                                <th className="px-6 py-4 w-12">No</th>
                                <th className="px-6 py-4">Judul Soal</th>
                                <th className="px-6 py-4 w-36">Mata Kuliah</th>
                                <th className="px-6 py-4 w-40">Kategori</th>
                                <th className="px-6 py-4 w-40">Dosen</th>
                                <th className="px-6 py-4 w-32">Status</th>
                                <th className="px-6 py-4 w-36">Update</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {soalLoading && <SkeletonTable rows={5} cols={7} />}
                            {!soalLoading && (soalData?.data.length ?? 0) > 0 &&
                                soalData!.data.map((s, idx) => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {(soalPage - 1) * soalPerPage + idx + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900 line-clamp-1">{s.judul}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {s.mata_kuliah_nama ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {s.kategori_nama ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {s.dosen_nama ?? '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={s.status as any} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {s.updated_at ? formatDate(s.updated_at) : '—'}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {!soalLoading && (!soalData || soalData.data.length === 0) && <EmptyState />}

                {soalData?.meta && (
                    <div className="border-t border-gray-200 px-6 py-4">
                        <Pagination
                            meta={soalData.meta}
                            onPageChange={(p) => setSoalPage(p)}
                            onPerPageChange={() => {}}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
