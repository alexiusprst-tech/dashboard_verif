import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Search, X, ChevronDown, ChevronRight, Filter, RotateCcw, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import api from '@/shared/lib/api';

interface Course {
    id: number;
    kode_mk: string;
    nama_mk: string;
    sks: number | null;
    semester: number | null;
    kategori?: 'wajib' | 'pilihan' | string | null;
    clo_count?: number;
    prodi_id: number;
}

const SEMESTER_TOTAL_SKS: Record<number, number> = {
    1: 20, 2: 20, 3: 20, 4: 20, 5: 20, 6: 20, 7: 19, 8: 7,
};

const SEMESTER_LABELS: Record<number, string> = {
    1: 'Semester 1', 2: 'Semester 2', 3: 'Semester 3', 4: 'Semester 4',
    5: 'Semester 5', 6: 'Semester 6', 7: 'Semester 7', 8: 'Semester 8',
};

const SKS_BADGE_COLOR: Record<number, string> = {
    1: 'bg-gray-100 text-gray-600',
    2: 'bg-blue-50 text-blue-600',
    3: 'bg-emerald-50 text-emerald-700',
    4: 'bg-violet-50 text-violet-700',
};

export function MatkulPage() {
    const navigate = useNavigate();
    const [search, setSearch]                 = useState('');
    const [filterSemester, setFilterSemester] = useState<string>('');
    const [filterSks, setFilterSks]           = useState<string>('');
    const [filterKategori, setFilterKategori] = useState<string>('');
    const [collapsed, setCollapsed]           = useState<Set<number>>(new Set());

    const { data: courses = [], isLoading } = useQuery<Course[]>({
        queryKey: ['courses'],
        queryFn: async () => {
            const res = await api.get('/courses');
            return res.data.data;
        },
    });

    const uniqueSks = [...new Set(courses.map((c) => c.sks).filter(Boolean) as number[])]
        .sort((a, b) => a - b);

    const hasActiveFilter = !!search || !!filterSemester || !!filterSks || !!filterKategori;

    const handleReset = () => {
        setSearch('');
        setFilterSemester('');
        setFilterSks('');
        setFilterKategori('');
    };

    const filtered = courses.filter((c) => {
        const q = search.toLowerCase();
        const matchSearch = !q || c.nama_mk.toLowerCase().includes(q) || c.kode_mk.toLowerCase().includes(q);
        const matchSemester = !filterSemester || String(c.semester) === filterSemester;
        const matchSks = !filterSks || String(c.sks) === filterSks;
        const matchKategori = !filterKategori || (c.kategori || 'wajib').toLowerCase() === filterKategori.toLowerCase();
        return matchSearch && matchSemester && matchSks && matchKategori;
    });

    const grouped: Record<number, Course[]> = {};
    const unassigned: Course[] = [];

    filtered.forEach((c) => {
        if (c.semester) {
            if (!grouped[c.semester]) grouped[c.semester] = [];
            grouped[c.semester].push(c);
        } else {
            unassigned.push(c);
        }
    });

    const semesterKeys = Object.keys(grouped).map(Number).sort((a, b) => a - b);

    const toggleCollapse = (sem: number) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(sem)) next.delete(sem);
            else next.add(sem);
            return next;
        });
    };

    const renderCloCount = (count?: number) => {
        if (count === undefined) return <span className="text-xs text-gray-400">—</span>;
        return (
            <span className={`inline-flex items-center justify-center min-w-[28px] h-6 rounded-full text-xs font-bold px-1.5 ${
                count === 0 ? 'bg-gray-100 text-gray-400' : 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
            }`}>
                {count}
            </span>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Daftar Mata Kuliah"
                description="Daftar seluruh mata kuliah program studi Sistem Informasi, dikelompokkan berdasarkan semester dan kategori."
                breadcrumb={[{ label: 'Mata Kuliah' }]}
            />

            {/* Filter Bar */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                    <Search size={16} className="shrink-0 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari kode atau nama mata kuliah…"
                        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-none ring-0"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 transition">
                            <X size={14} />
                        </button>
                    )}
                    <span className="ml-2 shrink-0 rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                        {filtered.length} MK
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-gray-50/50">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase">
                        <Filter size={13} />
                        Filter:
                    </div>

                    <select
                        value={filterSemester}
                        onChange={(e) => setFilterSemester(e.target.value)}
                        className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        <option value="">Semua Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={String(s)}>Semester {s}</option>
                        ))}
                    </select>

                    <select
                        value={filterKategori}
                        onChange={(e) => setFilterKategori(e.target.value)}
                        className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        <option value="">Semua Kategori</option>
                        <option value="wajib">MK Wajib</option>
                        <option value="pilihan">MK Pilihan</option>
                    </select>

                    <select
                        value={filterSks}
                        onChange={(e) => setFilterSks(e.target.value)}
                        className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        <option value="">Semua SKS</option>
                        {uniqueSks.map((s) => (
                            <option key={s} value={String(s)}>{s} SKS</option>
                        ))}
                    </select>

                    {hasActiveFilter && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 h-8 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-medium text-red-500 hover:bg-red-100 transition cursor-pointer"
                        >
                            <RotateCcw size={12} />
                            Reset Filter
                        </button>
                    )}

                    <div className="flex flex-wrap gap-1.5 ml-auto">
                        {filterSemester && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] border border-[var(--color-primary-light)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]">
                                Semester {filterSemester}
                                <button onClick={() => setFilterSemester('')}><X size={10} /></button>
                            </span>
                        )}
                        {filterKategori && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 capitalize">
                                {filterKategori}
                                <button onClick={() => setFilterKategori('')}><X size={10} /></button>
                            </span>
                        )}
                        {filterSks && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                {filterSks} SKS
                                <button onClick={() => setFilterSks('')}><X size={10} /></button>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <tbody><SkeletonTable rows={10} cols={6} /></tbody>
                    </table>
                </div>
            )}

            {!isLoading && filtered.length === 0 && (
                <EmptyState
                    isSearchEmpty={hasActiveFilter}
                    description={hasActiveFilter ? 'Tidak ada mata kuliah yang sesuai dengan filter yang dipilih.' : undefined}
                />
            )}

            {/* Grouped by semester */}
            {!isLoading && semesterKeys.map((sem) => {
                const items = grouped[sem];
                const isCollapsed = collapsed.has(sem);
                const totalSks = SEMESTER_TOTAL_SKS[sem];
                const actualSks = items.reduce((acc, c) => acc + (c.sks ?? 0), 0);

                return (
                    <div key={sem} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <button
                            onClick={() => toggleCollapse(sem)}
                            className="w-full flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[var(--color-primary-light)] to-white hover:from-[var(--color-primary-light)]/60 transition text-left cursor-pointer"
                        >
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-xs font-bold shrink-0">
                                {sem}
                            </span>
                            <div className="flex-1">
                                <span className="font-bold text-gray-800 text-sm">{SEMESTER_LABELS[sem]}</span>
                                <span className="ml-2 text-xs text-gray-400">{items.length} mata kuliah</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="rounded-full bg-white border border-[var(--color-primary-light)] px-3 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                                    {totalSks} SKS
                                </span>
                                {isCollapsed
                                    ? <ChevronRight size={16} className="text-gray-400" />
                                    : <ChevronDown size={16} className="text-gray-400" />
                                }
                            </div>
                        </button>

                        {!isCollapsed && (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm text-gray-600">
                                    <thead className="border-y border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3 w-12">No</th>
                                            <th className="px-6 py-3 w-36">Kode MK</th>
                                            <th className="px-6 py-3">Nama Mata Kuliah</th>
                                            <th className="px-6 py-3 w-28 text-center">Kategori</th>
                                            <th className="px-6 py-3 w-16 text-center">SKS</th>
                                            <th className="px-6 py-3 w-28 text-center">Jumlah CLO</th>
                                            <th className="px-6 py-3 w-20 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {items.map((c, idx) => (
                                            <tr key={c.id} className="hover:bg-gray-50/60">
                                                <td className="px-6 py-3.5 text-gray-400 tabular-nums text-xs">{idx + 1}</td>
                                                <td className="px-6 py-3.5">
                                                    <span className="inline-flex items-center rounded-md bg-[var(--color-primary-light)] px-2.5 py-0.5 text-[11px] font-mono font-semibold text-[var(--color-primary)]">
                                                        {c.kode_mk}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 font-medium text-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        <BookMarked size={12} className="shrink-0 text-gray-300" />
                                                        {c.nama_mk}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                                                            c.kategori === 'pilihan'
                                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        }`}
                                                    >
                                                        {c.kategori || 'wajib'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <span className={`inline-flex items-center justify-center w-8 h-6 rounded-full text-xs font-bold ${SKS_BADGE_COLOR[c.sks ?? 3] ?? 'bg-gray-100 text-gray-500'}`}>
                                                        {c.sks ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    {renderCloCount(c.clo_count)}
                                                </td>
                                                <td className="px-6 py-3.5 text-center">
                                                    <button
                                                        onClick={() => navigate(`/matkul/${c.id}`)}
                                                        title="Lihat Detail"
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:bg-[var(--color-primary-light)] hover:border-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t border-gray-200 bg-gray-50/50">
                                        <tr>
                                            <td colSpan={5} className="px-6 py-2.5 text-xs font-semibold text-gray-500 text-right">
                                                Total SKS Semester {sem}:
                                            </td>
                                            <td colSpan={2} className="px-6 py-2.5 text-left">
                                                <span className="text-sm font-bold text-[var(--color-primary)]">{actualSks}</span>
                                                <span className="text-xs text-gray-400 ml-1">SKS</span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}

            {!isLoading && unassigned.length > 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <span className="font-semibold text-gray-500 text-sm">Tanpa Semester ({unassigned.length})</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm text-gray-600">
                            <tbody className="divide-y divide-gray-100">
                                {unassigned.map((c, idx) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-3.5 text-gray-400 tabular-nums text-xs w-12">{idx + 1}</td>
                                        <td className="px-6 py-3.5 w-36">
                                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-gray-500">
                                                {c.kode_mk}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 font-medium text-gray-700">{c.nama_mk}</td>
                                        <td className="px-6 py-3.5 text-center w-28">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${c.kategori === 'pilihan' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                                {c.kategori || 'wajib'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-center w-16">
                                            <span className="text-xs text-gray-400">{c.sks ?? '—'}</span>
                                        </td>
                                        <td className="px-6 py-3.5 text-center w-20">{renderCloCount(c.clo_count)}</td>
                                        <td className="px-6 py-3.5 text-center w-20">
                                            <button
                                                onClick={() => navigate(`/matkul/${c.id}`)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 hover:bg-[var(--color-primary-light)] hover:border-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
