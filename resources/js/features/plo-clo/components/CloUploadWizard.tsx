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
    ChevronDown,
    Info,
    Plus,
    BookOpen,
    GraduationCap,
    Layers,
    Link2,
    Brain,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { previewImportClo, importClo } from '../api/cloApi';
import { downloadTemplate } from '../api/curriculumApi';
import type { CloImportPreviewRow, ImportPreviewResult } from '../types/plo.types';

/* ── Types ─────────────────────────────────────────────────────── */

type WizardStep =
    | 'upload'
    | 'validating'
    | 'error-report'
    | 'preview'
    | 'confirm'
    | 'success';

/* One CLO item in the editable tree */
interface CloTreeItem {
    _localId: number;
    kodeClo: string;
    deskripsi: string;
    bloom: string;
    ploKode: string;
    mataKuliah: string[];
}

/* PLO group node in the tree */
interface PloTreeNode {
    ploKode: string;
    clos: CloTreeItem[];
}

interface ImportResult {
    created: number;
    ploCount: number;
    mkCount: number;
    mappingCount: number;
    total: number;
    timestamp: string;
}

interface CloUploadWizardProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

/* ── Bloom levels ───────────────────────────────────────────────── */

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] as const;

const BLOOM_COLOR: Record<string, string> = {
    Remember: 'bg-gray-100 text-gray-600 border-gray-200',
    Understand: 'bg-blue-50 text-blue-600 border-blue-200',
    Apply: 'bg-green-50 text-green-600 border-green-200',
    Analyze: 'bg-amber-50 text-amber-600 border-amber-200',
    Evaluate: 'bg-orange-50 text-orange-600 border-orange-200',
    Create: 'bg-purple-50 text-purple-600 border-purple-200',
};

/* ── Helpers ────────────────────────────────────────────────────── */

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

let _localIdCounter = 0;
function nextId() { return ++_localIdCounter; }

/** Convert flat preview rows into PLO-grouped tree */
function buildTree(rows: CloImportPreviewRow[]): PloTreeNode[] {
    const validRows = rows.filter((r) => r.status === 'valid');
    const ploMap = new Map<string, Map<string, CloTreeItem>>();

    for (const row of validRows) {
        const ploKey = row.kode_plo || 'Tanpa PLO';
        const cloKey = row.kode_clo;

        if (!ploMap.has(ploKey)) ploMap.set(ploKey, new Map());
        const cloMap = ploMap.get(ploKey)!;

        if (!cloMap.has(cloKey)) {
            cloMap.set(cloKey, {
                _localId: nextId(),
                kodeClo: cloKey,
                deskripsi: row.deskripsi,
                bloom: (row as any).bloom || '',
                ploKode: ploKey,
                mataKuliah: row.kode_mk ? [row.kode_mk] : [],
            });
        } else {
            /* Aggregate MK for same CLO */
            const existing = cloMap.get(cloKey)!;
            if (row.kode_mk && !existing.mataKuliah.includes(row.kode_mk)) {
                existing.mataKuliah.push(row.kode_mk);
            }
        }
    }

    const nodes: PloTreeNode[] = [];
    ploMap.forEach((cloMap, ploKode) => {
        nodes.push({ ploKode, clos: Array.from(cloMap.values()) });
    });
    return nodes.sort((a, b) => a.ploKode.localeCompare(b.ploKode));
}

/** Flatten tree back to rows for stats */
function flattenTree(nodes: PloTreeNode[]) {
    const clos = nodes.flatMap((n) => n.clos);
    const mappings = clos.flatMap((c) => c.mataKuliah.map((mk) => ({ clo: c.kodeClo, mk })));
    const ploSet = new Set(nodes.map((n) => n.ploKode));
    const mkSet = new Set(clos.flatMap((c) => c.mataKuliah));
    return { cloCount: clos.length, ploCount: ploSet.size, mkCount: mkSet.size, mappingCount: mappings.length };
}

/* ── Step Indicator ─────────────────────────────────────────────── */

const STEPS_DEF = [
    { label: 'Upload' },
    { label: 'Validasi' },
    { label: 'Preview' },
    { label: 'Simpan' },
];

const STEP_IDX: Record<WizardStep, number> = {
    upload: 0,
    validating: 1,
    'error-report': 1,
    preview: 2,
    confirm: 3,
    success: 3,
};

