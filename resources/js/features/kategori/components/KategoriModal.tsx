import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, FileText, X, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import type { Kategori, KategoriFormData } from '../types/kategori.types';

const schema = z.object({
    nama_kategori: z.string().min(1, 'Nama Kategori wajib diisi').max(100, 'Nama Kategori maksimal 100 karakter'),
    deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
});

export interface KategoriModalSubmitData extends KategoriFormData {
    templateFile?: File | null;
    templateVersi?: string;
}

interface KategoriModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: KategoriModalSubmitData) => void;
    kategori?: Kategori | null;
    loading?: boolean;
}

export function KategoriModal({
    open,
    onClose,
    onSubmit,
    kategori,
    loading = false,
}: KategoriModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<KategoriFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            nama_kategori: '',
            deskripsi: '',
        },
    });

    // Template upload states (only for create mode)
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [templateVersi, setTemplateVersi] = useState('1.0');
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (kategori) {
            reset({
                nama_kategori: kategori.nama_kategori,
                deskripsi: kategori.deskripsi || '',
            });
        } else {
            reset({
                nama_kategori: '',
                deskripsi: '',
            });
        }
        // Reset template state when modal opens/closes
        setTemplateFile(null);
        setTemplateVersi('1.0');
        setFileError('');
        setIsDragging(false);
    }, [kategori, reset, open]);

    const isValidFile = (f: File) =>
        f.name.endsWith('.docx') || f.name.endsWith('.doc');

    const handleFileSelect = (f: File) => {
        if (!isValidFile(f)) {
            setFileError('File harus berformat Word (.docx atau .doc)');
            setTemplateFile(null);
            return;
        }
        setFileError('');
        setTemplateFile(f);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFileSelect(f);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFileSelect(f);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const handleRemoveFile = () => {
        setTemplateFile(null);
        setFileError('');
    };

    const handleFormSubmit = (data: KategoriFormData) => {
        onSubmit({
            ...data,
            templateFile: templateFile ?? null,
            templateVersi,
        });
    };

    const isAddMode = !kategori;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={kategori ? 'Edit Kategori' : 'Tambah Kategori'}
            size="md"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="kategori-form"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
                    >
                        {loading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        Simpan
                    </button>
                </>
            }
        >
            <form id="kategori-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                {/* Nama Kategori */}
                <div>
                    <label htmlFor="nama_kategori" className="block text-sm font-medium text-gray-700">
                        Nama Kategori <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="nama_kategori"
                        type="text"
                        placeholder="Contoh: UTS, UAS, Kuis"
                        {...register('nama_kategori')}
                        className="mt-1 block h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    {errors.nama_kategori && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.nama_kategori.message}</p>
                    )}
                </div>

                {/* Deskripsi */}
                <div>
                    <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">
                        Deskripsi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="deskripsi"
                        rows={3}
                        placeholder="Tuliskan deskripsi mengenai cakupan kategori..."
                        {...register('deskripsi')}
                        className="mt-1 block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    {errors.deskripsi && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.deskripsi.message}</p>
                    )}
                </div>

                {/* Upload Template — hanya mode Tambah */}
                {isAddMode && (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-2">
                            <Upload size={15} className="text-[var(--color-primary)]" />
                            <span className="text-sm font-semibold text-gray-700">Upload Template</span>
                            <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                Opsional
                            </span>
                        </div>

                        {/* File sudah dipilih */}
                        {templateFile ? (
                            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                    <FileText size={16} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold text-green-800">{templateFile.name}</p>
                                    <p className="text-[10px] text-green-600">
                                        {(templateFile.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <CheckCircle2 size={16} className="shrink-0 text-green-500" />
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-green-100 text-green-600 transition"
                                    title="Hapus file"
                                >
                                    <X size={13} />
                                </button>
                            </div>
                        ) : (
                            /* Drop Zone */
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed py-5 transition
                                    ${isDragging
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light,#fef2f2)]'
                                        : 'border-gray-200 bg-white hover:border-[var(--color-primary)] hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${isDragging ? 'bg-[var(--color-primary)] text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <Upload size={18} />
                                </div>
                                <p className="text-xs font-medium text-gray-600">
                                    {isDragging ? 'Lepaskan file di sini' : 'Seret & lepas file, atau klik untuk memilih'}
                                </p>
                                <p className="text-[10px] text-gray-400">Format: .docx / .doc</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".docx,.doc"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />
                            </div>
                        )}

                        {/* Error */}
                        {fileError && (
                            <p className="text-xs text-[var(--color-danger)]">{fileError}</p>
                        )}

                        {/* Input Versi */}
                        <div className="flex items-center gap-3">
                            <label className="shrink-0 text-xs font-semibold text-gray-500">
                                Versi Template
                            </label>
                            <input
                                type="text"
                                value={templateVersi}
                                onChange={(e) => setTemplateVersi(e.target.value)}
                                placeholder="Contoh: 1.0"
                                className="h-8 w-28 rounded-lg border border-gray-300 bg-white px-3 text-xs focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
}

