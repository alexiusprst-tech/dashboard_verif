import { useState, useEffect } from 'react';
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
import { useToast } from '@/shared/hooks/useToast';
import { useAuth } from '@/shared/hooks/useAuth';
import api from '@/shared/lib/api';

import type { Plo, Clo, ProgramStudi, MataKuliah } from './types/plo.types';
import { usePloList, useCreatePlo, useUpdatePlo, useDeletePlo } from './hooks/usePlo';
import { useCloList, useCreateClo, useUpdateClo, useDeleteClo } from './hooks/useClo';
import { exportPlo } from './api/ploApi';
import { exportClo } from './api/cloApi';
import { downloadTemplate } from './api/curriculumApi';
import { PloModal } from './components/PloModal';
import { CloModal } from './components/CloModal';
import { PloUploadWizard } from './components/PloUploadWizard';
import { CloUploadWizard } from './components/CloUploadWizard';

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

    // Pagination states
    const [ploPage, setPloPage] = useState(1);
    const [ploPerPage, setPloPerPage] = useState(10);
    const [cloPage, setCloPage] = useState(1);
    const [cloPerPage, setCloPerPage] = useState(10);

    // Helpers list
    const [prodiList, setProdiList]     = useState<ProgramStudi[]>([]);
    const [courseList, setCourseList]   = useState<MataKuliah[]>([]);
    const queryClient = useQueryClient();

    // Modal states
    const [ploModalOpen, setPloModalOpen] = useState(false);
    const [currentPlo, setCurrentPlo] = useState<Plo | null>(null);
    const [cloModalOpen, setCloModalOpen] = useState(false);
    const [currentClo, setCurrentClo] = useState<Clo | null>(null);
    const [viewClo, setViewClo] = useState<Clo | null>(null);

    // Confirm delete states
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'plo' | 'clo'; id: number } | null>(null);

    // PLO Upload Wizard
    const [ploUploadWizardOpen, setPloUploadWizardOpen] = useState(false);

    // CLO Upload Wizard
    const [cloUploadWizardOpen, setCloUploadWizardOpen] = useState(false);

    // Fetch Program Studi & Courses
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
    }, [user]);

    // Load PLO list for CLO dropdown — semua PLO prodi tampil
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
                mata_kuliah_ids: data.mata_kuliah_ids || [],
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
            queryClient.invalidateQueries({ queryKey: ['clo'] });
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
                        {/* PLO Tab actions */}
                        {canManagePloClo && activeTab === 'plo' && (
                            <button
                                onClick={() => setPloUploadWizardOpen(true)}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 cursor-pointer"
                            >
                                <Upload size={16} />
                                Upload PLO
                            </button>
                        )}

                        {/* CLO Tab actions: wizard */}
                        {canManagePloClo && activeTab === 'clo' && (
                            <button
                                onClick={() => setCloUploadWizardOpen(true)}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 cursor-pointer"
                            >
                                <Upload size={16} />
                                Upload CLO & Mapping
                            </button>
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
                                                    onClick={() => setViewClo(r)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition cursor-pointer"
                                                    title="Lihat Mata Kuliah"
                                                >
                                                    <Eye size={15} />
                                                </button>
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
                loading={createPloMutation.isPending || updatePloMutation.isPending}
            />

            <CloModal
                open={cloModalOpen}
                onClose={() => setCloModalOpen(false)}
                onSubmit={handleSaveClo}
                clo={currentClo}
                ploList={allPloForSelect}
                mataKuliahList={courseList}
                loading={createCloMutation.isPending || updateCloMutation.isPending}
            />

            {/* CLO Detail Modal — Mata Kuliah Terkait */}
            {(() => {
                const activeViewClo = viewClo ? (cloResponse?.data.find((c) => c.id === viewClo.id) ?? viewClo) : null;
                if (!activeViewClo) return null;

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewClo(null)} />
                        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
                            {/* Header */}
                            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                        <Layers size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{activeViewClo.kode}</p>
                                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-2 max-w-[260px]">{activeViewClo.deskripsi}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewClo(null)}
                                    className="ml-3 flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                            </div>

                            {/* PLO badge */}
                            {activeViewClo.plo && (
                                <div className="px-5 pt-4 pb-0 flex items-center gap-2">
                                    <span className="text-xs font-semibold text-gray-500">PLO Induk:</span>
                                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-mono font-bold text-blue-700">
                                        <GraduationCap size={11} />
                                        {activeViewClo.plo.kode}
                                    </span>
                                </div>
                            )}

                            {/* Mata Kuliah list */}
                            <div className="px-5 py-4">
                                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Mata Kuliah Terkait
                                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-gray-500 font-semibold">
                                        {(activeViewClo.courses?.length ?? activeViewClo.courses_count) || 0}
                                    </span>
                                </p>

                                {activeViewClo.courses && activeViewClo.courses.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {activeViewClo.courses.map((mk) => (
                                            <div key={mk.id}
                                                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 hover:border-green-300 hover:bg-green-50 transition">
                                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                                    <Calendar size={14} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-gray-800">{mk.nama_mk}</p>
                                                    <p className="font-mono text-[10px] text-gray-400">{mk.kode_mk}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center">
                                        <Calendar size={28} className="text-gray-300" />
                                        <p className="text-sm font-semibold text-gray-400">Belum ada mata kuliah</p>
                                        <p className="text-xs text-gray-300">Tambahkan lewat tombol Edit CLO</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end border-t border-gray-100 px-5 py-3">
                                <button onClick={() => { setViewClo(null); handleOpenEditClo(activeViewClo); }}
                                    className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-dark)] transition">
                                    <Edit2 size={12} /> Edit CLO
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* PLO Upload Wizard */}
            <PloUploadWizard
                open={ploUploadWizardOpen}
                onClose={() => setPloUploadWizardOpen(false)}
                onSuccess={() => {
                    refetchPlo();
                    queryClient.invalidateQueries({ queryKey: ['plo-dropdown-all'] });
                }}
            />

            {/* CLO Upload Wizard */}
            <CloUploadWizard
                open={cloUploadWizardOpen}
                onClose={() => setCloUploadWizardOpen(false)}
                onSuccess={() => {
                    refetchClo();
                    queryClient.invalidateQueries({ queryKey: ['plo-dropdown-all'] });
                }}
            />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deletePloMutation.isPending || deleteCloMutation.isPending}
            />
        </div>
    );
}