function StepIndicator({ current }: { current: WizardStep }) {
    const idx = STEP_IDX[current];
    return (
        <div className="flex items-center gap-0 px-6 py-4 border-b border-gray-100">
            {STEPS_DEF.map((step, i) => {
                const done = i < idx;
                const active = i === idx;
                const isLast = i === STEPS_DEF.length - 1;
                return (
                    <div key={i} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                            <div className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all',
                                done && 'bg-green-500 text-white',
                                active && 'bg-[var(--color-primary)] text-white ring-4 ring-red-100',
                                !done && !active && 'bg-gray-100 text-gray-400',
                            )}>
                                {done ? <Check size={14} /> : i + 1}
                            </div>
                            <span className={cn(
                                'text-[10px] font-semibold whitespace-nowrap',
                                active && 'text-[var(--color-primary)]',
                                done && 'text-green-600',
                                !done && !active && 'text-gray-400',
                            )}>{step.label}</span>
                        </div>
                        {!isLast && (
                            <div className={cn(
                                'h-0.5 flex-1 mx-2 mb-4 rounded transition-all',
                                i < idx ? 'bg-green-400' : 'bg-gray-200',
                            )} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ── Step 1: Upload ─────────────────────────────────────────────── */

function UploadStep({
    onFileSelected,
    onDownloadTemplate,
    isDownloading,
}: {
    onFileSelected: (f: File) => void;
    onDownloadTemplate: () => void;
    isDownloading: boolean;
}) {
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls'))) setFile(f);
    }, []);

    const MAX = 5 * 1024 * 1024;
    const tooLarge = file ? file.size > MAX : false;

    return (
        <div className="space-y-5">
            {/* Info banner */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                <Info size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
                <div className="text-xs text-blue-700 leading-relaxed">
                    <p className="font-semibold mb-1">Cara Import CLO & Pemetaan:</p>
                    <ol className="list-decimal ml-4 space-y-0.5">
                        <li>Download template Excel dan isi kolom: PLO, Kode CLO, Deskripsi, Bloom, Mata Kuliah</li>
                        <li>Setiap baris merepresentasikan <strong>satu relasi</strong> PLO ↔ CLO ↔ Mata Kuliah</li>
                        <li>Pastikan PLO dan Mata Kuliah sudah terdaftar di sistem sebelum import</li>
                    </ol>
                </div>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !file && inputRef.current?.click()}
                className={cn(
                    'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-all duration-200',
                    dragOver ? 'border-[var(--color-primary)] bg-red-50 scale-[1.01]' : 'border-gray-300 bg-gray-50 hover:border-[var(--color-primary)] hover:bg-red-50/40',
                    !file && 'cursor-pointer',
                )}
            >
                <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }} />

                {!file ? (
                    <>
                        <div className={cn(
                            'flex h-16 w-16 items-center justify-center rounded-2xl transition-colors',
                            dragOver ? 'bg-[var(--color-primary)] text-white' : 'bg-white border border-gray-200 text-gray-400',
                        )}>
                            <Upload size={28} />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">Drag & drop file Excel di sini</p>
                            <p className="mt-1 text-xs text-gray-400">atau klik untuk memilih file</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition">
                            Pilih File
                        </button>
                    </>
                ) : (
                    <div className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <FileSpreadsheet size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-800">{file.name}</p>
                            <p className={cn('text-xs mt-0.5', tooLarge ? 'text-red-500' : 'text-gray-400')}>
                                {formatBytes(file.size)}{tooLarge && ' — Melebihi batas 5MB'}
                            </p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
                            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition" title="Hapus file">
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Template columns preview */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Kolom Template Excel</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                        <thead className="bg-green-50">
                            <tr>
                                {['PLO', 'Kode CLO', 'Deskripsi CLO', 'Bloom', 'Mata Kuliah'].map((col) => (
                                    <th key={col} className="px-3 py-2 text-left font-bold text-green-700 border-b border-green-200">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {[
                                ['PLO-01', 'CLO-01', 'Mampu memahami konsep sistem informasi', 'Understand', 'Sistem Informasi'],
                                ['PLO-01', 'CLO-02', 'Mampu merancang sistem informasi', 'Apply', 'Analisis Sistem'],
                                ['PLO-02', 'CLO-03', 'Mampu mengembangkan aplikasi web', 'Create', 'Pemrograman Web'],
                            ].map((row, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    {row.map((cell, j) => (
                                        <td key={j} className={cn('px-3 py-1.5 text-gray-600', j === 0 && 'font-mono font-bold text-blue-700', j === 1 && 'font-mono font-semibold text-gray-800')}>{cell}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ketentuan */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">Ketentuan File</p>
                <ul className="space-y-1.5">
                    {[
                        'Format file: .xlsx atau .xls',
                        `Ukuran file maksimum: 5 MB${tooLarge ? ' ✗' : ''}`,
                        'Gunakan template resmi sistem',
                        'PLO harus sudah terdaftar di sistem',
                        'Mata Kuliah harus sudah terdaftar di sistem',
                        'Bloom: Remember / Understand / Apply / Analyze / Evaluate / Create',
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <span className={cn('flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-white', tooLarge && i === 1 ? 'bg-red-400' : 'bg-green-400')}>
                                {tooLarge && i === 1 ? <X size={10} /> : <Check size={10} />}
                            </span>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <button type="button" onClick={onDownloadTemplate} disabled={isDownloading}
                    className="flex items-center gap-2 text-xs font-semibold text-[var(--color-primary)] hover:underline disabled:opacity-50">
                    {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    Download Template CLO & Mapping
                </button>
                <button type="button" onClick={() => file && onFileSelected(file)} disabled={!file || tooLarge}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-40">
                    Validasi File <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
}

/* ── Step 2: Validating ─────────────────────────────────────────── */

function ValidatingStep() {
    const items = ['Format file', 'Header kolom', 'PLO valid', 'Kode CLO', 'Deskripsi CLO', 'Level Bloom', 'Mata Kuliah valid', 'Mapping PLO↔CLO↔MK'];
    return (
        <div className="flex flex-col items-center justify-center gap-6 py-12">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                <Loader2 size={36} className="animate-spin text-blue-500" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-20" />
            </div>
            <div className="text-center">
                <p className="text-base font-bold text-gray-800">Memvalidasi Data CLO & Mapping...</p>
                <p className="mt-1 text-sm text-gray-400">Sistem sedang memeriksa struktur dan relasi data</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-xl border border-gray-200 bg-gray-50 px-6 py-4">
                {items.map((label) => (
                    <span key={label} className="flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 size={11} className="animate-spin text-blue-400 flex-shrink-0" />
                        {label}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ── Stat Cards (extended) ──────────────────────────────────────── */

interface CloStatCardsProps {
    total: number;
    valid: number;
    invalid: number;
    cloCount?: number;
    ploCount?: number;
    mkCount?: number;
    mappingCount?: number;
}

function CloStatCards({ total, valid, invalid, cloCount, ploCount, mkCount, mappingCount }: CloStatCardsProps) {
    return (
        <div className="space-y-2.5">
            <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Baris</p>
                    <p className="mt-1.5 text-xl font-extrabold text-gray-800">{total}</p>
                </div>
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-green-500">Valid</p>
                    <p className="mt-1.5 text-xl font-extrabold text-green-700">{valid}</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Invalid</p>
                    <p className="mt-1.5 text-xl font-extrabold text-red-600">{invalid}</p>
                </div>
            </div>
            {(cloCount !== undefined) && (
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { icon: Layers, label: 'CLO', value: cloCount, color: 'text-violet-600 bg-violet-50 border-violet-200' },
                        { icon: GraduationCap, label: 'PLO', value: ploCount ?? 0, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                        { icon: BookOpen, label: 'Mata Kuliah', value: mkCount ?? 0, color: 'text-green-600 bg-green-50 border-green-200' },
                        { icon: Link2, label: 'Mapping', value: mappingCount ?? 0, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                    ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className={cn('rounded-xl border p-3 text-center', color)}>
                            <Icon size={14} className="mx-auto mb-1 opacity-70" />
                            <p className="text-lg font-extrabold">{value}</p>
                            <p className="text-[10px] font-semibold opacity-70">{label}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Step 3a: Error Report ──────────────────────────────────────── */

function ErrorReportStep({
    result,
    onImportUlang,
    onDownloadError,
}: {
    result: ImportPreviewResult<CloImportPreviewRow>;
    onImportUlang: () => void;
    onDownloadError: () => void;
}) {
    const errorRows = result.rows.filter((r) => r.status === 'invalid');

    const mapField = (err: string): { field: string; type: string } => {
        if (err.toLowerCase().includes('plo')) return { field: 'PLO', type: err.includes('tidak ditemukan') || err.includes('not found') ? 'PLO Tidak Ditemukan' : 'PLO Tidak Valid' };
        if (err.toLowerCase().includes('bloom')) return { field: 'Bloom', type: 'Level Tidak Valid' };
        if (err.toLowerCase().includes('mata kuliah') || err.toLowerCase().includes('mk') || err.toLowerCase().includes('course')) return { field: 'Mata Kuliah', type: 'MK Tidak Ditemukan' };
        if (err.toLowerCase().includes('duplikat') || err.toLowerCase().includes('duplicate')) return { field: 'Mapping', type: 'Data Duplikat' };
        if (err.toLowerCase().includes('kode') || err.toLowerCase().includes('clo')) return { field: 'Kode CLO', type: 'Format Tidak Valid' };
        if (err.toLowerCase().includes('deskripsi')) return { field: 'Deskripsi', type: 'Wajib Diisi' };
        return { field: '—', type: 'Kesalahan' };
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <XCircle size={20} className="flex-shrink-0 text-red-500" />
                <div>
                    <p className="text-sm font-bold text-red-700">Validasi Gagal</p>
                    <p className="text-xs text-red-500">{result.invalid} baris bermasalah. Perbaiki file Excel lalu import ulang.</p>
                </div>
            </div>

            <CloStatCards total={result.total} valid={result.valid} invalid={result.invalid} />

            <div>
                <p className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Detail Kesalahan</p>
                <div className="overflow-auto rounded-xl border border-gray-200 max-h-64">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                        <thead className="sticky top-0 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="px-3 py-3 w-16">Baris</th>
                                <th className="px-3 py-3 w-24">Kode CLO</th>
                                <th className="px-3 py-3 w-24">Field</th>
                                <th className="px-3 py-3 w-32">Jenis Error</th>
                                <th className="px-3 py-3">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {errorRows.map((row) =>
                                row.errors.map((err, i) => {
                                    const { field, type } = mapField(err);
                                    return (
                                        <tr key={`${row.row}-${i}`} className="bg-red-50/60">
                                            <td className="px-3 py-2.5 font-mono font-bold text-red-600">Baris {row.row}</td>
                                            <td className="px-3 py-2.5 font-mono font-semibold text-gray-700">{row.kode_clo || '—'}</td>
                                            <td className="px-3 py-2.5">
                                                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{field}</span>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">{type}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-500 max-w-[180px] truncate" title={err}>{err}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <button type="button" onClick={onDownloadError}
                    className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition">
                    <Download size={13} /> Download Error Report
                </button>
                <button type="button" onClick={onImportUlang}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-dark)] transition">
                    <RefreshCw size={14} /> Import Ulang
                </button>
            </div>
        </div>
    );
}

/* ── Bloom Badge ────────────────────────────────────────────────── */

function BloomBadge({ bloom }: { bloom: string }) {
    const cls = BLOOM_COLOR[bloom] || 'bg-gray-100 text-gray-600 border-gray-200';
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold', cls)}>
            <Brain size={9} />
            {bloom || '—'}
        </span>
    );
}

/* ── CLO Edit Modal (inline) ────────────────────────────────────── */

interface EditCloFormData {
    kodeClo: string;
    deskripsi: string;
    bloom: string;
    ploKode: string;
}

function EditCloPanel({
    item,
    allPlo,
    onSave,
    onCancel,
}: {
    item: CloTreeItem;
    allPlo: string[];
    onSave: (d: EditCloFormData) => void;
    onCancel: () => void;
}) {
    const [form, setForm] = useState<EditCloFormData>({
        kodeClo: item.kodeClo,
        deskripsi: item.deskripsi,
        bloom: item.bloom,
        ploKode: item.ploKode,
    });

    return (
        <div className="ml-6 mt-2 mb-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <p className="text-xs font-bold text-blue-700">Edit CLO</p>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Kode CLO *</label>
                    <input value={form.kodeClo} onChange={(e) => setForm({ ...form, kodeClo: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-mono focus:border-blue-400 focus:outline-none"
                        placeholder="CLO-01" />
                </div>
                <div>
                    <label className="block text-[10px] font-semibold text-gray-600 mb-1">Bloom Level *</label>
                    <select value={form.bloom} onChange={(e) => setForm({ ...form, bloom: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none bg-white">
                        <option value="">— Pilih Level —</option>
                        {BLOOM_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-semibold text-gray-600 mb-1">Deskripsi CLO *</label>
                <textarea rows={2} value={form.deskripsi} onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none resize-none"
                    placeholder="Deskripsi kompetensi..." />
            </div>
            <div>
                <label className="block text-[10px] font-semibold text-gray-600 mb-1">PLO Induk</label>
                <select value={form.ploKode} onChange={(e) => setForm({ ...form, ploKode: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-blue-400 focus:outline-none bg-white">
                    {allPlo.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2 pt-1">
                <button type="button" onClick={() => onSave(form)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition">
                    <Check size={12} /> Simpan Perubahan
                </button>
                <button type="button" onClick={onCancel}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">
                    Batal
                </button>
            </div>
        </div>
    );
}

/* ── Add MK Panel ───────────────────────────────────────────────── */

function AddMkPanel({
    onAdd,
    onCancel,
}: { existingMk: string[]; onAdd: (mk: string) => void; onCancel: () => void }) {
    const [value, setValue] = useState('');
    return (
        <div className="flex items-center gap-2 mt-2 ml-10">
            <input autoFocus value={value} onChange={(e) => setValue(e.target.value)}
                placeholder="Nama Mata Kuliah..." onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onAdd(value.trim()); if (e.key === 'Escape') onCancel(); }}
                className="flex-1 rounded-lg border border-dashed border-green-400 bg-green-50 px-3 py-1.5 text-xs focus:outline-none focus:border-green-500" />
            <button type="button" onClick={() => value.trim() && onAdd(value.trim())}
                className="rounded-lg bg-green-500 p-1.5 text-white hover:bg-green-600 transition"><Check size={12} /></button>
            <button type="button" onClick={onCancel}
                className="rounded-lg bg-gray-200 p-1.5 text-gray-600 hover:bg-gray-300 transition"><X size={12} /></button>
        </div>
    );
}

/* ── Step 3b: Preview Tree ──────────────────────────────────────── */

function PreviewTreeStep({
    nodes,
    onNodesChange,
    onConfirm,
}: {
    nodes: PloTreeNode[];
    onNodesChange: (n: PloTreeNode[]) => void;
    onConfirm: () => void;
}) {
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<number | null>(null);
    const [addingMkFor, setAddingMkFor] = useState<number | null>(null);
    const [deletingMkFor, setDeletingMkFor] = useState<{ id: number; mk: string } | null>(null);
    const [deletingCloId, setDeletingCloId] = useState<number | null>(null);

    const stats = flattenTree(nodes);

    const toggleCollapse = (plo: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            next.has(plo) ? next.delete(plo) : next.add(plo);
            return next;
        });
    };

    const updateItem = (localId: number, data: Partial<CloTreeItem>) => {
        const updated: PloTreeNode[] = [];
        for (const node of nodes) {
            const newClos = node.clos.map((c) => c._localId === localId ? { ...c, ...data } : c);
            updated.push({ ...node, clos: newClos });
        }
        // Re-group if PLO changed
        const regrouped: PloTreeNode[] = [];
        for (const node of updated) {
            const staying = node.clos.filter((c) => c.ploKode === node.ploKode);
            const leaving = node.clos.filter((c) => c.ploKode !== node.ploKode);
            if (staying.length > 0) regrouped.push({ ...node, clos: staying });
            for (const moved of leaving) {
                const existingNode = regrouped.find((n) => n.ploKode === moved.ploKode);
                if (existingNode) existingNode.clos.push(moved);
                else regrouped.push({ ploKode: moved.ploKode, clos: [moved] });
            }
        }
        onNodesChange(regrouped.filter((n) => n.clos.length > 0).sort((a, b) => a.ploKode.localeCompare(b.ploKode)));
        setEditingId(null);
    };

    const deleteClo = (localId: number) => {
        const updated = nodes.map((n) => ({ ...n, clos: n.clos.filter((c) => c._localId !== localId) })).filter((n) => n.clos.length > 0);
        onNodesChange(updated);
        setDeletingCloId(null);
    };

    const addMk = (localId: number, mk: string) => {
        const updated = nodes.map((n) => ({
            ...n,
            clos: n.clos.map((c) =>
                c._localId === localId && !c.mataKuliah.includes(mk) ? { ...c, mataKuliah: [...c.mataKuliah, mk] } : c
            ),
        }));
        onNodesChange(updated);
        setAddingMkFor(null);
    };

    const removeMk = (localId: number, mk: string) => {
        const updated = nodes.map((n) => ({
            ...n,
            clos: n.clos.map((c) =>
                c._localId === localId ? { ...c, mataKuliah: c.mataKuliah.filter((m) => m !== mk) } : c
            ),
        }));
        onNodesChange(updated);
        setDeletingMkFor(null);
    };

    const allPlo = nodes.map((n) => n.ploKode);

    return (
        <div className="space-y-4">
            {/* Status banner */}
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <CheckCircle2 size={20} className="flex-shrink-0 text-green-500" />
                <div>
                    <p className="text-sm font-bold text-green-700">Validasi Berhasil!</p>
                    <p className="text-xs text-green-600">Tinjau struktur mapping sebelum menyimpan ke database.</p>
                </div>
            </div>

            <CloStatCards total={stats.cloCount + stats.mappingCount} valid={stats.cloCount + stats.mappingCount} invalid={0}
                cloCount={stats.cloCount} ploCount={stats.ploCount} mkCount={stats.mkCount} mappingCount={stats.mappingCount} />

            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
                <AlertTriangle size={13} className="flex-shrink-0" />
                Perubahan pada preview <strong>belum tersimpan ke database</strong>. Klik "Simpan CLO & Mapping" setelah selesai meninjau.
            </div>

            {/* Tree */}
            <div>
                <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Struktur Mapping PLO → CLO → Mata Kuliah
                    </p>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Eye size={11} /> Klik ▼ untuk expand/collapse
                    </span>
                </div>

                <div className="overflow-y-auto max-h-[340px] space-y-2 pr-1">
                    {nodes.map((node) => {
                        const isCollapsed = collapsed.has(node.ploKode);
                        return (
                            <div key={node.ploKode} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                                {/* PLO Header */}
                                <button type="button" onClick={() => toggleCollapse(node.ploKode)}
                                    className="flex w-full items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition border-b border-gray-200 text-left">
                                    {isCollapsed ? <ChevronRight size={15} className="flex-shrink-0 text-gray-400" /> : <ChevronDown size={15} className="flex-shrink-0 text-gray-400" />}
                                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                        <GraduationCap size={14} />
                                    </div>
                                    <span className="font-mono font-bold text-sm text-blue-800">{node.ploKode}</span>
                                    <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-gray-200 rounded-full px-2 py-0.5">
                                        {node.clos.length} CLO
                                    </span>
                                </button>

                                {/* CLO Items */}
                                {!isCollapsed && (
                                    <div className="divide-y divide-gray-100">
                                        {node.clos.map((clo) => (
                                            <div key={clo._localId}>
                                                {/* CLO Row */}
                                                <div className="px-4 py-3">
                                                    <div className="flex items-start gap-3">
                                                        {/* CLO code + bloom */}
                                                        <div className="ml-4 flex flex-col gap-1 flex-shrink-0 min-w-[90px]">
                                                            <span className="font-mono font-bold text-xs text-gray-800">{clo.kodeClo}</span>
                                                            <BloomBadge bloom={clo.bloom} />
                                                        </div>

                                                        {/* Deskripsi + MK list */}
                                                        <div className="flex-1 min-w-0">
                                                            {editingId === clo._localId ? null : (
                                                                <>
                                                                    <p className="text-xs text-gray-600 mb-2 leading-relaxed">{clo.deskripsi}</p>
                                                                    {/* MK badges */}
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {clo.mataKuliah.map((mk) => (
                                                                            <span key={mk} className="group inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold text-green-700">
                                                                                <BookOpen size={9} />
                                                                                {mk}
                                                                                <button type="button"
                                                                                    onClick={() => setDeletingMkFor({ id: clo._localId, mk })}
                                                                                    className="opacity-0 group-hover:opacity-100 transition ml-0.5 hover:text-red-500">
                                                                                    <X size={9} />
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                        <button type="button" onClick={() => setAddingMkFor(clo._localId)}
                                                                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-0.5 text-[10px] font-semibold text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition">
                                                                            <Plus size={9} /> Tambah MK
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Actions */}
                                                        {editingId !== clo._localId && (
                                                            <div className="flex flex-shrink-0 items-center gap-1 ml-2">
                                                                <button type="button" onClick={() => setEditingId(clo._localId)}
                                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-blue-100 hover:text-blue-600 transition" title="Edit CLO">
                                                                    <Pencil size={12} />
                                                                </button>
                                                                <button type="button" onClick={() => setDeletingCloId(clo._localId)}
                                                                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-500 transition" title="Hapus CLO">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Add MK panel */}
                                                    {addingMkFor === clo._localId && (
                                                        <AddMkPanel existingMk={clo.mataKuliah}
                                                            onAdd={(mk) => addMk(clo._localId, mk)}
                                                            onCancel={() => setAddingMkFor(null)} />
                                                    )}
                                                </div>

                                                {/* Edit CLO panel */}
                                                {editingId === clo._localId && (
                                                    <EditCloPanel item={clo} allPlo={allPlo}
                                                        onSave={(d) => updateItem(clo._localId, { kodeClo: d.kodeClo, deskripsi: d.deskripsi, bloom: d.bloom, ploKode: d.ploKode })}
                                                        onCancel={() => setEditingId(null)} />
                                                )}

                                                {/* Delete MK confirm */}
                                                {deletingMkFor?.id === clo._localId && (
                                                    <div className="mx-4 mb-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs">
                                                        <AlertTriangle size={13} className="flex-shrink-0 text-red-500" />
                                                        <span className="flex-1 text-red-700">Hapus mapping <strong>{deletingMkFor.mk}</strong> dari {clo.kodeClo}?</span>
                                                        <button type="button" onClick={() => removeMk(clo._localId, deletingMkFor.mk)}
                                                            className="rounded-md bg-red-500 px-2.5 py-1 text-white hover:bg-red-600 transition font-semibold">Hapus</button>
                                                        <button type="button" onClick={() => setDeletingMkFor(null)}
                                                            className="rounded-md border border-gray-300 px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition font-semibold">Batal</button>
                                                    </div>
                                                )}

                                                {/* Delete CLO confirm */}
                                                {deletingCloId === clo._localId && (
                                                    <div className="mx-4 mb-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs">
                                                        <AlertTriangle size={13} className="flex-shrink-0 text-red-500" />
                                                        <span className="flex-1 text-red-700">Hapus <strong>{clo.kodeClo}</strong> beserta seluruh mapping-nya dari preview?</span>
                                                        <button type="button" onClick={() => deleteClo(clo._localId)}
                                                            className="rounded-md bg-red-500 px-2.5 py-1 text-white hover:bg-red-600 transition font-semibold">Hapus</button>
                                                        <button type="button" onClick={() => setDeletingCloId(null)}
                                                            className="rounded-md border border-gray-300 px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition font-semibold">Batal</button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400">{stats.cloCount} CLO · {stats.mappingCount} mapping siap disimpan</p>
                <button type="button" onClick={onConfirm} disabled={stats.cloCount === 0}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-dark)] disabled:cursor-not-allowed disabled:opacity-40 transition">
                    Simpan CLO & Mapping <ArrowRight size={15} />
                </button>
            </div>
        </div>
    );
}

/* ── Step 4: Confirm ────────────────────────────────────────────── */

function ConfirmStep({
    stats,
    onCancel,
    onConfirm,
    isSaving,
}: {
    stats: ReturnType<typeof flattenTree>;
    onCancel: () => void;
    onConfirm: () => void;
    isSaving: boolean;
}) {
    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-500 ring-8 ring-amber-50">
                <AlertTriangle size={36} />
            </div>
            <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800">Simpan Data CLO & Mapping?</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm leading-relaxed">
                    Pastikan seluruh CLO dan mapping PLO serta Mata Kuliah telah sesuai. Data akan disimpan ke dalam sistem.
                </p>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
                {[
                    { icon: Layers, label: 'CLO', value: stats.cloCount, color: 'text-violet-700 bg-violet-50 border-violet-200' },
                    { icon: GraduationCap, label: 'PLO', value: stats.ploCount, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                    { icon: BookOpen, label: 'Mata Kuliah', value: stats.mkCount, color: 'text-green-700 bg-green-50 border-green-200' },
                    { icon: Link2, label: 'Mapping', value: stats.mappingCount, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className={cn('flex flex-col items-center rounded-xl border p-3', color)}>
                        <Icon size={14} className="mb-1 opacity-60" />
                        <p className="text-xl font-extrabold">{value}</p>
                        <p className="text-[10px] font-semibold opacity-60">{label}</p>
                    </div>
                ))}
            </div>

            <div className="flex w-full items-center justify-center gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={onCancel} disabled={isSaving}
                    className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition">
                    Batal, Kembali
                </button>
                <button type="button" onClick={onConfirm} disabled={isSaving}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition">
                    {isSaving ? <><Loader2 size={15} className="animate-spin" /> Menyimpan...</> : <><Check size={15} /> Simpan Data</>}
                </button>
            </div>
        </div>
    );
}

/* ── Step 5: Success ────────────────────────────────────────────── */

function SuccessStep({
    result,
    onViewData,
    onUploadLagi,
}: {
    result: ImportResult;
    onViewData: () => void;
    onUploadLagi: () => void;
}) {
    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-500">
                <CheckCircle2 size={48} />
                <div className="absolute -top-1 -right-1"><PartyPopper size={22} className="text-amber-400" /></div>
                <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping opacity-20" />
            </div>
            <div className="text-center">
                <h3 className="text-xl font-extrabold text-gray-800">Data CLO & Mapping Berhasil Disimpan!</h3>
                <p className="mt-1.5 text-sm text-gray-400">Pemetaan kurikulum berhasil diimport ke sistem akademik.</p>
            </div>

            <div className="grid grid-cols-4 gap-2 w-full max-w-sm">
                {[
                    { label: 'CLO Tersimpan', value: result.created, color: 'border-violet-200 bg-violet-50 text-violet-700' },
                    { label: 'PLO Terhubung', value: result.ploCount, color: 'border-blue-200 bg-blue-50 text-blue-700' },
                    { label: 'MK Terhubung', value: result.mkCount, color: 'border-green-200 bg-green-50 text-green-700' },
                    { label: 'Mapping Dibuat', value: result.mappingCount, color: 'border-amber-200 bg-amber-50 text-amber-700' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={cn('flex flex-col items-center rounded-xl border p-3 text-center', color)}>
                        <p className="text-2xl font-extrabold">{value}</p>
                        <p className="text-[10px] font-semibold opacity-70 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            <p className="text-xs text-gray-400">
                Import selesai pada <span className="font-semibold text-gray-500">{result.timestamp}</span>
            </p>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center border-t border-gray-100 pt-4">
                <button type="button" onClick={onViewData}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-dark)] transition">
                    <Eye size={15} /> Lihat Data CLO
                </button>
                <button type="button" onClick={onUploadLagi}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition">
                    <Upload size={15} /> Upload Data Lagi
                </button>
            </div>
        </div>
    );
}

/* ── Main Wizard ────────────────────────────────────────────────── */

export function CloUploadWizard({ open, onClose, onSuccess }: CloUploadWizardProps) {
    const [step, setStep] = useState<WizardStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [previewResult, setPreviewResult] = useState<ImportPreviewResult<CloImportPreviewRow> | null>(null);
    const [treeNodes, setTreeNodes] = useState<PloTreeNode[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    /* Lock scroll */
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
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

    /* Reset on close */
    useEffect(() => {
        if (!open) {
            const t = setTimeout(() => {
                setStep('upload'); setFile(null); setPreviewResult(null);
                setTreeNodes([]); setImportResult(null); setIsSaving(false);
            }, 300);
            return () => clearTimeout(t);
        }
    }, [open]);

    const downloadBlob = (blob: Blob, name: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
    };

    const handleFileSelected = async (selectedFile: File) => {
        setFile(selectedFile);
        setStep('validating');
        try {
            const result = await previewImportClo(selectedFile);
            setPreviewResult(result);
            if (result.invalid > 0) {
                setStep('error-report');
            } else {
                setTreeNodes(buildTree(result.rows));
                setStep('preview');
            }
        } catch {
            setFile(null);
            setStep('upload');
        }
    };

    const handleDownloadTemplate = async () => {
        setIsDownloadingTemplate(true);
        try {
            const blob = await downloadTemplate('clos_mapping');
            downloadBlob(blob, 'template_clo_mapping.xlsx');
        } catch { /* silent */ } finally { setIsDownloadingTemplate(false); }
    };

    const handleDownloadErrorReport = () => {
        if (!previewResult) return;
        const errorRows = previewResult.rows.filter((r) => r.status === 'invalid');
        const header = ['Baris,Kode CLO,Kode MK,Kode PLO,Kesalahan'];
        const lines = errorRows.flatMap((r) =>
            r.errors.map((err) => `${r.row},"${r.kode_clo}","${r.kode_mk}","${r.kode_plo}","${err}"`)
        );
        const blob = new Blob([[...header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
        downloadBlob(blob, `clo_error_report_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const handleSave = async () => {
        if (!file) return;
        setIsSaving(true);
        try {
            const result = await importClo(file);
            const stats = flattenTree(treeNodes);
            const ts = new Date().toLocaleString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            setImportResult({
                created: result.created,
                ploCount: stats.ploCount,
                mkCount: stats.mkCount,
                mappingCount: stats.mappingCount,
                total: result.total,
                timestamp: ts,
            });
            setStep('success');
            onSuccess();
        } catch { /* silent */ } finally { setIsSaving(false); }
    };

    if (!open) return null;

    const TITLES: Record<WizardStep, string> = {
        upload: 'Upload CLO & Pemetaan Kurikulum',
        validating: 'Memvalidasi File...',
        'error-report': 'Laporan Kesalahan Validasi',
        preview: 'Preview CLO & Mapping',
        confirm: 'Konfirmasi Penyimpanan',
        success: 'Import Berhasil',
    };
    const DESCS: Record<WizardStep, string> = {
        upload: 'Import CLO dan pemetaan PLO ↔ CLO ↔ Mata Kuliah via template Excel',
        validating: 'Sistem sedang memverifikasi struktur, relasi PLO, CLO, Bloom, dan Mata Kuliah',
        'error-report': 'Terdapat data bermasalah. Perbaiki file dan import ulang',
        preview: 'Tinjau dan edit struktur mapping sebelum disimpan ke database',
        confirm: 'Konfirmasi sebelum CLO & mapping disimpan ke sistem',
        success: 'CLO dan pemetaan kurikulum berhasil diimport',
    };

    const treeStats = flattenTree(treeNodes);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => { if (step !== 'validating' && !isSaving) onClose(); }}
                aria-hidden="true" />

            {/* Panel */}
            <div className="relative z-10 flex w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl max-h-[92vh]">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">{TITLES[step]}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{DESCS[step]}</p>
                        </div>
                    </div>
                    {step !== 'validating' && !isSaving && (
                        <button onClick={onClose}
                            className="ml-4 flex-shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                            aria-label="Tutup">
                            <X size={17} />
                        </button>
                    )}
                </div>

                {/* Step indicator */}
                {step !== 'success' && <StepIndicator current={step} />}

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {step === 'upload' && (
                        <UploadStep onFileSelected={handleFileSelected}
                            onDownloadTemplate={handleDownloadTemplate}
                            isDownloading={isDownloadingTemplate} />
                    )}
                    {step === 'validating' && <ValidatingStep />}
                    {step === 'error-report' && previewResult && (
                        <ErrorReportStep result={previewResult}
                            onImportUlang={() => { setFile(null); setPreviewResult(null); setStep('upload'); }}
                            onDownloadError={handleDownloadErrorReport} />
                    )}
                    {step === 'preview' && (
                        <PreviewTreeStep nodes={treeNodes} onNodesChange={setTreeNodes}
                            onConfirm={() => setStep('confirm')} />
                    )}
                    {step === 'confirm' && (
                        <ConfirmStep stats={treeStats} onCancel={() => setStep('preview')}
                            onConfirm={handleSave} isSaving={isSaving} />
                    )}
                    {step === 'success' && importResult && (
                        <SuccessStep result={importResult} onViewData={onClose}
                            onUploadLagi={() => { setStep('upload'); setFile(null); setPreviewResult(null); setTreeNodes([]); setImportResult(null); }} />
                    )}
                </div>
            </div>
        </div>
    );
}
