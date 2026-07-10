import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/shared/components/ui/Modal';
import type { VerifikasiFormData } from '../types/verifikasi.types';
import type { Soal } from '@/features/soal/types/soal.types';
import { useAuth } from '@/shared/hooks/useAuth';
import { FileText, Download } from 'lucide-react';

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
    message: 'Catatan wajib diisi apabila hasil verifikasi adalah Perlu Revisi atau Ditolak',
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

    useEffect(() => {
        if (open) {
            reset({
                status: 'approved',
                tipe_verifikator: verifierType,
                catatan: '',
            });
        }
    }, [open, reset, verifierType]);

    if (!soal) return null;

    const fileExt = soal.file_soal.split('.').pop()?.toLowerCase();
    const isPdf = fileExt === 'pdf';
    const fileUrl = soal.file_url || `/storage/${soal.file_soal}`;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Verifikasi Soal Ujian — ${soal.judul_soal}`}
            size="xl"
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
                        form="verifikasi-form"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
                    >
                        {loading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        Simpan Verifikasi
                    </button>
                </>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full max-h-[65vh]">
                {/* Left: Document Preview */}
                <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-2">
                    <div className="mb-2 flex items-center justify-between px-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Pratinjau Berkas</span>
                        <a
                            href={fileUrl}
                            download
                            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                            <Download size={13} /> Unduh
                        </a>
                    </div>
                    <div className="flex-1 min-h-[300px] flex items-center justify-center bg-white rounded-lg border border-gray-100">
                        {isPdf ? (
                            <iframe
                                src={fileUrl}
                                className="h-full w-full rounded-lg"
                                title="Pratinjau PDF"
                            />
                        ) : (
                            <div className="text-center p-6 space-y-3">
                                <FileText size={48} className="mx-auto text-blue-500 animate-pulse" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{soal.file_soal.split('/').pop()}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Berkas non-PDF tidak mendukung pratinjau langsung.</p>
                                </div>
                                <a
                                    href={fileUrl}
                                    download
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 text-gray-700 px-3 py-1.5 text-xs font-semibold hover:bg-gray-200 transition"
                                >
                                    <Download size={13} /> Unduh Berkas untuk Review
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Verification Form */}
                <form id="verifikasi-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                        <input type="hidden" {...register('tipe_verifikator')} />

                        <div>
                            <span className="block text-sm font-medium text-gray-700">Hasil Verifikasi</span>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                                <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition ${
                                    statusValue === 'approved'
                                        ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}>
                                    <input
                                        type="radio"
                                        value="approved"
                                        {...register('status')}
                                        className="sr-only"
                                    />
                                    <span className="text-xs uppercase">Setujui</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition ${
                                    statusValue === 'revisi'
                                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}>
                                    <input
                                        type="radio"
                                        value="revisi"
                                        {...register('status')}
                                        className="sr-only"
                                    />
                                    <span className="text-xs uppercase">Revisi</span>
                                </label>
                                <label className={`flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition ${
                                    statusValue === 'rejected'
                                        ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}>
                                    <input
                                        type="radio"
                                        value="rejected"
                                        {...register('status')}
                                        className="sr-only"
                                    />
                                    <span className="text-xs uppercase">Tolak</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="catatan" className="block text-sm font-medium text-gray-700">
                                Catatan Verifikator {statusValue !== 'approved' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                id="catatan"
                                rows={6}
                                placeholder="Berikan instruksi revisi atau alasan penolakan secara jelas..."
                                {...register('catatan')}
                                className="mt-1 block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                            />
                            {errors.catatan && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.catatan.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500 border border-gray-100 mt-4">
                        <strong>Peran Anda:</strong> Verifikator {verifierType === 'coordinator' ? 'Koordinator' : 'PIC'}. Hasil verifikasi akan memicu notifikasi langsung ke Dosen pengampu.
                    </div>
                </form>
            </div>
        </Modal>
    );
}
