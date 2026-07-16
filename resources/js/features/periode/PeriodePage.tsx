import { useState } from 'react';
import { Plus, Check, Play, Edit2, MinusCircle, Calendar, Clock } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { useToast } from '@/shared/hooks/useToast';
import { formatDate } from '@/shared/lib/utils';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';

import type { Periode } from './types/periode.types';
import {
    usePeriodeList,
    useCreatePeriode,
    useUpdatePeriode,
    useDeletePeriode,
    useActivatePeriode,
} from './hooks/usePeriode';
import { PeriodeModal } from './components/PeriodeModal';

export function PeriodePage() {
    const { toast } = useToast();

    // Filters
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [currentPeriode, setCurrentPeriode] = useState<Periode | null>(null);

    // Confirm Delete
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // API Query
    const {
        data: response,
        isLoading,
        refetch,
    } = usePeriodeList({
        page,
        per_page: perPage,
        search,
    });

    const createMutation = useCreatePeriode();
    const updateMutation = useUpdatePeriode();
    const deleteMutation = useDeletePeriode();
    const activateMutation = useActivatePeriode();

    const handleReset = () => {
        setSearch('');
        setPage(1);
    };

    const handleOpenAdd = () => {
        setCurrentPeriode(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (p: Periode) => {
        setCurrentPeriode(p);
        setModalOpen(true);
    };

    const handleSave = async (data: any) => {
        try {
            if (currentPeriode) {
                await updateMutation.mutateAsync({ id: currentPeriode.id, payload: data });
                toast.success('Periode berhasil diperbarui.');
            } else {
                await createMutation.mutateAsync(data);
                toast.success('Periode baru berhasil ditambahkan.');
            }
            setModalOpen(false);
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menyimpan periode.');
        }
    };

    const handleOpenDelete = (id: number) => {
        setDeleteId(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteMutation.mutateAsync(deleteId);
            toast.success('Periode berhasil dihapus.');
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menghapus periode.');
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const handleActivate = async (id: number) => {
        try {
            await activateMutation.mutateAsync(id);
            toast.success('Periode berhasil diaktifkan.');
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal mengaktifkan periode.');
        }
    };

    // Auto-Close status check
    const isDeadlinePassed = (dateString: string) => {
        return new Date(dateString) < new Date();
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Periode & Deadline"
                description="Kelola periode pelaksanaan ujian, semester, tahun akademik, serta deadline verifikasi soal."
                breadcrumb={[{ label: 'Periode & Deadline' }]}
                action={
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
                    >
                        <Plus size={16} />
                        Tambah Periode
                    </button>
                }
            />

            <FilterBar onReset={handleReset}>
                <SearchBar
                    value={search}
                    onChange={(val) => {
                        setSearch(val);
                        setPage(1);
                    }}
                    placeholder="Cari Periode..."
                    className="w-full sm:w-64"
                />
            </FilterBar>

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
                                <th className="px-6 py-4">Nama Periode</th>
                                <th className="px-6 py-4 w-32">Semester</th>
                                <th className="px-6 py-4 w-40">Tahun Akademik</th>
                                <th className="px-6 py-4 w-36">Status</th>
                                <th className="px-6 py-4 w-52">Tanggal Pelaksanaan</th>
                                <th className="px-6 py-4 w-52">Deadline</th>
                                <th className="px-6 py-4 w-40 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading && <SkeletonTable rows={5} cols={9} />}

                            {!isLoading && (response?.data.length ?? 0) > 0 &&
                                response?.data.map((r, idx) => {
                                    const closed = isDeadlinePassed(r.tanggal_deadline);
                                    // Status styling
                                    let badgeType: 'draft' | 'approved' | 'revisi' = 'draft';
                                    let label = 'Draft';
                                    if (r.status === 'aktif') {
                                        badgeType = 'approved';
                                        label = 'Aktif';
                                    } else if (r.status === 'selesai' || closed) {
                                        badgeType = 'revisi';
                                        label = 'Selesai';
                                    }

                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                {r.nama_periode}
                                            </td>
                                            <td className="px-6 py-4">Semester {r.semester}</td>
                                            <td className="px-6 py-4">{r.tahun_akademik}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                                                        badgeType === 'approved'
                                                            ? 'bg-[var(--color-success-light)] text-[var(--color-success)] border-[var(--color-success)]'
                                                            : badgeType === 'revisi'
                                                            ? 'bg-[var(--color-gray-100)] text-[var(--color-gray-500)] border-[var(--color-gray-300)]'
                                                            : 'bg-[var(--color-warning-light)] text-[var(--color-warning)] border-[var(--color-warning)]'
                                                    }`}
                                                >
                                                    {label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {formatDate(r.tanggal_mulai)}
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">
                                                        {formatDate(r.tanggal_deadline)}
                                                    </span>
                                                    {r.status === 'aktif' && closed && (
                                                        <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[var(--color-danger)]">
                                                            <Clock size={10} /> Auto-Closed
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {r.status !== 'aktif' && (
                                                        <button
                                                            onClick={() => handleActivate(r.id)}
                                                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-success)] transition"
                                                            title="Aktifkan Periode"
                                                        >
                                                            <Play size={15} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenEdit(r)}
                                                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenDelete(r.id)}
                                                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-danger)] transition"
                                                        title="Delete"
                                                    >
                                                        <MinusCircle size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {!isLoading && (response?.data.length ?? 0) === 0 && (
                    <EmptyState isSearchEmpty={!!search} />
                )}

                {response?.meta && (
                    <div className="border-t border-gray-200 px-6 py-4">
                        <Pagination
                            meta={response.meta}
                            onPageChange={(p) => setPage(p)}
                            onPerPageChange={(pp) => {
                                setPerPage(pp);
                                setPage(1);
                            }}
                        />
                    </div>
                )}
            </div>

            <PeriodeModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSave}
                periode={currentPeriode}
                loading={createMutation.isPending || updateMutation.isPending}
            />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
