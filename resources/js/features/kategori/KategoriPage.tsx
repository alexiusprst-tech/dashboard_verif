import { useState } from 'react';
import { Plus, Edit2, Trash2, FileText, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { useToast } from '@/shared/hooks/useToast';
import { formatDate } from '@/shared/lib/utils';
import { Modal } from '@/shared/components/ui/Modal';

import type { Kategori } from './types/kategori.types';
import { useKategoriList, useCreateKategori, useUpdateKategori, useDeleteKategori } from './hooks/useKategori';
import { KategoriModal } from './components/KategoriModal';
import { TemplateSection } from './components/TemplateSection';

// Client-side maps for visual aesthetics
const KATEGORI_DECORATIONS: Record<string, { icon: string; color: string; bg: string }> = {
    UTS: { icon: '📝', color: 'var(--color-primary)', bg: 'bg-[var(--color-primary-light)]' },
    UAS: { icon: '📚', color: 'var(--color-info)', bg: 'bg-[var(--color-info-light)]' },
    KUIS: { icon: '⚡', color: 'var(--color-warning)', bg: 'bg-[var(--color-warning-light)]' },
    TUGAS: { icon: '📂', color: 'var(--color-success)', bg: 'bg-[var(--color-success-light)]' },
    DEFAULT: { icon: '🏷️', color: 'var(--color-gray-600)', bg: 'bg-gray-100' },
};

export function KategoriPage() {
    const { toast } = useToast();

    // Filters
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modals
    const [kategoriModalOpen, setKategoriModalOpen] = useState(false);
    const [currentKategori, setCurrentKategori] = useState<Kategori | null>(null);

    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [selectedKategoriForTemplates, setSelectedKategoriForTemplates] = useState<Kategori | null>(null);

    // Confirm Delete
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // Queries
    const { data: response, isLoading, refetch } = useKategoriList({
        page,
        per_page: perPage,
        search,
    });

    const createMutation = useCreateKategori();
    const updateMutation = useUpdateKategori();
    const deleteMutation = useDeleteKategori();

    const handleReset = () => {
        setSearch('');
        setPage(1);
    };

    const handleOpenAdd = () => {
        setCurrentKategori(null);
        setKategoriModalOpen(true);
    };

    const handleOpenEdit = (kat: Kategori) => {
        setCurrentKategori(kat);
        setKategoriModalOpen(true);
    };

    const handleSaveKategori = async (data: any) => {
        try {
            if (currentKategori) {
                await updateMutation.mutateAsync({ id: currentKategori.id, payload: data });
                toast.success('Kategori berhasil diperbarui.');
            } else {
                await createMutation.mutateAsync(data);
                toast.success('Kategori baru berhasil ditambahkan.');
            }
            setKategoriModalOpen(false);
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menyimpan kategori.');
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
            toast.success('Kategori berhasil dihapus.');
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menghapus kategori.');
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const handleOpenTemplates = (kat: Kategori) => {
        setSelectedKategoriForTemplates(kat);
        setTemplateModalOpen(true);
    };

    const getDecorations = (name: string) => {
        const key = name.toUpperCase();
        return KATEGORI_DECORATIONS[key] || KATEGORI_DECORATIONS.DEFAULT;
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Kategori & Template Soal"
                description="Kelola kategori soal ujian (UTS, UAS, dll) beserta file template Word (.docx) standarnya."
                breadcrumb={[{ label: 'Kategori & Template' }]}
                action={
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
                    >
                        <Plus size={16} />
                        Tambah Kategori
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
                    placeholder="Cari Kategori..."
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
                                <th className="px-6 py-4 w-52">Kategori</th>
                                <th className="px-6 py-4">Deskripsi</th>
                                <th className="px-6 py-4 w-48">Created At</th>
                                <th className="px-6 py-4 w-52 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading && <SkeletonTable rows={4} cols={6} />}

                            {!isLoading && (response?.data.length ?? 0) > 0 &&
                                response?.data.map((r, idx) => {
                                    const deco = getDecorations(r.nama_kategori);
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
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-base ${deco.bg}`}>
                                                        {deco.icon}
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        {r.nama_kategori}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 max-w-sm truncate" title={r.deskripsi ?? ''}>
                                                {r.deskripsi}
                                            </td>
                                            <td className="px-6 py-4 text-gray-400">
                                                {formatDate(r.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleOpenTemplates(r)}
                                                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                                    >
                                                        <FileText size={13} />
                                                        Templates
                                                    </button>
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
                                                        <Trash2 size={15} />
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

            <KategoriModal
                open={kategoriModalOpen}
                onClose={() => setKategoriModalOpen(false)}
                onSubmit={handleSaveKategori}
                kategori={currentKategori}
                loading={createMutation.isPending || updateMutation.isPending}
            />

            {/* Template Files Manager Modal */}
            <Modal
                open={templateModalOpen}
                onClose={() => setTemplateModalOpen(false)}
                title={`Kelola Template Word — ${selectedKategoriForTemplates?.nama_kategori}`}
                size="lg"
            >
                {selectedKategoriForTemplates && (
                    <TemplateSection kategori={selectedKategoriForTemplates} />
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
