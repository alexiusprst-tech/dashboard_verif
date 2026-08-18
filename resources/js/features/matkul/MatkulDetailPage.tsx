import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, BookMarked, Layers, GraduationCap, Settings2, Sparkles, CheckCircle2,
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
    plo_id?: number | null;
    plo?: {
        id: number;
        kode: string;
        deskripsi: string;
    } | null;
}

/* ── Helper: Badge ──────────────────────────────────────────── */

function InfoBadge({ label, value, color = 'gray' }: { label: string; value: string | number; color?: string }) {
    const colors: Record<string, string> = {
        gray: 'bg-gray-50 border-gray-200 text-gray-700',
        primary: 'bg-[var(--color-primary-light)] border-[var(--color-primary-light)] text-[var(--color-primary)]',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        violet: 'bg-violet-50 border-violet-200 text-violet-700',
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
    };
    return (
        <div className={`flex flex-col items-center justify-center rounded-xl border px-6 py-4 text-center ${colors[color] || colors.gray}`}>
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

    /* Unique PLOs supported by this course */
    const uniquePlos = useMemo(() => {
        const map = new Map<number, { id: number; kode: string; deskripsi: string; cloCount: number }>();
        clos.forEach((c) => {
            if (c.plo) {
                if (map.has(c.plo.id)) {
                    map.get(c.plo.id)!.cloCount += 1;
                } else {
                    map.set(c.plo.id, {
                        id: c.plo.id,
                        kode: c.plo.kode,
                        deskripsi: c.plo.deskripsi,
                        cloCount: 1,
                    });
                }
            }
        });
        return Array.from(map.values()).sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true }));
    }, [clos]);

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
                    description="Detail dan daftar Capaian Pembelajaran Lulusan (PLO) serta Capaian Pembelajaran Mata Kuliah (CLO)"
                    breadcrumb={[
                        { label: 'Mata Kuliah', href: '/matkul' },
                        { label: 'Detail' },
                    ]}
                />
                <div className="flex items-center gap-2 mt-1 shrink-0">
                    <button
                        onClick={() => navigate(`/matkul/${id}/kelola-clo`)}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition cursor-pointer"
                    >
                        <Settings2 size={15} />
                        Kelola CLO
                    </button>
                    <button
                        onClick={() => navigate('/matkul')}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition cursor-pointer"
                    >
                        <ArrowLeft size={15} />
                        Kembali
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center shrink-0">
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
                    <InfoBadge label="Jumlah CLO" value={clos.length || (course.clo_count ?? 0)} color="primary" />
                </div>

                {/* PLO Summary Section */}
                <div className="border-t border-gray-100 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white px-6 py-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                <GraduationCap size={16} />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
                                    Capaian Pembelajaran Lulusan (PLO) yang Didukung
                                </h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    Mata kuliah ini berkontribusi terhadap pemenuhan <strong>{uniquePlos.length} PLO</strong> program studi.
                                </p>
                            </div>
                        </div>
                    </div>

                    {uniquePlos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {uniquePlos.map((plo) => (
                                <div
                                    key={plo.id}
                                    className="flex items-start gap-3 rounded-xl border border-blue-200/70 bg-white p-3.5 shadow-xs hover:border-blue-300 transition"
                                >
                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-xs font-mono font-bold text-blue-700">
                                            <GraduationCap size={12} />
                                            {plo.kode}
                                        </span>
                                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50/50 rounded px-1.5 py-0.5">
                                            {plo.cloCount} CLO
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-700 leading-relaxed font-normal">
                                            {plo.deskripsi}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white/70 p-4 text-center text-xs text-gray-400">
                            Belum ada PLO yang terhubung melalui CLO mata kuliah ini.
                        </div>
                    )}
                </div>
            </div>

            {/* CLO Section */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* CLO Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Layers size={18} className="text-[var(--color-primary)]" />
                        <div>
                            <h2 className="font-bold text-gray-800 text-sm">Daftar Capaian Pembelajaran Mata Kuliah (CLO)</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{clos.length} CLO terdaftar beserta PLO induk</p>
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
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="inline-flex items-center rounded-md bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-mono font-bold text-gray-800">
                                        {clo.kode}
                                    </span>

                                    {/* PLO Induk Badge */}
                                    {clo.plo ? (
                                        <span
                                            className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-700"
                                            title={`PLO Induk: ${clo.plo.kode} - ${clo.plo.deskripsi}`}
                                        >
                                            <GraduationCap size={13} className="text-blue-600 shrink-0" />
                                            <span>{clo.plo.kode}</span>
                                            <span className="text-[11px] font-normal text-blue-600 max-w-[320px] truncate hidden md:inline">
                                                • {clo.plo.deskripsi}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-400">
                                            Belum terhubung ke PLO
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed font-normal">{clo.deskripsi}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer info */}
                {!loadingClo && clos.length > 0 && (
                    <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Menampilkan {clos.length} CLO untuk mata kuliah ini.
                        </p>
                        <button
                            onClick={() => navigate(`/matkul/${id}/kelola-clo`)}
                            className="text-xs text-[var(--color-primary)] font-semibold hover:underline cursor-pointer"
                        >
                            Kelola relasi CLO →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

