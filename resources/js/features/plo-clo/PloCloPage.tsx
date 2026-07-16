import { useState, useEffect } from 'react';
import { Plus, Download, Upload, Eye, Edit2, Trash2, Calendar } from 'lucide-react';
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

import type { Plo, Clo, ProgramStudi, MataKuliah, Periode as PloPeriode } from './types/plo.types';
import { usePloList, useCreatePlo, useUpdatePlo, useDeletePlo } from './hooks/usePlo';
import { useCloList, useCreateClo, useUpdateClo, useDeleteClo } from './hooks/useClo';
import { PloModal } from './components/PloModal';
import { CloModal } from './components/CloModal';

export function PloCloPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'plo' | 'clo'>('plo');

    // Filter states
    const [search, setSearch]                   = useState('');
    const [prodiId, setProdiId]                 = useState<string>('');
    const [selectedPloFilter, setSelectedPloFilter] = useState<string>('');
    const [selectedPeriodeId, setSelectedPeriodeId] = useState<string>('');

    // Pagination states
    const [ploPage, setPloPage] = useState(1);
    const [ploPerPage, setPloPerPage] = useState(10);
    const [cloPage, setCloPage] = useState(1);
    const [cloPerPage, setCloPerPage] = useState(10);

    // Helpers list
    const [prodiList, setProdiList]           = useState<ProgramStudi[]>([]);
    const [courseList, setCourseList]         = useState<MataKuliah[]>([]);
    const [allPloForSelect, setAllPloForSelect] = useState<Plo[]>([]);
    const [periodeList, setPeriodeList]       = useState<any[]>([]);

    // Modal states
    const [ploModalOpen, setPloModalOpen] = useState(false);
    const [currentPlo, setCurrentPlo] = useState<Plo | null>(null);
    const [cloModalOpen, setCloModalOpen] = useState(false);
    const [currentClo, setCurrentClo] = useState<Clo | null>(null);

    // Confirm delete states
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'plo' | 'clo'; id: number } | null>(null);

    // Fetch Program Studi, Courses & Periodes
    useEffect(() => {
        api.get('/program-studi').then((res) => {
            setProdiList(res.data.data);
            // Default to user's prodi if available
            if (user?.program_studi_id) {
                setProdiId(String(user.program_studi_id));
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

    // Set prodi_id filter and load PLO list for select dropdown
    useEffect(() => {
        if (prodiId) {
            api.get('/plo', { params: { prodi_id: prodiId, periode_id: selectedPeriodeId, per_page: 100 } }).then((res) => {
                setAllPloForSelect(res.data.data);
            });
        }
    }, [prodiId, selectedPeriodeId]);

    // TanStack queries
    const {
        data: ploResponse,
        isLoading: ploLoading,
        error: ploError,
        refetch: refetchPlo,
    } = usePloList({
        prodi_id:   prodiId,
        periode_id: selectedPeriodeId,
        page:       ploPage,
        per_page:   ploPerPage,
        search,
    });

    const {
        data: cloResponse,
        isLoading: cloLoading,
        error: cloError,
        refetch: refetchClo,
    } = useCloList({
        plo_id:     selectedPloFilter,
        periode_id: selectedPeriodeId,
        page:       cloPage,
        per_page:   cloPerPage,
        search,
    });

    // Mutations
    const createPloMutation = useCreatePlo();
    const updatePloMutation = useUpdatePlo();
    const deletePloMutation = useDeletePlo();

    const createCloMutation = useCreateClo();
    const updateCloMutation = useUpdateClo();
    const deleteCloMutation = useDeleteClo();

    // Reset filters
    const handleResetFilter = () => {
        setSearch('');
        if (user?.program_studi_id) {
            setProdiId(String(user.program_studi_id));
        }
        setSelectedPloFilter('');
        setPloPage(1);
        setCloPage(1);
        // Kembali ke periode aktif
        const active = periodeList.find((p) => p.status === 'aktif');
        if (active) setSelectedPeriodeId(String(active.id));
    };

    // PLO Handlers
    const handleOpenAddPlo = () => {
        setCurrentPlo(null);
        setPloModalOpen(true);
    };

    const handleOpenEditPlo = (plo: Plo) => {
        setCurrentPlo(plo);
        setPloModalOpen(true);
    };

    const handleSavePlo = async (data: any) => {
        try {
            if (currentPlo) {
                await updatePloMutation.mutateAsync({ id: currentPlo.id, payload: data });
                toast.success('PLO berhasil diperbarui');
            } else {
                await createPloMutation.mutateAsync(data);
                toast.success('PLO berhasil ditambahkan');
            }
            setPloModalOpen(false);
            refetchPlo();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menyimpan PLO');
        }
    };

    // CLO Handlers
    const handleOpenAddClo = () => {
        setCurrentClo(null);
        setCloModalOpen(true);
    };

    const handleOpenEditClo = (clo: Clo) => {
        setCurrentClo(clo);
        setCloModalOpen(true);
    };

    const handleSaveClo = async (data: any) => {
        try {
            if (currentClo) {
                await updateCloMutation.mutateAsync({ id: currentClo.id, payload: data });
                toast.success('CLO berhasil diperbarui');
            } else {
                await createCloMutation.mutateAsync(data);
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

    // Export Excel (Mock CSV download)
    const handleExportExcel = () => {
        try {
            let csvContent = "data:text/csv;charset=utf-8,";
            if (activeTab === 'plo') {
                csvContent += "No,Kode PLO,Deskripsi,Program Studi,Tanggal Dibuat\n";
                const rows = ploResponse?.data || [];
                rows.forEach((r, idx) => {
                    csvContent += `"${idx + 1}","${r.kode}","${r.deskripsi.replace(/"/g, '""')}","${r.prodi_name || ''}","${r.created_at}"\n`;
                });
            } else {
                csvContent += "No,Kode CLO,Deskripsi,PLO,Mata Kuliah,Tanggal Dibuat\n";
                const rows = cloResponse?.data || [];
                rows.forEach((r, idx) => {
                    csvContent += `"${idx + 1}","${r.kode}","${r.deskripsi.replace(/"/g, '""')}","${r.plo?.kode || ''}","${r.mata_kuliah?.nama_mk || ''}","${r.created_at}"\n`;
                });
            }
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", activeTab === 'plo' ? "data_plo.csv" : "data_clo.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success('Excel/CSV berhasil diexport');
        } catch (e) {
            toast.error('Gagal mengeksport data');
        }
    };

    // Import Excel (Mock file uploader logic)
    const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        toast.info(`Membaca file ${file.name}...`);
        setTimeout(() => {
            toast.success('Import berhasil! Data simulasi telah diperbarui.');
            if (activeTab === 'plo') refetchPlo();
            else refetchClo();
        }, 1500);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="PLO & CLO"
                description="Kelola Program Learning Outcomes (PLO) dan Course Learning Outcomes (CLO) program studi."
                breadcrumb={[{ label: 'PLO & CLO' }]}
                action={
                    <div className="flex flex-wrap gap-2">
                        {/* Import file button wrapper */}
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50">
                            <Upload size={16} />
                            Import Excel
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={handleImportExcel}
                            />
                        </label>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            <Download size={16} />
                            Export Excel
                        </button>
                        <button
                            onClick={activeTab === 'plo' ? handleOpenAddPlo : handleOpenAddClo}
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
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
                    className={`border-b-2 px-6 py-3 text-sm font-medium transition ${
                        activeTab === 'plo'
                            ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Program Learning Outcomes (PLO)
                </button>
                <button
                    onClick={() => { setActiveTab('clo'); handleResetFilter(); }}
                    className={`border-b-2 px-6 py-3 text-sm font-medium transition ${
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

                {/* Periode filter — untuk semua tab */}
                <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-gray-400" />
                    <select
                        value={selectedPeriodeId}
                        onChange={(e) => {
                            setSelectedPeriodeId(e.target.value);
                            setPloPage(1);
                            setCloPage(1);
                        }}
                        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    >
                        <option value="">Semua Periode</option>
                        {periodeList.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nama_periode}
                            </option>
                        ))}
                    </select>
                </div>

                {activeTab === 'plo' ? (
                    <select
                        value={prodiId}
                        onChange={(e) => {
                            setProdiId(e.target.value);
                            setPloPage(1);
                        }}
                        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    >
                        {prodiList.map((prodi) => (
                            <option key={prodi.id} value={prodi.id}>
                                {prodi.nama_prodi}
                            </option>
                        ))}
                    </select>
                ) : (
                    <select
                        value={selectedPloFilter}
                        onChange={(e) => {
                            setSelectedPloFilter(e.target.value);
                            setCloPage(1);
                        }}
                        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]"
                    >
                        <option value="">Semua PLO</option>
                        {allPloForSelect.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.kode}
                            </option>
                        ))}
                    </select>
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
                                {activeTab === 'plo' ? (
                                    <th className="px-6 py-4 w-48">Program Studi</th>
                                ) : (
                                    <>
                                        <th className="px-6 py-4 w-36">PLO Relasi</th>
                                        <th className="px-6 py-4 w-48">Mata Kuliah</th>
                                    </>
                                )}
                                <th className="px-6 py-4 w-48">Created At</th>
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
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {(ploPage - 1) * ploPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{r.kode}</td>
                                        <td className="px-6 py-4 max-w-md truncate" title={r.deskripsi}>
                                            {r.deskripsi}
                                        </td>
                                        <td className="px-6 py-4">{r.prodi_name ?? prodiList.find(p => p.id === r.prodi_id)?.nama_prodi ?? '—'}</td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(r.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEditPlo(r)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDelete('plo', r.id)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-danger)] transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                            {/* CLO Tab Content */}
                            {activeTab === 'clo' && !cloLoading && (cloResponse?.data.length ?? 0) > 0 &&
                                cloResponse?.data.map((r, index) => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {(cloPage - 1) * cloPerPage + index + 1}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{r.kode}</td>
                                        <td className="px-6 py-4 max-w-sm truncate" title={r.deskripsi}>
                                            {r.deskripsi}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-md bg-[var(--color-info-light)] px-2 py-1 text-xs font-semibold text-[var(--color-info)]">
                                                {r.plo?.kode ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate" title={r.mata_kuliah?.nama_mk}>
                                            {r.mata_kuliah?.kode_mk} - {r.mata_kuliah?.nama_mk}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(r.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenEditClo(r)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDelete('clo', r.id)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-danger)] transition"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
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
                mataKuliahList={courseList}
                defaultPeriodeId={selectedPeriodeId}
                loading={createCloMutation.isPending || updateCloMutation.isPending}
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
