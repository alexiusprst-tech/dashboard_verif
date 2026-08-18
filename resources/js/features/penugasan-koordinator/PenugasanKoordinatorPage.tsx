import { useState, useEffect } from 'react';
import { Plus, MinusCircle, Calendar, GraduationCap, BookOpen, Search, X, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { useToast } from '@/shared/hooks/useToast';
import { formatDate } from '@/shared/lib/utils';
import api from '@/shared/lib/api';

import type { PenugasanKoordinator } from './types/penugasanKoordinator.types';
import type { Periode } from '@/features/periode/types/periode.types';
import {
    usePenugasanKoordinatorList,
    useCreatePenugasanKoordinator,
    useDeletePenugasanKoordinator,
} from './hooks/usePenugasanKoordinator';
import { AssignKoordinatorModal } from './components/AssignKoordinatorModal';

export function PenugasanKoordinatorPage() {
    const { toast } = useToast();

    // Periode selection
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');

    // Search and filter
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal
    const [assignModalOpen, setAssignModalOpen] = useState(false);

    // Confirm Delete
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteTargetName, setDeleteTargetName] = useState<string>('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

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
        isFetching,
        refetch,
    } = usePenugasanKoordinatorList({
        periode_id: selectedPeriodeId,
        q: debouncedSearch,
        page,
        per_page: perPage,
    });

    const createMutation = useCreatePenugasanKoordinator();
    const deleteMutation = useDeletePenugasanKoordinator();

    const handleReset = () => {
        const active = periodes.find((p) => p.status === 'aktif');
        if (active) setSelectedPeriodeId(String(active.id));
        setSearch('');
        setPage(1);
    };

    const handleSaveAssignment = async (data: {
        periode_id: number;
        dosen_ids: number[];
        course_ids: (number | null)[];
    }) => {
        try {
            let successCount = 0;
            let lastRes: any = null;

            for (const dosenId of data.dosen_ids) {
                for (const courseId of data.course_ids) {
                    const res = await createMutation.mutateAsync({
                        periode_id: data.periode_id,
                        dosen_id: dosenId,
                        course_id: courseId ?? null,
                    });
                    successCount++;
                    lastRes = res;
                }
            }

            toast.success(
                data.dosen_ids.length > 1
                    ? `${data.dosen_ids.length} Dosen berhasil ditugaskan sebagai Koordinator MK.`
                    : 'Dosen berhasil ditugaskan sebagai Koordinator MK.'
            );

            setAssignModalOpen(false);
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menyimpan penugasan Koordinator MK.');
            refetch();
        }
    };

    const handleOpenDelete = (item: PenugasanKoordinator) => {
        setDeleteId(item.id);
        setDeleteTargetName(
            `${item.dosen?.nama_lengkap || 'Dosen'} (${item.course?.nama_mk || 'Mata Kuliah'})`
        );
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteMutation.mutateAsync(deleteId);
            toast.success('Penugasan Koordinator MK berhasil dicabut.');
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal mencabut penugasan.');
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteId(null);
            setDeleteTargetName('');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Penugasan Koordinator Mata Kuliah"
                description="Tugaskan Dosen sebagai Koordinator Mata Kuliah yang bertanggung jawab mengoordinasikan mata kuliah, mengunggah naskah soal, dan memantau progres verifikasi."
                breadcrumb={[{ label: 'Penugasan Koordinator MK' }]}
                action={
                    <button
                        onClick={() => setAssignModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] cursor-pointer"
                    >
                        <Plus size={16} />
                        Tugaskan Koordinator MK
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
                            {p.nama_periode} ({p.status === 'aktif' ? 'Aktif' : p.status})
                        </option>
                    ))}
                </select>

                <div className="relative w-full sm:w-64 ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari dosen atau mata kuliah..."
                        className="h-9 w-full rounded-lg border border-gray-200 pl-9 pr-8 text-xs focus:border-[var(--color-primary)] focus:outline-none bg-white"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition"
                    title="Refresh data"
                >
                    <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
                </button>
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
                                <th className="px-6 py-4">Dosen Koordinator</th>
                                <th className="px-6 py-4">Mata Kuliah</th>
                                <th className="px-6 py-4 w-36 text-center">Peran</th>
                                <th className="px-6 py-4 w-44">Ditugaskan Oleh</th>
                                <th className="px-6 py-4 w-44">Tanggal Penugasan</th>
                                <th className="px-6 py-4 w-28 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading && <SkeletonTable rows={5} cols={8} />}

                            {!isLoading && (response?.data.length ?? 0) > 0 &&
                                response?.data.map((r: PenugasanKoordinator, idx: number) => (
                                    <tr key={r.id} className="hover:bg-gray-50/70 transition">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {(page - 1) * perPage + idx + 1}
                                        </td>
                                        {/* Dosen info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                                                    {r.dosen?.nama_lengkap?.charAt(0).toUpperCase() || 'K'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-gray-900">
                                                        {r.dosen?.nama_lengkap || '—'}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-mono">
                                                        {r.dosen?.kode_dosen || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Course info */}
                                        <td className="px-6 py-4">
                                            {r.course ? (
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-bold text-[var(--color-primary)] bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                                            {r.course.kode_mk}
                                                        </span>
                                                        <span className="font-semibold text-gray-800 text-sm">
                                                            {r.course.nama_mk}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                                        <span>Semester {r.course.semester ?? '-'}</span>
                                                        <span>•</span>
                                                        <span>{r.course.sks ?? '-'} SKS</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                                    <BookOpen size={13} />
                                                    Semua Mata Kuliah
                                                </span>
                                            )}
                                        </td>

                                        {/* Role badge */}
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-200">
                                                <GraduationCap size={13} />
                                                Koordinator MK
                                            </span>
                                        </td>

                                        {/* Assigned by */}
                                        <td className="px-6 py-4 text-gray-600 text-xs font-medium">
                                            {r.assigned_by_user?.nama_lengkap || 'Super Admin'}
                                        </td>

                                        {/* Assigned at */}
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {formatDate(r.assigned_at)}
                                        </td>

                                        {/* Action */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleOpenDelete(r)}
                                                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-[var(--color-danger)] transition cursor-pointer"
                                                    title="Cabut Penugasan Koordinator MK"
                                                >
                                                    <MinusCircle size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {!isLoading && (!response || (response?.data.length ?? 0) === 0) && (
                    <EmptyState
                        isSearchEmpty={!!debouncedSearch}
                        description={
                            debouncedSearch
                                ? `Tidak ditemukan penugasan yang sesuai dengan pencarian "${debouncedSearch}".`
                                : 'Belum ada dosen yang ditugaskan sebagai Koordinator MK pada periode ini.'
                        }
                    />
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

            <AssignKoordinatorModal
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
                title="Cabut Penugasan Koordinator MK"
                message={`Apakah Anda yakin ingin mencabut penugasan Koordinator MK untuk ${deleteTargetName}? Tindakan ini dapat dibatalkan dengan menugaskannya kembali.`}
                confirmLabel="Cabut Penugasan"
            />
        </div>
    );
}
