import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, BookMarked, Layers, GraduationCap, Settings2,
} from 'lucide-react';
import api from '@/shared/lib/api';
import { PageHeader } from '@/shared/components/ui/PageHeader';

/* ── Types ─────────────────────────────────────────────────── */

interface Course {
    id: number;
    kode_mk: string;
    nama_mk: string;
    semester: number | null;
    sks: number | null;
    kategori: string | null;
    clo_count: number;
}

interface Clo {
    id: number;
    kode: string;
    deskripsi: string;
    mata_kuliah_id?: number | null;
    plo?: {
        id: number;
        kode: string;
    } | null;
}

/* ── Helper: Badge ──────────────────────────────────────────── */

function InfoBadge({ label, value, color = 'gray' }: { label: string; value: string | number; color?: string }) {
    const colors: Record<string, string> = {
        gray: 'bg-gray-50 border-gray-200 text-gray-700',
        primary: 'bg-[var(--color-primary-light)] border-[var(--color-primary-light)] text-[var(--color-primary)]',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        violet: 'bg-violet-50 border-violet-200 text-violet-700',
    };
    return (
        <div className={`flex flex-col items-center justify-center rounded-xl border px-6 py-4 text-center ${colors[color]}`}>
            <span className="text-xs font-medium opacity-70 mb-1">{label}</span>
            <span className="text-lg font-bold">{value}</span>
        </div>
    );
}

/* ── Main Detail Page ────────────────────────────────────────── */

export function MatkulDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    /* Fetch course detail */
    const { data: course, isLoading: loadingCourse } = useQuery<Course>({
        queryKey: ['course', id],
        queryFn: async () => {
            const res = await api.get(`/courses/${id}`);
            return res.data.data;
        },
        enabled: !!id,
    });

    /* Fetch CLOs for this course */
    const { data: clos = [], isLoading: loadingClo } = useQuery<Clo[]>({
        queryKey: ['clo', 'by-course', id],
        queryFn: async () => {
            const res = await api.get('/clo', { params: { dropdown: 1, mata_kuliah_id: id } });
            return res.data.data;
        },
        enabled: !!id,
    });

    if (loadingCourse) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader title="Detail Mata Kuliah" breadcrumb={[{ label: 'Mata Kuliah', href: '/matkul' }, { label: 'Detail' }]} />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
                    <div className="animate-pulse h-24 bg-gray-100 rounded-lg" />
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader title="Detail Mata Kuliah" breadcrumb={[{ label: 'Mata Kuliah', href: '/matkul' }, { label: 'Detail' }]} />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-12 text-center text-gray-400">
                    Mata kuliah tidak ditemukan.
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title={course.nama_mk}
                    description={`Detail dan daftar Capaian Pembelajaran Mata Kuliah (CLO)`}
                    breadcrumb={[
                        { label: 'Mata Kuliah', href: '/matkul' },
                        { label: 'Detail' },
                    ]}
                />
                <div className="flex items-center gap-2 mt-1 shrink-0">
                    <button
                        onClick={() => navigate(`/matkul/${id}/kelola-clo`)}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                    >
                        <Settings2 size={15} />
                        Kelola CLO
                    </button>
                    <button
                        onClick={() => navigate('/matkul')}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                    >
                        <ArrowLeft size={15} />
                        Kembali
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
                        <BookMarked size={18} className="text-[var(--color-primary)]" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Kode Mata Kuliah</p>
                        <p className="font-bold text-gray-800 font-mono">{course.kode_mk}</p>
                    </div>
                    <div className="ml-6">
                        <p className="text-xs text-gray-400 font-medium">Nama Mata Kuliah</p>
                        <p className="font-bold text-gray-800">{course.nama_mk}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
                    <InfoBadge label="Semester" value={course.semester ?? '—'} color="gray" />
                    <InfoBadge label="SKS" value={course.sks ?? '—'} color="emerald" />
                    <InfoBadge label="Kategori" value={course.kategori ?? 'wajib'} color="gray" />
                    <InfoBadge label="Jumlah CLO" value={course.clo_count ?? 0} color="primary" />
                </div>
            </div>

            {/* CLO Section */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* CLO Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <GraduationCap size={18} className="text-[var(--color-primary)]" />
                        <div>
                            <h2 className="font-bold text-gray-800 text-sm">Capaian Pembelajaran Mata Kuliah (CLO)</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{clos.length} CLO terdaftar</p>
                        </div>
                    </div>
                </div>

                {/* CLO List */}
                <div className="divide-y divide-gray-100">
                    {loadingClo && (
                        <div className="p-6">
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    )}

                    {!loadingClo && clos.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Layers size={22} className="text-gray-300" />
                            </div>
                            <p className="text-sm font-semibold text-gray-500">Belum ada CLO</p>
                            <p className="text-xs text-gray-400 mt-1">Gunakan tombol "Kelola CLO" untuk memilih atau mengaitkan capaian pembelajaran.</p>
                        </div>
                    )}

                    {!loadingClo && clos.map((clo, idx) => (
                        <div
                            key={clo.id}
                            className="flex items-start gap-4 px-6 py-5 hover:bg-gray-50/50 group transition"
                        >
                            {/* Number bubble */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                                {idx + 1}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-gray-600">
                                        {clo.kode}
                                    </span>
                                    {clo.plo && (
                                        <>
                                            <span className="text-gray-300 text-[10px]">→</span>
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-mono font-semibold text-blue-600 border border-blue-100">
                                                {clo.plo.kode}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{clo.deskripsi}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer info */}
                {!loadingClo && clos.length > 0 && (
                    <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-xs text-gray-400">
                            Menampilkan {clos.length} CLO untuk mata kuliah ini.{' '}
                            <button
                                onClick={() => navigate(`/matkul/${id}/kelola-clo`)}
                                className="text-[var(--color-primary)] font-semibold hover:underline"
                            >
                                Kelola relasi CLO →
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
