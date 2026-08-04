import { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';
import { useDosenList, useCreateDosen, useUpdateDosen, useDeleteDosen } from './hooks/useDosen';
import type { DosenUser, DosenFormData } from './types/dosen.types';
import type { ProgramStudi } from '@/features/plo-clo/types/plo.types';
import { DosenModal } from './components/DosenModal';
import { useToast } from '@/shared/hooks/useToast';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import api from '@/shared/lib/api';

export function DosenPage() {
    const { toast } = useToast();

    // Filters & Pagination states
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedProdi, setSelectedProdi] = useState<string>('');
    const [selectedTipe, setSelectedTipe] = useState<string>('');

    // Auxiliary lists
    const [prodiList, setProdiList] = useState<ProgramStudi[]>([]);

    // Modals & confirmation
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDosen, setEditingDosen] = useState<DosenUser | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch Program Studi list
    useEffect(() => {
        api.get('/program-studi').then((res) => {
            setProdiList(res.data.data);
        });
    }, []);

    // Fetch Dosen list via React Query
    const { data: response, isLoading, isFetching, refetch } = useDosenList({
        page,
        per_page: 10,
        q: debouncedSearch,
        prodi_id: selectedProdi,
        tipe_dosen: selectedTipe,
    });

    const createMutation = useCreateDosen();
    const updateMutation = useUpdateDosen();
    const deleteMutation = useDeleteDosen();

    const dosenList: DosenUser[] = response?.data ?? [];
    const meta = response?.meta;

    const handleOpenCreate = () => {
        setEditingDosen(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (dosen: DosenUser) => {
        setEditingDosen(dosen);
        setModalOpen(true);
    };

    const handleOpenDelete = (id: number) => {
        setDeleteTargetId(id);
        setDeleteConfirmOpen(true);
    };

    const handleModalSubmit = async (formData: DosenFormData) => {
        try {
            if (editingDosen) {
                await updateMutation.mutateAsync({ id: editingDosen.id, payload: formData });
                toast.success('Data dosen berhasil diperbarui.');
            } else {
                await createMutation.mutateAsync(formData);
                toast.success('Akun dosen baru berhasil ditambahkan.');
            }
            setModalOpen(false);
            setEditingDosen(null);
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menyimpan data dosen.');
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTargetId) return;
        try {
            await deleteMutation.mutateAsync(deleteTargetId);
            toast.success('Akun dosen berhasil dihapus.');
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menghapus akun dosen.');
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteTargetId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-[var(--color-primary)]" size={24} />
                        Manajemen Master Dosen
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">
                        Kelola data master akun dosen, NIDN/Kode Dosen, tipe dosen (Biasa/LB), dan program studi.
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
                >
                    <UserPlus size={16} />
                    Tambah Dosen Baru
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari NIDN, Kode Dosen, Nama..."
                        className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-2 text-xs focus:border-[var(--color-primary)] focus:outline-none bg-gray-50/50"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                        <span>Prodi: S1 Sistem Informasi</span>
                    </div>

                    {/* Filter Tipe Dosen */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>Tipe:</span>
                        <select
                            value={selectedTipe}
                            onChange={(e) => {
                                setSelectedTipe(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                        >
                            <option value="">Semua Tipe</option>
                            <option value="biasa">Dosen Tetap (Biasa)</option>
                            <option value="lb">Dosen LB (Luar Biasa)</option>
                        </select>
                    </div>

                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition"
                        title="Refresh data"
                    >
                        <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="py-3 px-4">Dosen</th>
                                <th className="py-3 px-4">Kode Dosen / NIDN</th>
                                <th className="py-3 px-4">Program Studi</th>
                                <th className="py-3 px-4">Tipe Dosen</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {isLoading && (
                                <>
                                    {[1, 2, 3, 4, 5].map((idx) => (
                                        <tr key={idx}>
                                            <td className="py-3 px-4"><Skeleton className="h-4 w-40" /></td>
                                            <td className="py-3 px-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                                            <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                                            <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
                                            <td className="py-3 px-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                        </tr>
                                    ))}
                                </>
                            )}

                            {!isLoading && dosenList.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        <GraduationCap size={32} className="mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm font-medium">Tidak ada data dosen ditemukan.</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter prodi.</p>
                                    </td>
                                </tr>
                            )}

                            {!isLoading && dosenList.map((dosen) => (
                                <tr key={dosen.id} className="hover:bg-gray-50/60 transition">
                                    {/* Dosen Name & Email */}
                                    <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-[var(--color-primary)] font-bold text-xs">
                                                {(dosen.nama_lengkap || dosen.name || 'D').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-semibold text-gray-800">
                                                        {dosen.nama_lengkap || dosen.name}
                                                    </p>
                                                    {dosen.is_coordinator && (
                                                        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                                                            Koordinator
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-400">{dosen.email}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Kode Dosen */}
                                    <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                                        {dosen.kode_dosen}
                                    </td>

                                    {/* Program Studi */}
                                    <td className="py-3.5 px-4 text-gray-600">
                                        {dosen.prodi ? (
                                            <span className="font-medium text-gray-700">
                                                {dosen.prodi.nama_prodi} ({dosen.prodi.kode_prodi})
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">Belum diatur</span>
                                        )}
                                    </td>

                                    {/* Tipe Dosen & Semester LB */}
                                    <td className="py-3.5 px-4">
                                        {dosen.tipe_dosen === 'lb' ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                                                Dosen LB ({dosen.semester_lb ? dosen.semester_lb.toUpperCase() : '-'})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                                                Dosen Tetap
                                            </span>
                                        )}
                                    </td>

                                    {/* Status */}
                                    <td className="py-3.5 px-4">
                                        {dosen.status_aktif ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                                                <CheckCircle2 size={13} />
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400">
                                                <XCircle size={13} />
                                                Nonaktif
                                            </span>
                                        )}
                                    </td>

                                    {/* Actions */}
                                    <td className="py-3.5 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleOpenEdit(dosen)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition"
                                                title="Edit"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenDelete(dosen.id)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                                                title="Hapus"
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

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 bg-gray-50/30">
                        <span className="text-xs text-gray-500">
                            Menampilkan halaman <span className="font-semibold text-gray-700">{meta.current_page}</span> dari{' '}
                            <span className="font-semibold text-gray-700">{meta.last_page}</span> ({meta.total} total dosen)
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <span className="px-2 text-xs font-semibold text-gray-700">{page}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(p + 1, meta.last_page))}
                                disabled={page === meta.last_page}
                                className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dosen Modal */}
            <DosenModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleModalSubmit}
                editingDosen={editingDosen}
                prodiList={prodiList}
                loading={createMutation.isPending || updateMutation.isPending}
            />

            {/* Confirm Delete */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
