import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/shared/components/ui/Modal';
import type { VerifikasiFormData, CatatanCloItem } from '../types/verifikasi.types';
import type { Soal } from '@/features/soal/types/soal.types';
import type { Clo } from '@/features/plo-clo/types/plo.types';
import { useAuth } from '@/shared/hooks/useAuth';
import { getCloList } from '@/features/plo-clo/api/cloApi';
import { FileText, Download, CheckCircle2, AlertTriangle, XCircle, BookOpen, MessageSquare } from 'lucide-react';

const schema = z.object({
    status: z.enum(['approved', 'revisi', 'rejected']),
    tipe_verifikator: z.enum(['pic', 'coordinator']),
    catatan: z.string().optional(),
}).refine((data) => {
    if (data.status !== 'approved' && (!data.catatan || data.catatan.trim().length === 0)) {
        return false;
    }
    return true;
}, {
    message: 'Catatan umum wajib diisi apabila hasil verifikasi adalah Perlu Revisi atau Ditolak',
    path: ['catatan'],
});

interface VerifikasiModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: VerifikasiFormData) => void;
    soal: Soal | null;
    loading?: boolean;
}

export function VerifikasiModal({
    open,
    onClose,
    onSubmit,
    soal,
    loading = false,
}: VerifikasiModalProps) {
    const { role } = useAuth();
    const verifierType: 'pic' | 'coordinator' = role === 'coordinator' ? 'coordinator' : 'pic';

    const [clos, setClos] = useState<Clo[]>([]);
    const [loadingClos, setLoadingClos] = useState(false);

    // State for per-CLO notes & per-CLO status
    const [cloNotes, setCloNotes] = useState<Record<number, string>>({});
    const [cloStatus, setCloStatus] = useState<Record<number, 'sesuai' | 'revisi' | 'tolak'>>({});

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<VerifikasiFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            status: 'approved',
            tipe_verifikator: verifierType,
            catatan: '',
        },
    });

    const statusValue = watch('status');

    // Fetch or extract CLOs when modal opens
    useEffect(() => {
        if (open && soal) {
            reset({
                status: 'approved',
                tipe_verifikator: verifierType,
                catatan: '',
            });
            setCloNotes({});
            setCloStatus({});

            // Check if soal already has CLOs attached via mata_kuliah relation
            const initialClos = soal.mata_kuliah?.clo;
            if (initialClos && initialClos.length > 0) {
                setClos(initialClos);
                const initialStatusMap: Record<number, 'sesuai' | 'revisi' | 'tolak'> = {};
                initialClos.forEach((c) => {
                    initialStatusMap[c.id] = 'sesuai';
                });
                setCloStatus(initialStatusMap);
            } else if (soal.mata_kuliah_id) {
                // Fetch CLOs mapped to this course
                setLoadingClos(true);
                getCloList({ mata_kuliah_id: soal.mata_kuliah_id, per_page: 50 })
                    .then((res) => {
                        const fetched = res.data || [];
                        setClos(fetched);
                        const initialStatusMap: Record<number, 'sesuai' | 'revisi' | 'tolak'> = {};
                        fetched.forEach((c) => {
                            initialStatusMap[c.id] = 'sesuai';
                        });
                        setCloStatus(initialStatusMap);
                    })
                    .catch(() => {
                        setClos([]);
                    })
                    .finally(() => {
                        setLoadingClos(false);
                    });
            } else {
                setClos([]);
            }
        }
    }, [open, soal, reset, verifierType]);

    if (!soal) return null;

    const fileExt = soal.file_soal.split('.').pop()?.toLowerCase();
    const isPdf = fileExt === 'pdf';
    const fileUrl = soal.file_url || `${window.location.origin}/storage/${soal.file_soal}`;

    const handleFormSubmit = (data: VerifikasiFormData) => {
        // Build per-CLO notes array
        const catatanCloList: CatatanCloItem[] = clos.map((c) => ({
            clo_id: c.id,
            kode: c.kode,
            deskripsi: c.deskripsi,
            catatan: (cloNotes[c.id] || '').trim(),
            status: cloStatus[c.id] || 'sesuai',
        })).filter((c) => c.catatan.length > 0 || c.status !== 'sesuai');

        onSubmit({
            ...data,
            catatan_clo: catatanCloList,
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Verifikasi Soal Ujian — ${soal.judul_soal}`}
            size="2xl"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        form="verifikasi-form"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60 cursor-pointer"
                    >
                        {loading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        Simpan Verifikasi
                    </button>
                </>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full max-h-[70vh]">
                {/* Left Panel: Document Preview (5 cols) */}
                <div className="md:col-span-5 flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-2.5">
                    <div className="mb-2 flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Pratinjau Berkas
                        </span>
                        <a
                            href={fileUrl}
                            download
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                            <Download size={13} /> Unduh
                        </a>
                    </div>
                    <div className="flex-1 min-h-[300px] flex items-center justify-center bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs">
                        {isPdf ? (
                            <iframe
                                key={fileUrl}
                                src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                className="h-full w-full rounded-lg"
                                style={{ minHeight: '380px' }}
                                title="Pratinjau PDF"
                                sandbox="allow-scripts allow-same-origin"
                            />
                        ) : (
                            <div className="text-center p-5 space-y-2.5">
                                <FileText size={40} className="mx-auto text-blue-500 animate-pulse" />
                                <div>
                                    <p className="text-xs font-semibold text-gray-800 break-all">{soal.file_soal.split('/').pop()}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Berkas Word (.docx/.doc) dapat diunduh untuk direview.</p>
                                </div>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 text-xs font-semibold hover:bg-blue-100 transition shadow-2xs"
                                >
                                    <Download size={13} /> Unduh Naskah Soal
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Verification Form (7 cols) */}
                <form
                    id="verifikasi-form"
                    onSubmit={handleSubmit(handleFormSubmit)}
                    className="md:col-span-7 flex flex-col justify-between overflow-y-auto pr-1 space-y-4"
                >
                    <div className="space-y-4">
                        <input type="hidden" {...register('tipe_verifikator')} />

                        {/* 1. Hasil Verifikasi */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                1. Hasil Verifikasi <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <label className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border-2 cursor-pointer transition select-none ${
                                    statusValue === 'approved'
                                        ? 'border-green-600 bg-green-50 text-green-800 shadow-2xs'
                                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                                }`}>
                                    <input
                                        type="radio"
                                        value="approved"
                                        {...register('status')}
                                        className="sr-only"
                                    />
                                    <CheckCircle2 size={18} className={statusValue === 'approved' ? 'text-green-600 mb-0.5' : 'text-gray-400 mb-0.5'} />
                                    <span className="text-xs font-bold uppercase">Setujui</span>
                                </label>

                                <label className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border-2 cursor-pointer transition select-none ${
                                    statusValue === 'revisi'
                                        ? 'border-orange-500 bg-orange-50 text-orange-800 shadow-2xs'
                                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                                }`}>
                                    <input
                                        type="radio"
                                        value="revisi"
                                        {...register('status')}
                                        className="sr-only"
                                    />
                                    <AlertTriangle size={18} className={statusValue === 'revisi' ? 'text-orange-500 mb-0.5' : 'text-gray-400 mb-0.5'} />
                                    <span className="text-xs font-bold uppercase">Revisi</span>
                                </label>

                                <label className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border-2 cursor-pointer transition select-none ${
                                    statusValue === 'rejected'
                                        ? 'border-red-500 bg-red-50 text-red-800 shadow-2xs'
                                        : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                                }`}>
                                    <input
                                        type="radio"
                                        value="rejected"
                                        {...register('status')}
                                        className="sr-only"
                                    />
                                    <XCircle size={18} className={statusValue === 'rejected' ? 'text-red-500 mb-0.5' : 'text-gray-400 mb-0.5'} />
                                    <span className="text-xs font-bold uppercase">Tolak</span>
                                </label>
                            </div>
                        </div>

                        {/* 2. Catatan Keseluruhan */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="catatan" className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                                    2. Catatan Umum Verifikator {statusValue !== 'approved' && <span className="text-red-500">*</span>}
                                </label>
                                <span className="text-[10px] font-normal text-gray-400">
                                    {statusValue === 'approved' ? 'opsional' : 'wajib diisi'}
                                </span>
                            </div>
                            <textarea
                                id="catatan"
                                rows={2}
                                placeholder="Berikan ringkasan review atau instruksi perbaikan umum..."
                                {...register('catatan')}
                                className="block w-full rounded-lg border border-gray-300 p-2.5 text-xs focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-none transition shadow-2xs"
                            />
                            {errors.catatan && (
                                <p className="mt-1 text-xs text-[var(--color-danger)] font-medium">{errors.catatan.message}</p>
                            )}
                        </div>

                        {/* 3. Catatan Khusus Per CLO Mata Kuliah */}
                        <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                    <BookOpen size={13} className="text-[var(--color-primary)]" />
                                    3. Catatan Per CLO ({clos.length} CLO)
                                </label>
                                <span className="text-[10px] text-gray-500 font-medium">
                                    MK: <strong className="text-gray-700">{soal.mata_kuliah?.nama_mk || soal.mata_kuliah_nama || 'MK'}</strong>
                                </span>
                            </div>

                            {loadingClos ? (
                                <div className="space-y-2 py-1">
                                    <div className="h-12 rounded-lg bg-gray-200/70 animate-pulse" />
                                </div>
                            ) : clos.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-2.5 text-center text-xs text-gray-500">
                                    Tidak ada CLO yang terhubung dengan mata kuliah ini.
                                </div>
                            ) : (
                                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                    {clos.map((clo) => {
                                        const cStatus = cloStatus[clo.id] || 'sesuai';
                                        const cNote = cloNotes[clo.id] || '';

                                        return (
                                            <div
                                                key={clo.id}
                                                className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-2 shadow-2xs transition hover:border-gray-300"
                                            >
                                                {/* Header CLO + Evaluation Toggle */}
                                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                        <span className="inline-flex rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white font-mono shrink-0">
                                                            {clo.kode}
                                                        </span>
                                                        {clo.plo && (
                                                            <span className="inline-flex rounded bg-gray-100 px-1 py-0.5 text-[9px] font-mono text-gray-600 shrink-0">
                                                                {clo.plo.kode}
                                                            </span>
                                                        )}
                                                        <p className="text-[11px] text-gray-700 font-medium truncate">
                                                            {clo.deskripsi}
                                                        </p>
                                                    </div>

                                                    {/* Status Selector per CLO */}
                                                    <div className="flex items-center gap-1 shrink-0 bg-gray-50 p-0.5 rounded border border-gray-200">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setCloStatus((prev) => ({ ...prev, [clo.id]: 'sesuai' }))
                                                            }
                                                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                                                cStatus === 'sesuai'
                                                                    ? 'bg-green-600 text-white shadow-2xs'
                                                                    : 'text-gray-600 hover:text-gray-900'
                                                            }`}
                                                        >
                                                            Sesuai
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setCloStatus((prev) => ({ ...prev, [clo.id]: 'revisi' }))
                                                            }
                                                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                                                cStatus === 'revisi'
                                                                    ? 'bg-orange-500 text-white shadow-2xs'
                                                                    : 'text-gray-600 hover:text-gray-900'
                                                            }`}
                                                        >
                                                            Perlu Revisi
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Textarea Catatan CLO */}
                                                <div>
                                                    <textarea
                                                        rows={2}
                                                        value={cNote}
                                                        onChange={(e) =>
                                                            setCloNotes((prev) => ({
                                                                ...prev,
                                                                [clo.id]: e.target.value,
                                                            }))
                                                        }
                                                        placeholder={`Catatan khusus butir soal ${clo.kode}...`}
                                                        className="w-full rounded border border-gray-200 bg-gray-50/40 p-2 text-xs text-gray-800 focus:border-blue-500 focus:bg-white focus:outline-none transition"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Role Notice Footer */}
                    <div className="rounded-lg bg-blue-50/60 p-2.5 text-[11px] text-blue-900 border border-blue-100 flex items-start gap-2">
                        <MessageSquare size={14} className="text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <strong>Peran:</strong> Verifikator {verifierType === 'coordinator' ? 'Koordinator MK' : 'Verifikator Soal'}. Hasil verifikasi & catatan per CLO akan diteruskan ke dosen pengampu.
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
