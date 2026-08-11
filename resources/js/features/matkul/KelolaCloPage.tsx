import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, ChevronRight, ChevronsRight, ChevronLeft, ChevronsLeft,
    Search, Layers, Check, Loader2, Save, X
} from 'lucide-react';
import api from '@/shared/lib/api';
import { useToast } from '@/shared/hooks/useToast';
import { PageHeader } from '@/shared/components/ui/PageHeader';

interface Course {
    id: number;
    kode_mk: string;
    nama_mk: string;
    semester: number | null;
    sks: number | null;
}

interface CloItem {
    id: number;
    kode: string;
    deskripsi: string;
    mata_kuliah_id?: number | null;
    plo?: {
        id: number;
        kode: string;
    } | null;
}

export function KelolaCloPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Left pool (available) & Right pool (selected for this course)
    const [available, setAvailable] = useState<CloItem[]>([]);
    const [selected, setSelected]   = useState<CloItem[]>([]);

    // Selection states within left/right lists for manual transfer (using clicks)
    const [leftSelectedIds, setLeftSelectedIds]   = useState<Set<number>>(new Set());
    const [rightSelectedIds, setRightSelectedIds] = useState<Set<number>>(new Set());

    // Search queries for both panels
    const [leftSearch, setLeftSearch]   = useState('');
    const [rightSearch, setRightSearch] = useState('');
    const [saving, setSaving]           = useState(false);

    /* Fetch course detail */
    const { data: course, isLoading: loadingCourse } = useQuery<Course>({
        queryKey: ['course', id],
        queryFn: async () => {
            const res = await api.get(`/courses/${id}`);
            return res.data.data;
        },
        enabled: !!id,
    });

    /* Fetch all CLOs */
    const { data: allClos = [], isLoading: loadingClos } = useQuery<CloItem[]>({
        queryKey: ['clo-transfer', id],
        queryFn: async () => {
            const res = await api.get(`/courses/${id}/clo`);
            return res.data.data;
        },
        enabled: !!id,
    });

    // Populate left and right lists on initial load or when allClos changes
    useEffect(() => {
        if (allClos.length > 0 && id) {
            const courseIdNum = Number(id);
            const inRight = allClos.filter((c) => c.mata_kuliah_id === courseIdNum);
            const inLeft  = allClos.filter((c) => c.mata_kuliah_id !== courseIdNum);
            setSelected(inRight);
            setAvailable(inLeft);
        }
    }, [allClos, id]);

    /* Toggle select item in Left panel */
    const toggleLeftSelect = (cloId: number) => {
        setLeftSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(cloId)) next.delete(cloId);
            else next.add(cloId);
            return next;
        });
    };

    /* Toggle select item in Right panel */
    const toggleRightSelect = (cloId: number) => {
        setRightSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(cloId)) next.delete(cloId);
            else next.add(cloId);
            return next;
        });
    };

    /* Transfer selected from Left -> Right ( > ) */
    const moveRight = () => {
        if (leftSelectedIds.size === 0) return;
        const toMove = available.filter((c) => leftSelectedIds.has(c.id));
        const remaining = available.filter((c) => !leftSelectedIds.has(c.id));
        setAvailable(remaining);
        setSelected((prev) => [...prev, ...toMove]);
        setLeftSelectedIds(new Set());
    };

    /* Transfer ALL from Left -> Right ( >> ) */
    const moveAllRight = () => {
        if (available.length === 0) return;
        setSelected((prev) => [...prev, ...available]);
        setAvailable([]);
        setLeftSelectedIds(new Set());
    };

    /* Transfer selected from Right -> Left ( < ) */
    const moveLeft = () => {
        if (rightSelectedIds.size === 0) return;
        const toMove = selected.filter((c) => rightSelectedIds.has(c.id));
        const remaining = selected.filter((c) => !rightSelectedIds.has(c.id));
        setSelected(remaining);
        setAvailable((prev) => [...prev, ...toMove]);
        setRightSelectedIds(new Set());
    };

    /* Transfer ALL from Right -> Left ( << ) */
    const moveAllLeft = () => {
        if (selected.length === 0) return;
        setAvailable((prev) => [...prev, ...selected]);
        setSelected([]);
        setRightSelectedIds(new Set());
    };

    /* Save changes */
    const handleSave = async () => {
        setSaving(true);
        try {
            const cloIds = selected.map((c) => c.id);
            await api.post(`/courses/${id}/clo`, { clo_ids: cloIds });
            toast.success('Relasi CLO dengan Mata Kuliah berhasil disimpan.');
            queryClient.invalidateQueries({ queryKey: ['course', id] });
            queryClient.invalidateQueries({ queryKey: ['clo', 'by-course', id] });
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            navigate(`/matkul/${id}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan relasi CLO.');
        } finally {
            setSaving(false);
        }
    };

    // Filtered lists for rendering
    const filteredAvailable = available.filter((c) => {
        const q = leftSearch.toLowerCase();
        return c.kode.toLowerCase().includes(q) || c.deskripsi.toLowerCase().includes(q);
    });

    const filteredSelected = selected.filter((c) => {
        const q = rightSearch.toLowerCase();
        return c.kode.toLowerCase().includes(q) || c.deskripsi.toLowerCase().includes(q);
    });

    if (loadingCourse || loadingClos) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader title="Kelola CLO" breadcrumb={[{ label: 'Mata Kuliah', href: '/matkul' }, { label: 'Kelola CLO' }]} />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title="Kelola CLO"
                    description={`Atur daftar CLO yang digunakan oleh mata kuliah ${course?.nama_mk ?? ''}.`}
                    breadcrumb={[
                        { label: 'Mata Kuliah', href: '/matkul' },
                        { label: course?.kode_mk ?? 'Detail', href: `/matkul/${id}` },
                        { label: 'Kelola CLO' },
                    ]}
                />
                <button
                    onClick={() => navigate(`/matkul/${id}`)}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition shrink-0 mt-1"
                >
                    <ArrowLeft size={15} />
                    Kembali
                </button>
            </div>

            {/* Course Summary Banner */}
            {course && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-xl bg-[var(--color-primary-light)] border border-[var(--color-primary-light)] flex items-center justify-center font-bold text-[var(--color-primary)] font-mono text-xs shrink-0 whitespace-nowrap">
                            {course.kode_mk}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-sm">{course.nama_mk}</h3>
                            <p className="text-xs text-gray-400">Semester {course.semester ?? '—'} • {course.sks ?? 3} SKS</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {selected.length} CLO Terpilih
                        </span>
                    </div>
                </div>
            )}

            {/* Transfer List Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Panel Kiri: Daftar Seluruh CLO (Tersedia) */}
                <div className="lg:col-span-5 flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Semua CLO</h4>
                            <p className="text-[11px] text-gray-400">{available.length} CLO tersedia</p>
                        </div>
                        {leftSelectedIds.size > 0 && (
                            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
                                {leftSelectedIds.size} dipilih
                            </span>
                        )}
                    </div>

                    {/* Search bar */}
                    <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-white">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={leftSearch}
                            onChange={(e) => setLeftSearch(e.target.value)}
                            placeholder="Cari CLO..."
                            className="w-full text-xs text-gray-700 placeholder-gray-400 bg-transparent outline-none"
                        />
                        {leftSearch && (
                            <button onClick={() => setLeftSearch('')} className="text-gray-400 hover:text-gray-600">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="flex-1 max-h-[400px] overflow-y-auto divide-y divide-gray-100 p-2">
                        {filteredAvailable.length === 0 && (
                            <div className="py-12 text-center text-xs text-gray-400">
                                {leftSearch ? 'Tidak ada CLO yang cocok' : 'Semua CLO sudah terpilih'}
                            </div>
                        )}
                        {filteredAvailable.map((clo) => {
                            const isSelected = leftSelectedIds.has(clo.id);
                            return (
                                <div
                                    key={clo.id}
                                    onClick={() => toggleLeftSelect(clo.id)}
                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                                        isSelected ? 'bg-[var(--color-primary-light)]/60 border border-[var(--color-primary)]/30' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="mt-0.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-xs text-gray-800 font-mono">{clo.kode}</span>
                                            {clo.plo && (
                                                <>
                                                    <span className="text-gray-300 text-[10px]">→</span>
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-blue-600 border border-blue-100">
                                                        {clo.plo.kode}
                                                    </span>
                                                </>
                                            )}
                                            {clo.mata_kuliah_id && (
                                                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                                    Digunakan di MK lain
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2">{clo.deskripsi}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Panel Tengah: Tombol Transfer Action */}
                <div className="lg:col-span-2 flex flex-row lg:flex-col items-center justify-center gap-2 p-2">
                    <button
                        onClick={moveRight}
                        disabled={leftSelectedIds.size === 0}
                        title="Pindahkan Terpilih ke Kanan"
                        className="flex-1 lg:flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white transition shadow-sm disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-200 cursor-pointer"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <button
                        onClick={moveAllRight}
                        disabled={available.length === 0}
                        title="Pindahkan Semua ke Kanan"
                        className="flex-1 lg:flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white transition shadow-sm disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-200 cursor-pointer"
                    >
                        <ChevronsRight size={18} />
                    </button>
                    <button
                        onClick={moveLeft}
                        disabled={rightSelectedIds.size === 0}
                        title="Kembalikan Terpilih ke Kiri"
                        className="flex-1 lg:flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-red-500 hover:border-red-500 hover:text-white transition shadow-sm disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-200 cursor-pointer"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={moveAllLeft}
                        disabled={selected.length === 0}
                        title="Kembalikan Semua ke Kiri"
                        className="flex-1 lg:flex-none flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-red-500 hover:border-red-500 hover:text-white transition shadow-sm disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-200 cursor-pointer"
                    >
                        <ChevronsLeft size={18} />
                    </button>
                </div>

                {/* Panel Kanan: CLO Dipilih untuk Mata Kuliah */}
                <div className="lg:col-span-5 flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-5 py-4 bg-[var(--color-primary-light)]/40 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-[var(--color-primary)] text-xs uppercase tracking-wider">CLO Mata Kuliah Ini</h4>
                            <p className="text-[11px] text-gray-500">{selected.length} CLO dialokasikan</p>
                        </div>
                        {rightSelectedIds.size > 0 && (
                            <span className="rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]">
                                {rightSelectedIds.size} dipilih
                            </span>
                        )}
                    </div>

                    {/* Search bar */}
                    <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-white">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={rightSearch}
                            onChange={(e) => setRightSearch(e.target.value)}
                            placeholder="Cari CLO terpilih..."
                            className="w-full text-xs text-gray-700 placeholder-gray-400 bg-transparent outline-none"
                        />
                        {rightSearch && (
                            <button onClick={() => setRightSearch('')} className="text-gray-400 hover:text-gray-600">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="flex-1 max-h-[400px] overflow-y-auto divide-y divide-gray-100 p-2">
                        {filteredSelected.length === 0 && (
                            <div className="py-12 text-center text-xs text-gray-400">
                                {rightSearch ? 'Tidak ada CLO yang cocok' : 'Belum ada CLO yang dipilih'}
                            </div>
                        )}
                        {filteredSelected.map((clo) => {
                            const isSelected = rightSelectedIds.has(clo.id);
                            return (
                                <div
                                    key={clo.id}
                                    onClick={() => toggleRightSelect(clo.id)}
                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${
                                        isSelected ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        className="mt-0.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-xs text-[var(--color-primary)] font-mono block">{clo.kode}</span>
                                            {clo.plo && (
                                                <>
                                                    <span className="text-gray-300 text-[10px]">→</span>
                                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-blue-600 border border-blue-100">
                                                        {clo.plo.kode}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2">{clo.deskripsi}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <button
                    onClick={() => navigate(`/matkul/${id}`)}
                    className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                    Batal
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] transition disabled:opacity-60 shadow-sm cursor-pointer"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Simpan Relasi CLO
                </button>
            </div>
        </div>
    );
}
