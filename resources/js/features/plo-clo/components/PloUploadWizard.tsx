import { useState, useRef, useCallback, useEffect, type DragEvent } from 'react';
import {
    X,
    Upload,
    Download,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    Pencil,
    Trash2,
    Check,
    RefreshCw,
    ArrowRight,
    PartyPopper,
    Eye,
    ChevronRight,
    Info,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { previewImportPlo, importPlo } from '../api/ploApi';
import { downloadTemplate } from '../api/curriculumApi';
import type { PloImportPreviewRow, ImportPreviewResult } from '../types/plo.types';

/* ── Types ─────────────────────────────────────────────────────── */

type WizardStep =
    | 'upload'
    | 'validating'
    | 'error-report'
    | 'preview'
    | 'confirm'
    | 'success';

interface EditableRow extends PloImportPreviewRow {
    _localId: number;
}

interface ImportResult {
    created: number;
    updated?: number;
    total: number;
    timestamp: string;
}

interface PloUploadWizardProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

/* ── Step Indicator ─────────────────────────────────────────────── */

const STEPS: { key: WizardStep | 'done'; label: string }[] = [
    { key: 'upload', label: 'Upload File' },
    { key: 'validating', label: 'Validasi' },
    { key: 'preview', label: 'Preview' },
    { key: 'done', label: 'Simpan' },
];

const STEP_INDEX: Record<WizardStep, number> = {
    upload: 0,
    validating: 1,
    'error-report': 1,
    preview: 2,
    confirm: 3,
    success: 3,
};

function StepIndicator({ current }: { current: WizardStep }) {
    const currentIdx = STEP_INDEX[current];

    return (
        <div className="flex items-center gap-0 px-6 py-4 border-b border-gray-100">
            {STEPS.map((step, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;
                const isLast = idx === STEPS.length - 1;

                return (
                    <div key={step.key} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={cn(
                                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                                    isCompleted && 'bg-green-500 text-white',
                                    isActive && 'bg-[var(--color-primary)] text-white ring-4 ring-red-100',
                                    !isCompleted && !isActive && 'bg-gray-100 text-gray-400',
                                )}
                            >
                                {isCompleted ? <Check size={14} /> : idx + 1}
                            </div>
                            <span
                                className={cn(
                                    'text-[10px] font-semibold whitespace-nowrap',
                                    isActive && 'text-[var(--color-primary)]',
                                    isCompleted && 'text-green-600',
                                    !isCompleted && !isActive && 'text-gray-400',
                                )}
                            >
                                {step.label}
                            </span>
                        </div>
                        {!isLast && (
                            <div
                                className={cn(
                                    'h-0.5 flex-1 mx-2 mb-4 rounded transition-all duration-300',
                                    idx < currentIdx ? 'bg-green-400' : 'bg-gray-200',
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ── File Size Formatter ────────────────────────────────────────── */

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/* ── Step 1: Upload File ────────────────────────────────────────── */

interface UploadStepProps {
    onFileSelected: (file: File) => void;
    onDownloadTemplate: () => void;
    isDownloading: boolean;
}

function UploadStep({ onFileSelected, onDownloadTemplate, isDownloading }: UploadStepProps) {
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback(
        (e: DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                setSelectedFile(file);
            }
        },
        [],
    );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setSelectedFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    const isFileTooLarge = selectedFile ? selectedFile.size > MAX_SIZE_BYTES : false;

    return (
        <div className="space-y-5">
            {/* Info Banner */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
                <div className="text-xs text-blue-700 leading-relaxed">
                    <p className="font-semibold mb-0.5">Cara Import Data PLO:</p>
                    <ol className="list-decimal ml-4 space-y-0.5">
                        <li>Download template Excel terlebih dahulu</li>
                        <li>Isi data PLO sesuai format (Kode PLO + Deskripsi PLO)</li>
                        <li>Upload file yang sudah diisi untuk divalidasi sistem</li>
                    </ol>
                </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !selectedFile && inputRef.current?.click()}
                className={cn(
                    'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all duration-200',
                    dragOver
                        ? 'border-[var(--color-primary)] bg-red-50 scale-[1.01]'
                        : 'border-gray-300 bg-gray-50 hover:border-[var(--color-primary)] hover:bg-red-50/40',
                    !selectedFile && 'cursor-pointer',
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                />

                {!selectedFile ? (
                    <>
                        <div className={cn(
                            'flex h-16 w-16 items-center justify-center rounded-2xl transition-colors',
                            dragOver ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-gray-200 text-gray-400',
                        )}>
                            <Upload size={28} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">
                                Drag & drop file Excel di sini
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                atau klik untuk memilih file
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
                        >
                            Pilih File
                        </button>
                    </>
                ) : (
                    /* File Info Card */
                    <div className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <FileSpreadsheet size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800">
                                {selectedFile.name}
                            </p>
                            <p className={cn('text-xs mt-0.5', isFileTooLarge ? 'text-red-500' : 'text-gray-400')}>
                                {formatBytes(selectedFile.size)}
                                {isFileTooLarge && ' — Melebihi batas 5MB'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition"
                            title="Hapus file"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Ketentuan */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">
                    Ketentuan File
                </p>
                <ul className="space-y-1.5">
                    {[
                        { ok: true, text: 'Format file: .xlsx atau .xls' },
                        { ok: !isFileTooLarge, text: 'Ukuran file maksimum: 5 MB' },
                        { ok: true, text: 'Header harus sesuai template (kode_plo, deskripsi)' },
                        { ok: true, text: 'Setiap PLO harus memiliki kode dan deskripsi' },
                        { ok: true, text: 'Kode PLO tidak boleh duplikat' },
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <span className={cn(
                                'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-white',
                                isFileTooLarge && i === 1 ? 'bg-red-400' : 'bg-green-400',
                            )}>
                                {isFileTooLarge && i === 1
                                    ? <X size={10} />
                                    : <Check size={10} />
                                }
                            </span>
                            {item.text}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                    type="button"
                    onClick={onDownloadTemplate}
                    disabled={isDownloading}
                    className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)] hover:underline disabled:opacity-50"
                >
                    {isDownloading
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Download size={14} />
                    }
                    Download Template Excel
                </button>

                <button
                    type="button"
                    onClick={() => selectedFile && onFileSelected(selectedFile)}
                    disabled={!selectedFile || isFileTooLarge}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Validasi File
                    <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
}

/* ── Step 2: Validating ─────────────────────────────────────────── */

function ValidatingStep() {
    return (
        <div className="flex flex-col items-center justify-center gap-5 py-16">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <Loader2 size={36} className="animate-spin text-blue-500" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-30" />
            </div>
            <div className="text-center">
                <p className="text-base font-bold text-gray-800">Memvalidasi Data...</p>
                <p className="mt-1 text-sm text-gray-400">
                    Sistem sedang memeriksa format dan isi file Excel Anda
                </p>
            </div>
            <div className="flex items-center gap-6 rounded-xl border border-gray-200 bg-gray-50 px-6 py-3 text-xs text-gray-500">
                {['Format file', 'Struktur header', 'Kode PLO', 'Duplikasi'].map((label) => (
                    <span key={label} className="flex items-center gap-1.5">
                        <Loader2 size={11} className="animate-spin text-blue-400" />
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ── Stat Cards ─────────────────────────────────────────────────── */

function StatCards({ total, valid, invalid }: { total: number; valid: number; invalid: number }) {
    return (
        <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Data</p>
                <p className="mt-2 text-2xl font-extrabold text-gray-800">{total}</p>
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-500">Valid</p>
                <p className="mt-2 text-2xl font-extrabold text-green-700">{valid}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Invalid</p>
                <p className="mt-2 text-2xl font-extrabold text-red-600">{invalid}</p>
            </div>
        </div>
    );
}

/* ── Step 3a: Error Report ──────────────────────────────────────── */

interface ErrorReportStepProps {
    result: ImportPreviewResult<PloImportPreviewRow>;
    onImportUlang: () => void;
    onDownloadError: () => void;
}

function ErrorReportStep({ result, onImportUlang, onDownloadError }: ErrorReportStepProps) {
    const errorRows = result.rows.filter((r) => r.status === 'invalid');

    /* Map error to user-friendly label */
    const mapErrorType = (err: string): { type: string; detail: string } => {
        if (err.includes('duplikat') || err.toLowerCase().includes('duplicate'))
            return { type: 'Kode Duplikat', detail: err };
        if (err.includes('wajib') || err.toLowerCase().includes('required'))
            return { type: 'Wajib Diisi', detail: err };
        if (err.includes('format') || err.toLowerCase().includes('format'))
            return { type: 'Format Salah', detail: err };
        if (err.includes('sudah terdaftar') || err.toLowerCase().includes('already exists'))
            return { type: 'Sudah Ada', detail: err };
        return { type: 'Kesalahan', detail: err };
    };

    return (
        <div className="space-y-4">
            {/* Status Banner */}
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <XCircle size={20} className="flex-shrink-0 text-red-500" />
                <div>
                    <p className="text-sm font-bold text-red-700">Validasi Gagal</p>
                    <p className="text-xs text-red-500">
                        {result.invalid} baris bermasalah ditemukan. Perbaiki file dan import ulang.
                    </p>
                </div>
            </div>

            <StatCards total={result.total} valid={result.valid} invalid={result.invalid} />

            {/* Error Table */}
            <div>
                <p className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Detail Kesalahan
                </p>
                <div className="overflow-auto rounded-xl border border-gray-200 max-h-72">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                        <thead className="sticky top-0 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-3 py-3 w-16">No. Baris</th>
                                <th className="px-3 py-3 w-28">Kode PLO</th>
                                <th className="px-3 py-3">Deskripsi PLO</th>
                                <th className="px-3 py-3 w-28">Jenis Kesalahan</th>
                                <th className="px-3 py-3">Detail Kesalahan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {errorRows.map((row) =>
                                row.errors.map((err, errIdx) => {
                                    const { type, detail } = mapErrorType(err);
                                    return (
                                        <tr key={`${row.row}-${errIdx}`} className="bg-red-50/60">
                                            <td className="px-3 py-2.5 font-mono font-bold text-red-600">
                                                Baris {row.row}
                                            </td>
                                            <td className="px-3 py-2.5 font-mono font-semibold text-gray-700">
                                                {row.kode_plo || '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-600 max-w-[160px] truncate" title={row.deskripsi}>
                                                {row.deskripsi || '—'}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                                                    {type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-500">{detail}</td>
                                        </tr>
                                    );
                                }),
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                    type="button"
                    onClick={onDownloadError}
                    className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                >
                    <Download size={13} />
                    Download Error Report
                </button>
                <button
                    type="button"
                    onClick={onImportUlang}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
                >
                    <RefreshCw size={14} />
                    Import Ulang
                </button>
            </div>
        </div>
    );
}

/* ── Step 3b: Preview Data ──────────────────────────────────────── */

interface PreviewStepProps {
    rows: EditableRow[];
    onRowsChange: (rows: EditableRow[]) => void;
    onConfirm: () => void;
}

function PreviewStep({ rows, onRowsChange, onConfirm }: PreviewStepProps) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editKode, setEditKode] = useState('');
    const [editDeskripsi, setEditDeskripsi] = useState('');

    const startEdit = (row: EditableRow) => {
        setEditingId(row._localId);
        setEditKode(row.kode_plo);
        setEditDeskripsi(row.deskripsi);
    };

    const saveEdit = () => {
        onRowsChange(
            rows.map((r) =>
                r._localId === editingId
                    ? { ...r, kode_plo: editKode.trim(), deskripsi: editDeskripsi.trim() }
                    : r,
            ),
        );
        setEditingId(null);
    };

    const cancelEdit = () => setEditingId(null);

    const deleteRow = (localId: number) => {
        onRowsChange(rows.filter((r) => r._localId !== localId));
    };

    return (
        <div className="space-y-4">
            {/* Status Banner */}
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <CheckCircle2 size={20} className="flex-shrink-0 text-green-500" />
                <div>
                    <p className="text-sm font-bold text-green-700">Validasi Berhasil!</p>
                    <p className="text-xs text-green-600">
                        Semua data valid. Tinjau dan edit sebelum menyimpan ke database.
                    </p>
                </div>
            </div>

            <StatCards total={rows.length} valid={rows.length} invalid={0} />

            {/* Edit Notice */}
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                <AlertTriangle size={13} className="flex-shrink-0" />
                Perubahan di halaman preview <strong>belum tersimpan ke database</strong>. Klik "Simpan PLO" setelah selesai meninjau.
            </div>

            {/* Preview Table */}
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Preview Data PLO ({rows.length} baris)
                    </p>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Eye size={11} /> Klik ikon edit untuk mengubah data
                    </span>
                </div>
                <div className="overflow-auto rounded-xl border border-gray-200 max-h-72">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                        <thead className="sticky top-0 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-3 py-3 w-10">No</th>
                                <th className="px-3 py-3 w-32">Kode PLO</th>
                                <th className="px-3 py-3">Deskripsi PLO</th>
                                <th className="px-3 py-3 w-20 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {rows.map((row, idx) => (
                                <tr
                                    key={row._localId}
                                    className={cn(
                                        'transition-colors',
                                        editingId === row._localId
                                            ? 'bg-blue-50'
                                            : 'hover:bg-gray-50',
                                    )}
                                >
                                    <td className="px-3 py-2.5 font-medium text-gray-500">{idx + 1}</td>

                                    {editingId === row._localId ? (
                                        <>
                                            <td className="px-2 py-1.5">
                                                <input
                                                    autoFocus
                                                    value={editKode}
                                                    onChange={(e) => setEditKode(e.target.value)}
                                                    className="w-full rounded-lg border border-blue-300 px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                    placeholder="Kode PLO"
                                                />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <input
                                                    value={editDeskripsi}
                                                    onChange={(e) => setEditDeskripsi(e.target.value)}
                                                    className="w-full rounded-lg border border-blue-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                    placeholder="Deskripsi PLO"
                                                />
                                            </td>
                                            <td className="px-2 py-1.5">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={saveEdit}
                                                        className="rounded-md bg-green-500 p-1.5 text-white hover:bg-green-600 transition"
                                                        title="Simpan"
                                                    >
                                                        <Check size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEdit}
                                                        className="rounded-md bg-gray-200 p-1.5 text-gray-600 hover:bg-gray-300 transition"
                                                        title="Batal"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-3 py-2.5 font-mono font-bold text-gray-800">
                                                {row.kode_plo}
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-600 max-w-xs truncate" title={row.deskripsi}>
                                                {row.deskripsi}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(row)}
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteRow(row._localId)}
                                                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-500 transition"
                                                        title="Hapus dari preview"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400">{rows.length} data siap disimpan</p>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={rows.length === 0}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Simpan PLO
                    <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
}

/* ── Step 4: Confirm ────────────────────────────────────────────── */

interface ConfirmStepProps {
    rowCount: number;
    onCancel: () => void;
    onConfirm: () => void;
    isSaving: boolean;
}

function ConfirmStep({ rowCount, onCancel, onConfirm, isSaving }: ConfirmStepProps) {
    return (
        <div className="flex flex-col items-center gap-6 py-6">
            {/* Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500 ring-8 ring-amber-50">
                <AlertTriangle size={36} />
            </div>

            {/* Text */}
            <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800">Simpan Data PLO?</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm leading-relaxed">
                    Pastikan seluruh data sudah sesuai sebelum disimpan. Data yang disimpan akan
                    masuk ke sistem dan dapat memengaruhi CLO terkait.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-bold text-blue-700">
                    <ChevronRight size={14} />
                    {rowCount} data PLO akan disimpan
                </div>
            </div>

            {/* Buttons */}
            <div className="flex w-full items-center justify-center gap-3 border-t border-gray-100 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition"
                >
                    Batal, Kembali
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSaving ? (
                        <>
                            <Loader2 size={15} className="animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Check size={15} />
                            Simpan Data
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

/* ── Step 5: Success ────────────────────────────────────────────── */

interface SuccessStepProps {
    result: ImportResult;
    onViewData: () => void;
    onUploadLagi: () => void;
}

function SuccessStep({ result, onViewData, onUploadLagi }: SuccessStepProps) {
    return (
        <div className="flex flex-col items-center gap-6 py-6">
            {/* Animated Icon */}
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-500">
                <CheckCircle2 size={48} className="drop-shadow-sm" />
                <div className="absolute -top-1 -right-1">
                    <PartyPopper size={22} className="text-amber-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping opacity-20" />
            </div>

            {/* Title */}
            <div className="text-center">
                <h3 className="text-xl font-extrabold text-gray-800">PLO Berhasil Disimpan!</h3>
                <p className="mt-1.5 text-sm text-gray-400">
                    Data PLO berhasil diimport dan tersimpan ke sistem akademik.
                </p>
            </div>

            {/* Stats */}
            <div className="grid w-full max-w-sm grid-cols-3 gap-3">
                <div className="flex flex-col items-center rounded-xl border border-green-200 bg-green-50 p-3">
                    <p className="text-xs font-semibold text-green-600">Tersimpan</p>
                    <p className="mt-1 text-2xl font-extrabold text-green-700">{result.created}</p>
                </div>
                <div className="flex flex-col items-center rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-semibold text-blue-600">Diperbarui</p>
                    <p className="mt-1 text-2xl font-extrabold text-blue-700">{result.updated ?? 0}</p>
                </div>
                <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">Total</p>
                    <p className="mt-1 text-2xl font-extrabold text-gray-800">{result.total}</p>
                </div>
            </div>

            {/* Timestamp */}
            <p className="text-xs text-gray-400">
                Import selesai pada <span className="font-semibold text-gray-500">{result.timestamp}</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center border-t border-gray-100 pt-4">
                <button
                    type="button"
                    onClick={onViewData}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
                >
                    <Eye size={15} />
                    Lihat Data PLO
                </button>
                <button
                    type="button"
                    onClick={onUploadLagi}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition"
                >
                    <Upload size={15} />
                    Upload PLO Lagi
                </button>
            </div>
        </div>
    );
}

/* ── Main Wizard ────────────────────────────────────────────────── */

export function PloUploadWizard({ open, onClose, onSuccess }: PloUploadWizardProps) {
    const [step, setStep] = useState<WizardStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [previewResult, setPreviewResult] = useState<ImportPreviewResult<PloImportPreviewRow> | null>(null);
    const [editableRows, setEditableRows] = useState<EditableRow[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    /* Reset when closed */
    useEffect(() => {
        if (!open) {
            setTimeout(() => {
                setStep('upload');
                setFile(null);
                setPreviewResult(null);
                setEditableRows([]);
                setImportResult(null);
                setIsSaving(false);
            }, 300);
        }
    }, [open]);

    /* Lock body scroll */
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    /* Escape key */
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && step !== 'validating' && !isSaving) onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, step, isSaving, onClose]);

    /* Download helper */
    const downloadBlob = (blob: Blob, name: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    /* Handle file selected → start validation */
    const handleFileSelected = async (selectedFile: File) => {
        setFile(selectedFile);
        setStep('validating');

        try {
            const result = await previewImportPlo(selectedFile);
            setPreviewResult(result);

            if (result.invalid > 0) {
                setStep('error-report');
            } else {
                const rows: EditableRow[] = result.rows
                    .filter((r) => r.status === 'valid')
                    .map((r, i) => ({ ...r, _localId: i }));
                setEditableRows(rows);
                setStep('preview');
            }
        } catch (err: any) {
            /* On API error, go back to upload with file cleared */
            setFile(null);
            setStep('upload');
        }
    };

    /* Download template */
    const handleDownloadTemplate = async () => {
        setIsDownloadingTemplate(true);
        try {
            const blob = await downloadTemplate('plos');
            downloadBlob(blob, 'template_plo.xlsx');
        } catch {
            /* silently fail — parent page toast handles it */
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    /* Download error report as CSV */
    const handleDownloadErrorReport = () => {
        if (!previewResult) return;
        const errorRows = previewResult.rows.filter((r) => r.status === 'invalid');
        const header = ['Baris,Kode PLO,Deskripsi,Kesalahan'];
        const lines = errorRows.flatMap((row) =>
            row.errors.map((err) => `${row.row},"${row.kode_plo}","${row.deskripsi}","${err}"`),
        );
        const csv = [...header, ...lines].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `plo_error_report_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    /* Save */
    const handleSave = async () => {
        if (!file) return;
        setIsSaving(true);

        try {
            const result = await importPlo(file);
            const ts = new Date().toLocaleString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
            });
            setImportResult({
                created: result.created,
                updated: undefined,
                total: result.total,
                timestamp: ts,
            });
            setStep('success');
            onSuccess();
        } catch {
            /* silently fail */
        } finally {
            setIsSaving(false);
        }
    };

    if (!open) return null;

    const STEP_TITLES: Record<WizardStep, string> = {
        upload: 'Upload File PLO',
        validating: 'Memvalidasi File...',
        'error-report': 'Laporan Kesalahan',
        preview: 'Preview Data PLO',
        confirm: 'Konfirmasi Penyimpanan',
        success: 'Import Berhasil',
    };

    const STEP_DESCRIPTIONS: Record<WizardStep, string> = {
        upload: 'Upload template Excel yang sudah diisi untuk diimport ke sistem',
        validating: 'Sistem sedang memeriksa format dan kelengkapan data',
        'error-report': 'Terdapat kesalahan pada data. Perbaiki file dan import ulang',
        preview: 'Tinjau dan edit data sebelum disimpan ke database',
        confirm: 'Konfirmasi sebelum data disimpan ke sistem',
        success: 'Data PLO berhasil diimport ke sistem akademik',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                    if (step !== 'validating' && !isSaving) onClose();
                }}
                aria-hidden="true"
            />

            {/* Panel */}
            <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl max-h-[92vh]">

                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-[var(--color-primary)]">
                            <FileSpreadsheet size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                {STEP_TITLES[step]}
                            </h2>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {STEP_DESCRIPTIONS[step]}
                            </p>
                        </div>
                    </div>
                    {step !== 'validating' && !isSaving && (
                        <button
                            onClick={onClose}
                            className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                            aria-label="Tutup"
                        >
                            <X size={17} />
                        </button>
                    )}
                </div>

                {/* Step Indicator (hide on success) */}
                {step !== 'success' && <StepIndicator current={step} />}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {step === 'upload' && (
                        <UploadStep
                            onFileSelected={handleFileSelected}
                            onDownloadTemplate={handleDownloadTemplate}
                            isDownloading={isDownloadingTemplate}
                        />
                    )}

                    {step === 'validating' && <ValidatingStep />}

                    {step === 'error-report' && previewResult && (
                        <ErrorReportStep
                            result={previewResult}
                            onImportUlang={() => {
                                setFile(null);
                                setPreviewResult(null);
                                setStep('upload');
                            }}
                            onDownloadError={handleDownloadErrorReport}
                        />
                    )}

                    {step === 'preview' && (
                        <PreviewStep
                            rows={editableRows}
                            onRowsChange={setEditableRows}
                            onConfirm={() => setStep('confirm')}
                        />
                    )}

                    {step === 'confirm' && (
                        <ConfirmStep
                            rowCount={editableRows.length}
                            onCancel={() => setStep('preview')}
                            onConfirm={handleSave}
                            isSaving={isSaving}
                        />
                    )}

                    {step === 'success' && importResult && (
                        <SuccessStep
                            result={importResult}
                            onViewData={onClose}
                            onUploadLagi={() => {
                                setStep('upload');
                                setFile(null);
                                setPreviewResult(null);
                                setEditableRows([]);
                                setImportResult(null);
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
