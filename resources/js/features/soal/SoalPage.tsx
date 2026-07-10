import { useState, useEffect } from 'react';
import { Plus, Download, Edit2, Trash2, Eye, FileText, Calendar, Clock, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { useToast } from '@/shared/hooks/useToast';
import { formatDate } from '@/shared/lib/utils';
import api from '@/shared/lib/api';
import { Modal } from '@/shared/components/ui/Modal';

import type { Soal } from './types/soal.types';
import type { Periode } from '@/features/periode/types/periode.types';
import { useSoalList, useUploadSoal, useDeleteSoal } from './hooks/useSoal';
import { SoalWizard } from './components/SoalWizard';

export function SoalPage() {
    const { toast } = useToast();

    // Mode: 'list' | 'wizard'
    const [mode, setMode] = useState<'list' | 'wizard'>('list');

    // Filters
    const [search, setSearch] = useState('');
    const [periodeId, setPeriodeId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Helpers lists
    const [periodes, setPeriodes] = useState<Periode[]>([]);

    // Detail Modal states
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedSoal, setSelectedSoal] = useState<Soal | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Delete states
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Load Periodes
    useEffect(() => {
        api.get('/periode', { params: { per_page: 50 } }).then((res) => {
            setPeriodes(res.data.data);
            const active = res.data.data.find((p: any) => p.status === 'aktif');
            if (active) setPeriodeId(String(active.id));
        });
    }, []);

    // Tanstack Queries
    const {
        data: response,
        isLoading,
        refetch,
    } = useSoalList({
        page,
        per_page: perPage,
        search,
        periode_id: periodeId || undefined,
        status: statusFilter || undefined,
    });

    const uploadMutation = useUploadSoal();
    const deleteMutation = useDeleteSoal();

    const handleReset = () => {
        setSearch('');
        setStatusFilter('');
        const active = periodes.find((p) => p.status === 'aktif');
        if (active) setPeriodeId(String(active.id));
        else setPeriodeId('');
        setPage(1);
    };

    const handleOpenWizard = () => {
        setMode('wizard');
    };

    const handleCloseWizard = () => {
        setMode('list');
        refetch();
    };

    const handleWizardSubmit = async (formData: FormData) => {
        try {
            await uploadMutation.mutateAsync(formData);
            toast.success('Soal ujian berhasil diunggah!');
            handleCloseWizard();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal mengunggah soal ujian.');
            throw e;
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
            toast.success('Soal berhasil dihapus.');
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menghapus soal.');
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const handleOpenDetail = async (soal: Soal) => {
        setSelectedSoal(soal);
        setDetailModalOpen(true);
        try {
            const res = await api.get(`/soal/${soal.id}/verifikasi/history`);
            setHistory(res.data.data || []);
        } catch (e) {
            setHistory([]);
        }
    };

    if (mode === 'wizard') {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader
                    title="Upload Soal Baru"
                    description="Gunakan fitur wizard untuk mempermudah pengunggahan soal ujian secara bertahap."
                    breadcrumb={[{ label: 'Soal', href: '/soal' }, { label: 'Upload' }]}
                />
                <SoalWizard
                    onClose={handleCloseWizard}
                    onSubmit={handleWizardSubmit}
                    loading={uploadMutation.isPending}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Soal Ujian Saya"
                description="Pantau progres unggah, status verifikasi, dan riwayat revisi soal ujian Anda."
                breadcrumb={[{ label: 'Soal Saya' }]}
                action={
                    <button
                        onClick={handleOpenWizard}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
                    >
                        <Plus size={16} />
                        Upload Soal
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
                    placeholder="Cari Judul / Kode Soal..."
                    className="w-full sm:w-64"
                />

                <select
                    value={periodeId}
                    onChange={(e) => {
                        setPeriodeId(e.target.value);
                        setPage(1);
                    }}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                >
                    <option value="">Semua Periode</option>
                    {periodes.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.nama_periode}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPage(1);
                    }}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                >
                    <option value="">Semua Status</option>
                    <option value="draft">Draft</option>
                    <option value="submitted">Submitted</option>
                    <option value="in_review">Dalam Review</option>
                    <option value="revisi">Perlu Revisi</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
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
                                <th className="px-6 py-4">Judul Soal / Berkas</th>
                                <th className="px-6 py-4 w-32">Status</th>
                                <th className="px-6 py-4 w-40">Mata Kuliah</th>
                                <th className="px-6 py-4 w-28">CLO Relasi</th>
                                <th className="px-6 py-4 w-20 text-center">Versi</th>
                                <th className="px-6 py-4 w-44">Tanggal Unggah</th>
                                <th className="px-6 py-4 w-40 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading && <SkeletonTable rows={5} cols={9} />}

                            {!isLoading && (response?.data.length ?? 0) > 0 &&
                                response?.data.map((r, idx) => (
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
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800 line-clamp-1">{r.judul_soal}</span>
                                                <a
                                                    href={r.file_url || `/storage/${r.file_soal}`}
                                                    download
                                                    className="mt-0.5 text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                                                >
                                                    <FileText size={12} /> Unduh Berkas
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">{r.mata_kuliah?.kode_mk}</span>
                                                <span className="text-xs text-gray-400 truncate max-w-[120px]">{r.mata_kuliah?.nama_mk}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                                                {r.clo?.kode ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">{r.versi}</td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {formatDate(r.uploaded_at || r.created_at)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleOpenDetail(r)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition"
                                                    title="Lihat Detail & History"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                {r.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleOpenDelete(r.id)}
                                                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-danger)] transition"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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

            {/* Detail & History Modal */}
            <Modal
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title="Detail Soal & Riwayat Verifikasi"
                size="lg"
            >
                {selectedSoal && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase">Informasi Soal</h4>
                                <div className="mt-2 space-y-1.5 text-sm text-gray-700">
                                    <p><strong className="text-gray-500">Judul:</strong> {selectedSoal.judul_soal}</p>
                                    <p><strong className="text-gray-500">Periode:</strong> {selectedSoal.periode?.nama_periode}</p>
                                    <p><strong className="text-gray-500">Versi:</strong> {selectedSoal.versi}</p>
                                    <p>
                                        <strong className="text-gray-500">Berkas:</strong>{' '}
                                        <a
                                            href={selectedSoal.file_url || `/storage/${selectedSoal.file_soal}`}
                                            download
                                            className="text-blue-600 hover:underline font-semibold"
                                        >
                                            Unduh berkas soal
                                        </a>
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase">Status & Penyelarasan</h4>
                                <div className="mt-2 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Status Saat Ini:</span>
                                        <StatusBadge status={selectedSoal.status} />
                                    </div>
                                    <p className="text-xs text-gray-600">
                                        <strong className="text-gray-500">Mata Kuliah:</strong> {selectedSoal.mata_kuliah?.kode_mk} - {selectedSoal.mata_kuliah?.nama_mk}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        <strong className="text-gray-500">Capaian CLO:</strong> {selectedSoal.clo?.kode}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* History Timeline */}
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Timeline Riwayat Verifikasi</h4>
                            {history.length === 0 ? (
                                <p className="text-xs text-gray-400">Belum ada riwayat verifikasi untuk soal ini.</p>
                            ) : (
                                <div className="relative border-l border-gray-200 pl-4 space-y-4">
                                    {history.map((h, idx) => (
                                        <div key={idx} className="relative">
                                            {/* Bullet dot */}
                                            <span className="absolute -left-[21px] top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[var(--color-primary)] ring-4 ring-white" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-800">
                                                        {h.verifier_name || 'Verifikator'}
                                                    </span>
                                                    <span className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
                                                        {h.status_verifikasi}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">{formatDate(h.created_at)}</p>
                                                {h.catatan && (
                                                    <p className="mt-1 text-xs text-gray-600 bg-gray-50 rounded p-2 italic border border-gray-100">
                                                        "{h.catatan}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
