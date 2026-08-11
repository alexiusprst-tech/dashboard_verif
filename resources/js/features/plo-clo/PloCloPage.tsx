import { useState, useEffect, type ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Upload, Eye, Edit2, MinusCircle, Calendar, Layers, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { Modal } from '@/shared/components/ui/Modal';
import { useToast } from '@/shared/hooks/useToast';
import { useAuth } from '@/shared/hooks/useAuth';
import api from '@/shared/lib/api';

import type { Plo, Clo, ProgramStudi, MataKuliah } from './types/plo.types';
import { usePloList, useCreatePlo, useUpdatePlo, useDeletePlo } from './hooks/usePlo';
import { useCloList, useCreateClo, useUpdateClo, useDeleteClo } from './hooks/useClo';
import { previewImportPlo, importPlo, exportPlo } from './api/ploApi';
import { previewImportClo, importClo, exportClo } from './api/cloApi';
import { downloadTemplate } from './api/curriculumApi';
import { PloModal } from './components/PloModal';
import { CloModal } from './components/CloModal';

export function PloCloPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'plo' | 'clo'>('plo');

    // Filter states
    const [search, setSearch]                   = useState('');
    const [prodiId, setProdiId]                 = useState<string>('');
    const [selectedPloFilter, setSelectedPloFilter] = useState<string>('');
    const [selectedMataKuliahFilter, setSelectedMataKuliahFilter] = useState<string>('');
    const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>('');

    // Pagination states
    const [ploPage, setPloPage] = useState(1);
    const [ploPerPage, setPloPerPage] = useState(10);
    const [cloPage, setCloPage] = useState(1);
    const [cloPerPage, setCloPerPage] = useState(10);

    // Helpers list
    const [prodiList, setProdiList]     = useState<ProgramStudi[]>([]);
    const [courseList, setCourseList]   = useState<MataKuliah[]>([]);
    const [periodeList, setPeriodeList] = useState<any[]>([]);
    const queryClient = useQueryClient();

    // Modal states
    const [ploModalOpen, setPloModalOpen] = useState(false);
    const [currentPlo, setCurrentPlo] = useState<Plo | null>(null);
    const [cloModalOpen, setCloModalOpen] = useState(false);
    const [currentClo, setCurrentClo] = useState<Clo | null>(null);

    // Confirm delete states
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'plo' | 'clo'; id: number } | null>(null);
    const [importPreviewOpen, setImportPreviewOpen] = useState(false);
    const [importPreviewLoading, setImportPreviewLoading] = useState(false);
    const [importProcessing, setImportProcessing] = useState(false);
    const [importPreviewResult, setImportPreviewResult] = useState<import('./types/plo.types').ImportPreviewResult<import('./types/plo.types').PloImportPreviewRow> | import('./types/plo.types').ImportPreviewResult<import('./types/plo.types').CloImportPreviewRow> | null>(null);
    const [currentImportFile, setCurrentImportFile] = useState<File | null>(null);
    const [currentImportType, setCurrentImportType] = useState<'plo' | 'clo'>('plo');
    const [importSheetName, setImportSheetName] = useState<string>('');

    // Fetch Program Studi, Courses & Periodes
    useEffect(() => {
        api.get('/program-studi').then((res) => {
            setProdiList(res.data.data);
            if (user?.prodi_id || user?.program_studi_id) {
                setProdiId(String(user?.prodi_id || user?.program_studi_id));
            } else if (res.data.data.length > 0) {
                setProdiId(String(res.data.data[0].id));
            }
        });

        api.get('/courses').then((res) => {
            setCourseList(res.data.data);
        });

        api.get('/periode', { params: { per_page: 50 } }).then((res) => {
            setPeriodeList(res.data.data);
            const active = res.data.data.find((p: any) => p.status === 'aktif');
            if (active) setSelectedPeriodeId(String(active.id));
            else if (res.data.data.length > 0) setSelectedPeriodeId(String(res.data.data[0].id));
        });
    }, [user]);

    // Load PLO list for CLO dropdown — tanpa filter periode agar semua PLO prodi tampil
    const { data: allPloForSelect = [] } = useQuery<Plo[]>({
        queryKey: ['plo-dropdown-all', prodiId],
        queryFn: async () => {
            const res = await api.get('/plo', { params: { prodi_id: prodiId, per_page: 200 } });
            return res.data.data;
        },
        enabled: !!prodiId,
        staleTime: 0, // selalu fetch ulang saat invalidate
    });

    // TanStack queries
    const {
        data: ploResponse,
        isLoading: ploLoading,
        refetch: refetchPlo,
    } = usePloList({
        prodi_id:       prodiId,
        periode_id:     selectedPeriodeId,
        page:           ploPage,
        per_page:       ploPerPage,
        search,
    });

    const {
        data: cloResponse,
        isLoading: cloLoading,
        refetch: refetchClo,
    } = useCloList({
        plo_id:         selectedPloFilter,
        mata_kuliah_id: selectedMataKuliahFilter,
        periode_id:     selectedPeriodeId,
        page:           cloPage,
        per_page:       cloPerPage,
        search,
    });

    // Mutations
    const createPloMutation = useCreatePlo();
    const updatePloMutation = useUpdatePlo();
    const deletePloMutation = useDeletePlo();

    const createCloMutation = useCreateClo();
    const updateCloMutation = useUpdateClo();
    const deleteCloMutation = useDeleteClo();

    // Reset filter helper
    const canManagePloClo = Boolean(user?.is_super_admin || user?.is_koordinator_mk || user?.is_coordinator);

    const handleResetFilter = () => {
        setSearch('');
        setSelectedPloFilter('');
        setSelectedMataKuliahFilter('');
        setPloPage(1);
        setCloPage(1);
    };

    // Open Add/Edit Modals
    const handleOpenAddPlo = () => { setCurrentPlo(null); setPloModalOpen(true); };
    const handleOpenEditPlo = (plo: Plo) => { setCurrentPlo(plo); setPloModalOpen(true); };
    const handleOpenAddClo = () => { setCurrentClo(null); setCloModalOpen(true); };
    const handleOpenEditClo = (clo: Clo) => { setCurrentClo(clo); setCloModalOpen(true); };

    // Save PLO Handler
    const handleSavePlo = async (data: any) => {
        try {
            const payload = {
                ...data,
                prodi_id: Number(data.prodi_id || prodiId),
                periode_id: data.periode_id ? Number(data.periode_id) : null,
            };
            if (currentPlo) {
                await updatePloMutation.mutateAsync({ id: currentPlo.id, payload });
                toast.success('PLO berhasil diperbarui');
            } else {
                await createPloMutation.mutateAsync(payload);
                toast.success('PLO berhasil ditambahkan');
            }
            setPloModalOpen(false);
            refetchPlo();
            // Refresh dropdown PLO untuk form CLO di seluruh halaman
            queryClient.invalidateQueries({ queryKey: ['plo-dropdown-all'] });
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menyimpan PLO');
        }
    };

    // Save CLO Handler
    const handleSaveClo = async (data: any) => {
        try {
            const payload = {
                ...data,
                plo_id: Number(data.plo_id),
                periode_id: data.periode_id ? Number(data.periode_id) : null,
            };
            if (currentClo) {
                await updateCloMutation.mutateAsync({ id: currentClo.id, payload });
                toast.success('CLO berhasil diperbarui');
            } else {
                await createCloMutation.mutateAsync(payload);
                toast.success('CLO berhasil ditambahkan');
            }
            setCloModalOpen(false);
            refetchClo();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menyimpan CLO');
        }
    };

    // Delete handlers
    const handleOpenDelete = (type: 'plo' | 'clo', id: number) => {
        setDeleteTarget({ type, id });
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            if (deleteTarget.type === 'plo') {
                await deletePloMutation.mutateAsync(deleteTarget.id);
                toast.success('PLO berhasil dihapus');
                refetchPlo();
            } else {
                await deleteCloMutation.mutateAsync(deleteTarget.id);
                toast.success('CLO berhasil dihapus');
                refetchClo();
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menghapus data');
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
        }
    };
    // Handle import preview and export download
    const handleImportExcel = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCurrentImportFile(file);
        setCurrentImportType(activeTab);
        setImportPreviewLoading(true);
        setImportPreviewOpen(true);

        try {
            const preview = activeTab === 'plo'
                ? await previewImportPlo(file, importSheetName || undefined)
                : await previewImportClo(file, importSheetName || undefined);

            setImportPreviewResult(preview as any);
            toast.success(`Preview import ${activeTab.toUpperCase()} berhasil.`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal memproses file import.');
            setImportPreviewOpen(false);
        } finally {
            setImportPreviewLoading(false);
            e.target.value = '';
        }
    };

    const handleConfirmImport = async () => {
        if (!currentImportFile) return;

        setImportProcessing(true);

        try {
            if (currentImportType === 'plo') {
                await importPlo(currentImportFile, importSheetName || undefined);
                refetchPlo();
            } else {
                await importClo(currentImportFile, importSheetName || undefined);
                refetchClo();
            }

            toast.success(`${currentImportType.toUpperCase()} berhasil diimport.`);
            setImportPreviewOpen(false);
            setImportPreviewResult(null);
            setCurrentImportFile(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal mengimpor file.');
        } finally {
            setImportProcessing(false);
        }
    };

    const downloadBlob = (blob: Blob, name: string) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = name;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };

    const handleExportExcel = async () => {
        try {
            const blob = activeTab === 'plo' ? await exportPlo() : await exportClo();
            const filename = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
            downloadBlob(blob, filename);
            toast.success('File export berhasil diunduh.');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal men-download file export.');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="PLO & CLO"
                description="Kelola Program Learning Outcomes (PLO) dan Course Learning Outcomes (CLO) program studi."
                breadcrumb={[{ label: 'PLO & CLO' }]}
                action={
                    <div className="flex flex-wrap gap-2">
                        {canManagePloClo && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="Sheet name (optional)"
                                    value={importSheetName}
                                    onChange={(e) => setImportSheetName(e.target.value)}
                                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                                />
                                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
                                    <Upload size={16} />
                                    Import Excel
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                        onChange={handleImportExcel}
                                    />
                                </label>
                            </div>
                        )}
                        {canManagePloClo && (
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 cursor-pointer"
                            >
                                <Download size={16} />
                                Export Excel
                            </button>
                        )}
                        {canManagePloClo && (
                            <button
                                onClick={async () => {
                                    try {
                                        const type = activeTab === 'plo' ? 'plos' : 'clos_mapping';
                                        const blob = await downloadTemplate(type);
                                        const filename = `template_${type}.xlsx`;
                                        downloadBlob(blob, filename);
                                        toast.success('Template berhasil diunduh.');
                                    } catch (err: any) {
                                        toast.error(err?.response?.data?.message || 'Gagal mengunduh template.');
                                    }
                                }}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 cursor-pointer"
                            >
                                <Download size={16} />
                                Download Template
                            </button>
                        )}
                        <button
                            onClick={activeTab === 'plo' ? handleOpenAddPlo : handleOpenAddClo}
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] cursor-pointer"
                        >
                            <Plus size={16} />
                            {activeTab === 'plo' ? 'Tambah PLO' : 'Tambah CLO'}
                        </button>
                    </div>
                }
            />

            {/* Tab selector */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => { setActiveTab('plo'); handleResetFilter(); }}
                    className={`border-b-2 px-6 py-3 text-sm font-semibold transition cursor-pointer ${
                        activeTab === 'plo'
                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Program Learning Outcomes (PLO)
                </button>
                <button
                    onClick={() => { setActiveTab('clo'); handleResetFilter(); }}
                    className={`border-b-2 px-6 py-3 text-sm font-semibold transition cursor-pointer ${
                        activeTab === 'clo'
                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Course Learning Outcomes (CLO)
                </button>
            </div>

            {/* Filter & Search Bar */}
            <FilterBar onReset={handleResetFilter}>
                <SearchBar
                    value={search}
                    onChange={(val) => {
                        setSearch(val);
                        if (activeTab === 'plo') setPloPage(1);
                        else setCloPage(1);
                    }}
                    placeholder={activeTab === 'plo' ? 'Cari PLO...' : 'Cari CLO...'}
                    className="w-full sm:w-64"
                />

                <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-gray-400" />
                    <select
                        value={selectedPeriodeId}
                        onChange={(e) => {
                            setSelectedPeriodeId(e.target.value);
                            setPloPage(1);
                            setCloPage(1);
                        }}
                        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        <option value="">Semua Periode</option>
                        {periodeList.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nama_periode}
                            </option>
                        ))}
                    </select>
                </div>

                {activeTab === 'clo' && (
                    <>
                        <select
                            value={selectedMataKuliahFilter}
                            onChange={(e) => {
                                setSelectedMataKuliahFilter(e.target.value);
                                setCloPage(1);
                            }}
                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                        >
                            <option value="">Semua Mata Kuliah</option>
                            {courseList.map((mk) => (
                                <option key={mk.id} value={mk.id}>
                                    {mk.kode_mk} - {mk.nama_mk}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedPloFilter}
                            onChange={(e) => {
                                setSelectedPloFilter(e.target.value);
                                setCloPage(1);
                            }}
                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                        >
                            <option value="">Semua PLO Induk</option>
                            {allPloForSelect.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.kode}
                                </option>
                            ))}
                        </select>
                    </>
                )}
            </FilterBar>

            {/* Table Content */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-gray-600">
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                </th>
                                <th className="px-6 py-4 w-16">No</th>
                                <th className="px-6 py-4 w-32">Kode</th>
                                <th className="px-6 py-4">Deskripsi</th>
                                {activeTab === 'plo' && (
                                    <th className="px-6 py-4 w-36">Jumlah CLO</th>
                                )}
                                {activeTab === 'clo' && (
                                    <>
                                        <th className="px-6 py-4 w-36">PLO Induk</th>
                                        <th className="px-6 py-4 w-48">Mata Kuliah Terkait</th>
                                    </>
                                )}
                                <th className="px-6 py-4 w-44">Created At</th>
                                <th className="px-6 py-4 w-32 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {/* Loading Skeleton */}
                            {((activeTab === 'plo' && ploLoading) || (activeTab === 'clo' && cloLoading)) && (
                                <SkeletonTable rows={5} cols={activeTab === 'plo' ? 7 : 8} />
                            )}

                            {/* PLO Tab Content */}
                            {activeTab === 'plo' && !ploLoading && (ploResponse?.data.length ?? 0) > 0 &&
                                ploResponse?.data.map((r, index) => (
                                    <tr key={r.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {(ploPage - 1) * ploPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => navigate(`/plo/${r.id}`)}
                                                className="font-bold text-[var(--color-primary)] font-mono hover:underline cursor-pointer"
                                            >
                                                {r.kode}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 max-w-md truncate" title={r.deskripsi}>
                                            {r.deskripsi}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-3 py-0.5 text-xs font-bold text-violet-700">
                                                <Layers size={13} />
                                                {r.clo_count ?? 0} CLO
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(r.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => navigate(`/plo/${r.id}`)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition cursor-pointer"
                                                    title="Lihat Detail PLO"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditPlo(r)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition cursor-pointer"
                                                    title="Edit PLO"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDelete('plo', r.id)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-danger)] transition cursor-pointer"
                                                    title="Hapus PLO"
                                                >
                                                    <MinusCircle size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                            {/* CLO Tab Content */}
                            {activeTab === 'clo' && !cloLoading && (cloResponse?.data.length ?? 0) > 0 &&
                                cloResponse?.data.map((r, index) => (
                                    <tr key={r.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {(cloPage - 1) * cloPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 font-bold font-mono text-gray-900">{r.kode}</td>
                                        <td className="px-6 py-4 max-w-sm truncate" title={r.deskripsi}>
                                            {r.deskripsi}
                                        </td>
                                        <td className="px-6 py-4">
                                            {r.plo ? (
                                                <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-700">
                                                    <GraduationCap size={13} />
                                                    {r.plo.kode}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {r.courses && r.courses.length > 0 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                                                    {r.courses.length} Mata Kuliah
                                                </span>
                                            ) : r.courses_count && r.courses_count > 0 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                                                    {r.courses_count} Mata Kuliah
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Belum dialokasikan</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(r.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleOpenEditClo(r)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition cursor-pointer"
                                                    title="Ubah"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDelete('clo', r.id)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-danger)] transition cursor-pointer"
                                                    title="Hapus"
                                                >
                                                    <MinusCircle size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {activeTab === 'plo' && !ploLoading && (ploResponse?.data.length ?? 0) === 0 && (
                    <EmptyState isSearchEmpty={!!search} />
                )}
                {activeTab === 'clo' && !cloLoading && (cloResponse?.data.length ?? 0) === 0 && (
                    <EmptyState isSearchEmpty={!!search} />
                )}

                {/* Pagination footer */}
                {activeTab === 'plo' && ploResponse?.meta && (
                    <div className="border-t border-gray-200 px-6 py-4">
                        <Pagination
                            meta={ploResponse.meta}
                            onPageChange={(page) => setPloPage(page)}
                            onPerPageChange={(perPage) => {
                                setPloPerPage(perPage);
                                setPloPage(1);
                            }}
                        />
                    </div>
                )}
                {activeTab === 'clo' && cloResponse?.meta && (
                    <div className="border-t border-gray-200 px-6 py-4">
                        <Pagination
                            meta={cloResponse.meta}
                            onPageChange={(page) => setCloPage(page)}
                            onPerPageChange={(perPage) => {
                                setCloPerPage(perPage);
                                setCloPage(1);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            <PloModal
                open={ploModalOpen}
                onClose={() => setPloModalOpen(false)}
                onSubmit={handleSavePlo}
                plo={currentPlo}
                programStudiList={prodiList}
                defaultPeriodeId={selectedPeriodeId}
                loading={createPloMutation.isPending || updatePloMutation.isPending}
            />

            <CloModal
                open={cloModalOpen}
                onClose={() => setCloModalOpen(false)}
                onSubmit={handleSaveClo}
                clo={currentClo}
                ploList={allPloForSelect}
                defaultPeriodeId={selectedPeriodeId}
                loading={createCloMutation.isPending || updateCloMutation.isPending}
            />

            <Modal
                open={importPreviewOpen}
                onClose={() => setImportPreviewOpen(false)}
                title={`Preview Import ${currentImportType.toUpperCase()}`}
                description={`Tinjau status validasi sebelum menyimpan ${currentImportType.toUpperCase()} dari file Excel.`}
                size="xl"
                footer={
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={() => setImportPreviewOpen(false)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Tutup
                        </button>
                        <button
                            onClick={handleConfirmImport}
                            disabled={importPreviewLoading || importProcessing || ((importPreviewResult?.invalid ?? 0) > 0)}
                            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {importProcessing ? 'Mengimpor...' : 'Import Sekarang'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {importPreviewLoading ? (
                        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                            Memproses file import...
                        </div>
                    ) : importPreviewResult ? (
                        <>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Total Baris</p>
                                    <p className="mt-2 text-2xl font-semibold text-gray-900">{importPreviewResult.total}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-green-50 p-4">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Valid</p>
                                    <p className="mt-2 text-2xl font-semibold text-green-700">{importPreviewResult.valid}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-red-50 p-4">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Invalid</p>
                                    <p className="mt-2 text-2xl font-semibold text-red-700">{importPreviewResult.invalid}</p>
                                </div>
                            </div>

                            {importPreviewResult.invalid > 0 && (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                    File import memiliki baris yang tidak valid. Perbaiki file terlebih dahulu dan ulangi preview.
                                </div>
                            )}

                            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                                <table className="min-w-full divide-y divide-gray-200 text-left text-sm text-gray-600">
                                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-700">
                                        <tr>
                                            <th className="px-4 py-3">Baris</th>
                                            {currentImportType === 'plo' ? (
                                                <>
                                                    <th className="px-4 py-3">Kode PLO</th>
                                                    <th className="px-4 py-3">Deskripsi</th>
                                                    <th className="px-4 py-3">Kode Prodi</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-4 py-3">Kode MK</th>
                                                    <th className="px-4 py-3">Kode CLO</th>
                                                    <th className="px-4 py-3">Deskripsi</th>
                                                    <th className="px-4 py-3">Kode PLO</th>
                                                </>
                                            )}
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Pesan Error</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {importPreviewResult.rows.slice(0, 20).map((row: any) => (
                                            <tr key={row.row} className={row.status === 'invalid' ? 'bg-red-50' : ''}>
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.row}</td>
                                                {currentImportType === 'plo' ? (
                                                    <>
                                                        <td className="px-4 py-3">{row.kode_plo}</td>
                                                        <td className="px-4 py-3">{row.deskripsi}</td>
                                                        <td className="px-4 py-3">{row.kode_prodi}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-4 py-3">{row.kode_mk}</td>
                                                        <td className="px-4 py-3">{row.kode_clo}</td>
                                                        <td className="px-4 py-3">{row.deskripsi}</td>
                                                        <td className="px-4 py-3">{row.kode_plo}</td>
                                                    </>
                                                )}
                                                <td className="px-4 py-3">
                                                    <span className={row.status === 'valid' ? 'rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700' : 'rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700'}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {row.errors.length > 0 ? row.errors.join(' · ') : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {importPreviewResult.rows.length > 20 && (
                                <p className="text-xs text-gray-500">Menampilkan 20 baris pertama. Jika file lebih besar, pastikan semua baris sudah valid.</p>
                            )}
                        </>
                    ) : (
                        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                            Pilih file Excel untuk melihat preview import.
                        </div>
                    )}
                </div>
            </Modal>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deletePloMutation.isPending || deleteCloMutation.isPending}
            />
        </div>
    );
}
