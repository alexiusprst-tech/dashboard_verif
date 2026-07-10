import { useState } from 'react';
import { Download, Upload, Trash2, FileText, Plus, AlertCircle } from 'lucide-react';
import { useTemplateList, useUploadTemplate, useDeleteTemplate } from '../hooks/useTemplate';
import type { Kategori } from '../types/kategori.types';
import { useToast } from '@/shared/hooks/useToast';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

interface TemplateSectionProps {
    kategori: Kategori;
}

export function TemplateSection({ kategori }: TemplateSectionProps) {
    const { toast } = useToast();
    const { data: templates, isLoading, refetch } = useTemplateList(kategori.id);

    const uploadMutation = useUploadTemplate();
    const deleteMutation = useDeleteTemplate();

    // Upload form states
    const [file, setFile] = useState<File | null>(null);
    const [versi, setVersi] = useState('1.0');
    const [uploading, setUploading] = useState(false);

    // Confirm Delete states
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.name.endsWith('.docx') || selected.name.endsWith('.doc')) {
                setFile(selected);
            } else {
                toast.error('File harus berupa Word (.docx / .doc)');
            }
        }
    };

    const handleUploadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Silakan pilih file template terlebih dahulu.');
            return;
        }

        const formData = new FormData();
        formData.append('kategori_id', String(kategori.id));
        formData.append('file_template', file);
        formData.append('versi', versi);

        setUploading(true);
        try {
            await uploadMutation.mutateAsync(formData);
            toast.success('Template berhasil diunggah.');
            setFile(null);
            setVersi('1.0');
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal mengunggah template.');
        } finally {
            setUploading(false);
        }
    };

    const handleOpenDelete = (id: number) => {
        setDeleteId(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteMutation.mutateAsync({ id: deleteId, kategoriId: kategori.id });
            toast.success('Template berhasil dihapus.');
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menghapus template.');
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <form onSubmit={handleUploadSubmit} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Upload size={16} className="text-[var(--color-primary)]" />
                    Unggah Template Baru
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase">File Word (.docx)</label>
                        <div className="mt-1 flex items-center gap-3">
                            <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 text-sm text-gray-600 transition hover:border-[var(--color-primary)] hover:bg-gray-50">
                                <Plus size={14} />
                                {file ? 'Ubah File' : 'Pilih File'}
                                <input
                                    type="file"
                                    accept=".docx,.doc"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                            {file && (
                                <span className="text-xs text-gray-600 truncate max-w-xs font-medium">
                                    {file.name}
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Versi</label>
                        <input
                            type="text"
                            value={versi}
                            onChange={(e) => setVersi(e.target.value)}
                            placeholder="Contoh: 1.0"
                            className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-end border-t border-gray-200 pt-3">
                    <button
                        type="submit"
                        disabled={uploading || !file}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading && (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        Simpan & Publikasikan
                    </button>
                </div>
            </form>

            {/* Template List */}
            <div>
                <div className="mb-3 text-sm font-semibold text-gray-700">Daftar Versi Template</div>

                {isLoading && (
                    <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                )}

                {!isLoading && (!templates || templates.length === 0) && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-8 text-center text-gray-400">
                        <FileText size={24} strokeWidth={1.5} className="mb-2 text-gray-300" />
                        <p className="text-xs">Belum ada file template diunggah untuk kategori ini.</p>
                    </div>
                )}

                {!isLoading && templates && templates.length > 0 && (
                    <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden bg-white">
                        {templates.map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{t.nama_file}</p>
                                        <p className="text-xs text-gray-400">
                                            Versi {t.versi} • Diunggah pada{' '}
                                            {new Date(t.created_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    {t.is_active && (
                                        <span className="mr-2 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700 border border-green-200">
                                            Aktif
                                        </span>
                                    )}

                                    {t.file_url ? (
                                        <a
                                            href={t.file_url}
                                            download
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition"
                                            title="Download"
                                        >
                                            <Download size={15} />
                                        </a>
                                    ) : (
                                        <a
                                            href={`/storage/${t.file_path}`}
                                            download
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition"
                                            title="Download"
                                        >
                                            <Download size={15} />
                                        </a>
                                    )}

                                    <button
                                        onClick={() => handleOpenDelete(t.id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[var(--color-danger)] transition"
                                        title="Hapus"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
