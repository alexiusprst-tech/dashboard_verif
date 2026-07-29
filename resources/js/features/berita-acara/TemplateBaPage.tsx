import { useState, useRef } from 'react';
import {
    Upload, FileText, CheckCircle2, Trash2, Download, AlertTriangle,
    Star, StarOff, Clock, Info,
} from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { useToast } from '@/shared/hooks/useToast';
import { formatDate } from '@/shared/lib/utils';
import { useTemplateBaList, useUploadTemplateBa, useActivateTemplateBa, useDeleteTemplateBa } from './hooks/useTemplateBa';
import type { TemplateBa } from './api/templateBaApi';
import { getTemplateDownloadUrl } from './api/templateBaApi';

export function TemplateBaPage() {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload form state
    const [namaTemplate, setNamaTemplate] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [fileError, setFileError] = useState('');

    // Confirm delete
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    const { data: listResponse, isLoading } = useTemplateBaList();
    const uploadMutation = useUploadTemplateBa();
    const activateMutation = useActivateTemplateBa();
    const deleteMutation = useDeleteTemplateBa();

    const templates: TemplateBa[] = listResponse?.data ?? [];

    const validateFile = (file: File): boolean => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'docx') {
            setFileError('Hanya file Word (.docx) yang diperbolehkan.');
            return false;
        }
        if (file.size > 50 * 1024 * 1024) {
            setFileError('Ukuran file maksimal 50MB.');
            return false;
        }
        setFileError('');
        return true;
    };

    const handleFileSelect = (file: File) => {
        if (validateFile(file)) {
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleUpload = async () => {
        if (!namaTemplate.trim()) {
            toast.error('Nama template wajib diisi.');
            return;
        }
        if (!selectedFile) {
            toast.error('Pilih file .docx terlebih dahulu.');
            return;
        }

        const formData = new FormData();
        formData.append('nama_template', namaTemplate.trim());
        formData.append('file_template', selectedFile);

        try {
            await uploadMutation.mutateAsync(formData);
            toast.success('Template berhasil diunggah dan otomatis diaktifkan.');
            setNamaTemplate('');
            setSelectedFile(null);
            setFileError('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal mengunggah template.');
        }
    };

    const handleActivate = async (id: number, nama: string) => {
        try {
            await activateMutation.mutateAsync(id);
            toast.success(`Template "${nama}" berhasil diaktifkan.`);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal mengaktifkan template.');
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
            toast.success('Template berhasil dihapus.');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menghapus template.');
        } finally {
            setDeleteConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const activeTemplate = templates.find((t) => t.is_active);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Template Berita Acara"
                description="Kelola template Word (.docx) yang digunakan untuk generate Berita Acara verifikasi soal."
                breadcrumb={[
                    { label: 'Dashboard', href: '/' },
                    { label: 'Template Berita Acara' },
                ]}
            />

            {/* Info Banner */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 flex items-start gap-3">
                <Info size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold text-blue-700">Panduan Placeholder Template</p>
                    <p className="text-blue-600 mt-1">
                        Gunakan placeholder berikut di dalam file .docx Anda:
                        {' '}
                        <code className="font-mono bg-blue-100 px-1 rounded">{'${nomor_ba}'}</code>,{' '}
                        <code className="font-mono bg-blue-100 px-1 rounded">{'${periode}'}</code>,{' '}
                        <code className="font-mono bg-blue-100 px-1 rounded">{'${nama_pic}'}</code>,{' '}
                        <code className="font-mono bg-blue-100 px-1 rounded">{'${tanggal}'}</code>.
                        Untuk baris tabel data soal, gunakan{' '}
                        <code className="font-mono bg-blue-100 px-1 rounded">{'${nama_dosen}'}</code>,{' '}
                        <code className="font-mono bg-blue-100 px-1 rounded">{'${status}'}</code>,{' '}
                        <code className="font-mono bg-blue-100 px-1 rounded">{'${catatan}'}</code>{' '}
                        dalam satu baris tabel agar otomatis diklon per soal.
                    </p>
                </div>
            </div>

            {/* Active Template Stat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary-light)]">
                        <FileText size={18} className="text-[var(--color-primary)]" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                    <p className="text-sm text-gray-500">Jumlah Template</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-success-light)]">
                        <CheckCircle2 size={18} className="text-[var(--color-success)]" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{activeTemplate ? '1' : '0'}</p>
                    <p className="text-sm text-gray-500">Template Aktif</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-warning-light)]">
                        <Clock size={18} className="text-[var(--color-warning)]" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                        {activeTemplate ? activeTemplate.nama_template : '—'}
                    </p>
                    <p className="text-sm text-gray-500">Template Digunakan</p>
                </div>
            </div>

            {/* Upload Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Upload size={16} className="text-[var(--color-primary)]" />
                        Upload Template Baru
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Template baru yang diunggah akan otomatis menjadi template aktif.</p>
                </div>
                <div className="p-6 flex flex-col gap-4">
                    {/* Nama Template */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Nama Template <span className="text-[var(--color-danger)]">*</span>
                        </label>
                        <input
                            type="text"
                            value={namaTemplate}
                            onChange={(e) => setNamaTemplate(e.target.value)}
                            placeholder="contoh: Template BA Semester Ganjil 2024/2025"
                            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                    </div>

                    {/* File Dropzone */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            File Template (.docx) <span className="text-[var(--color-danger)]">*</span>
                        </label>
                        <div
                            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer
                                ${dragOver
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                                    : selectedFile
                                        ? 'border-[var(--color-success)] bg-[var(--color-success-light)]'
                                        : 'border-gray-300 bg-gray-50 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]'
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                className="hidden"
                                onChange={handleFileInputChange}
                            />
                            {selectedFile ? (
                                <>
                                    <CheckCircle2 size={32} className="text-[var(--color-success)]" />
                                    <div>
                                        <p className="font-semibold text-sm text-[var(--color-success)]">{selectedFile.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {(selectedFile.size / 1024).toFixed(1)} KB — Klik untuk mengganti
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200">
                                        <Upload size={22} className="text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            Klik atau seret file ke sini
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Hanya file <strong>.docx</strong> — Maksimal 50MB
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        {fileError && (
                            <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--color-danger)]">
                                <AlertTriangle size={13} /> {fileError}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={uploadMutation.isPending || !selectedFile || !namaTemplate.trim()}
                            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploadMutation.isPending ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Upload size={15} />
                            )}
                            {uploadMutation.isPending ? 'Mengunggah...' : 'Upload & Aktifkan'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Template List */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FileText size={16} className="text-gray-500" />
                        Daftar Template
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-gray-600">
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700">
                            <tr>
                                <th className="px-6 py-4 w-12">No</th>
                                <th className="px-6 py-4">Nama Template</th>
                                <th className="px-6 py-4 w-36 text-center">Status</th>
                                <th className="px-6 py-4 w-44">Diupload Oleh</th>
                                <th className="px-6 py-4 w-44">Tanggal Upload</th>
                                <th className="px-6 py-4 w-44 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading && <SkeletonTable rows={3} cols={6} />}
                            {!isLoading && templates.length > 0 && templates.map((t, idx) => (
                                <tr key={t.id} className={`hover:bg-gray-50 transition ${t.is_active ? 'bg-[var(--color-success-light)]/20' : ''}`}>
                                    <td className="px-6 py-4 font-medium text-gray-900">{idx + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                                                <FileText size={15} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{t.nama_template}</p>
                                                <p className="text-xs text-gray-400">{t.nama_file || t.file_path.split('/').pop()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {t.is_active ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-success)] bg-[var(--color-success-light)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
                                                <CheckCircle2 size={12} />
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                                                Tidak Aktif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 text-sm">
                                        {t.uploader?.nama_lengkap ?? t.uploader?.name ?? '—'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {formatDate(t.created_at)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {/* Download */}
                                            <a
                                                href={getTemplateDownloadUrl(t.id)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-lg p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
                                                title="Download template"
                                            >
                                                <Download size={15} />
                                            </a>
                                            {/* Activate */}
                                            {!t.is_active && (
                                                <button
                                                    onClick={() => handleActivate(t.id, t.nama_template)}
                                                    disabled={activateMutation.isPending}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-[var(--color-success-light)] hover:text-[var(--color-success)] transition"
                                                    title="Aktifkan template ini"
                                                >
                                                    <Star size={15} />
                                                </button>
                                            )}
                                            {t.is_active && (
                                                <span className="rounded-lg p-1.5 text-[var(--color-success)]" title="Template ini sudah aktif">
                                                    <StarOff size={15} />
                                                </span>
                                            )}
                                            {/* Delete */}
                                            <button
                                                onClick={() => handleOpenDelete(t.id)}
                                                disabled={deleteMutation.isPending}
                                                className="rounded-lg p-1.5 text-gray-500 hover:bg-[var(--color-danger-light)] hover:text-[var(--color-danger)] transition"
                                                title="Hapus template"
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
                {!isLoading && templates.length === 0 && <EmptyState />}
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
