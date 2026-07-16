import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, UserCheck } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { useToast } from '@/shared/hooks/useToast';
import { formatDate } from '@/shared/lib/utils';
import api from '@/shared/lib/api';

import type { Penugasan } from './types/penugasan.types';
import type { Periode } from '@/features/periode/types/periode.types';
import { usePenugasanList, useCreatePenugasan, useDeletePenugasan } from './hooks/usePenugasan';
import { AssignModal } from './components/AssignModal';

export function PenugasanPicPage() {
    const { toast } = useToast();

    // Periode selection
    const [periodes, setPeriodes]               = useState<Periode[]>([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');

    // Pagination
    const [page, setPage]       = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal
    const [assignModalOpen, setAssignModalOpen] = useState(false);

    // Confirm Delete
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteId, setDeleteId]                   = useState<number | null>(null);

    // Load Periodes on mount
    useEffect(() => {
        api.get('/periode', { params: { per_page: 50 } }).then((res) => {
            setPeriodes(res.data.data);
            const active = res.data.data.find((p: any) => p.status === 'aktif');
            if (active) setSelectedPeriodeId(String(active.id));
            else if (res.data.data.length > 0) setSelectedPeriodeId(String(res.data.data[0].id));
        });
    }, []);

    // Fetch assignments list
    const {
        data: response,
        isLoading,
        refetch,
    } = usePenugasanList({
        periode_id: selectedPeriodeId,
        page,
        per_page: perPage,
    });

    const createMutation = useCreatePenugasan();
    const deleteMutation = useDeletePenugasan();

    const handleReset = () => {
        const active = periodes.find((p) => p.status === 'aktif');
        if (active) setSelectedPeriodeId(String(active.id));
        setPage(1);
    };

    const handleSaveAssignment = async (data: any) => {
        try {
            const res = await createMutation.mutateAsync(data);
            const warning = res.warning;
            toast.success(res.message || 'Role PIC berhasil diberikan.');
            if (warning) toast.warning(warning);
            setAssignModalOpen(false);
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menyimpan penugasan PIC.');
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
            toast.success('Role PIC berhasil dicabut.');
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal mencabut penugasan.');
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Penugasan PIC Verifikator"
                description="Tugaskan Dosen PIC yang bertanggung jawab memverifikasi seluruh soal ujian dalam periode aktif."
                breadcrumb={[{ label: 'Penugasan PIC' }]}
                action={
                    <button
                        onClick={() => setAssignModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
                    >
                        <Plus size={16} />
                        Tugaskan PIC
                    </button>
                }
            />

            <FilterBar onReset={handleReset}>
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase">Periode Akademik:</span>
                </div>
                <select
                    value={selectedPeriodeId}
                    onChange={(e) => {
                        setSelectedPeriodeId(e.target.value);
                        setPage(1);
                    }}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                >
                    {periodes.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.nama_periode}
                        </option>
                    ))}
                </select>
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
                                <th className="px-6 py-4">Dosen PIC</th>
                                <th className="px-6 py-4 w-32 text-center">Role</th>
                                <th className="px-6 py-4 w-48">Ditugaskan Oleh</th>
                                <th className="px-6 py-4 w-48">Tanggal Penugasan</th>
                                <th className="px-6 py-4 w-32 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading && <SkeletonTable rows={5} cols={7} />}

                            {!isLoading && (response?.data.length ?? 0) > 0 &&
                                response?.data.map((r: Penugasan, idx: number) => (
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
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-xs font-bold text-[var(--color-primary)]">
                                                    {r.dosen?.nama_lengkap?.charAt(0).toUpperCase() || 'P'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-800">{r.dosen?.nama_lengkap || '—'}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                        {r.dosen?.kode_dosen || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                                                <UserCheck size={11} />
                                                PIC
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {r.assigned_by_user?.nama_lengkap || 'Super Admin'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {formatDate(r.assigned_at || r.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleOpenDelete(r.id)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-danger)] transition"
                                                    title="Cabut Role PIC"
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

                {!isLoading && (!response || (response?.data.length ?? 0) === 0) && (
                    <EmptyState />
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

            <AssignModal
                open={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                onSubmit={handleSaveAssignment}
                periodes={periodes}
                defaultPeriodeId={selectedPeriodeId}
                loading={createMutation.isPending}
            />

            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deleteMutation.isPending}
                title="Cabut Role PIC"
                message="Apakah Anda yakin ingin mencabut role PIC dari dosen ini? Dosen tidak akan lagi dapat memverifikasi soal di periode ini. Tindakan ini dapat dibatalkan dengan menugaskannya kembali."
                confirmLabel="Cabut"
            />
        </div>
    );
}
