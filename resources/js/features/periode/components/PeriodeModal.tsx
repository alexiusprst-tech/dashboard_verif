import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/shared/components/ui/Modal';
import type { Periode, PeriodeFormData } from '../types/periode.types';

const schema = z.object({
    nama_periode: z.string().min(1, 'Nama Periode wajib diisi').max(100, 'Nama Periode maksimal 100 karakter'),
    semester: z.string().min(1, 'Semester wajib diisi'),
    tahun_akademik: z.string().min(1, 'Tahun Akademik wajib diisi').regex(/^\d{4}\/\d{4}$/, 'Format harus YYYY/YYYY (contoh: 2025/2026)'),
    tanggal_mulai: z.string().min(1, 'Tanggal Mulai wajib diisi'),
    tanggal_deadline: z.string().min(1, 'Tanggal Deadline wajib diisi'),
}).refine((data) => {
    if (!data.tanggal_mulai || !data.tanggal_deadline) return true;
    return new Date(data.tanggal_deadline) > new Date(data.tanggal_mulai);
}, {
    message: 'Tanggal deadline harus setelah tanggal mulai',
    path: ['tanggal_deadline'],
});

interface PeriodeModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: PeriodeFormData) => void;
    periode?: Periode | null;
    loading?: boolean;
}

export function PeriodeModal({
    open,
    onClose,
    onSubmit,
    periode,
    loading = false,
}: PeriodeModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PeriodeFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            nama_periode: '',
            semester: '1',
            tahun_akademik: '',
            tanggal_mulai: '',
            tanggal_deadline: '',
        },
    });

    useEffect(() => {
        if (periode) {
            reset({
                nama_periode: periode.nama_periode,
                semester: periode.semester || '1',
                tahun_akademik: periode.tahun_akademik || '',
                tanggal_mulai: periode.tanggal_mulai,
                tanggal_deadline: periode.tanggal_deadline,
            });
        } else {
            reset({
                nama_periode: '',
                semester: '1',
                tahun_akademik: '',
                tanggal_mulai: '',
                tanggal_deadline: '',
            });
        }
    }, [periode, reset, open]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={periode ? 'Edit Periode' : 'Tambah Periode'}
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
                        form="periode-form"
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
            <form id="periode-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="nama_periode" className="block text-sm font-medium text-gray-700">
                        Nama Periode <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="nama_periode"
                        type="text"
                        placeholder="Contoh: UTS Ganjil 2025/2026"
                        {...register('nama_periode')}
                        className="mt-1 block h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    {errors.nama_periode && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.nama_periode.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="semester" className="block text-sm font-medium text-gray-700">
                            Semester <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="semester"
                            {...register('semester')}
                            className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        >
                            <option value="1">1 (Ganjil)</option>
                            <option value="2">2 (Genap)</option>
                            <option value="3">3 (Antara)</option>
                        </select>
                        {errors.semester && (
                            <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.semester.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="tahun_akademik" className="block text-sm font-medium text-gray-700">
                            Tahun Akademik <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="tahun_akademik"
                            type="text"
                            placeholder="Contoh: 2025/2026"
                            {...register('tahun_akademik')}
                            className="mt-1 block h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                        {errors.tahun_akademik && (
                            <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.tahun_akademik.message}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="tanggal_mulai" className="block text-sm font-medium text-gray-700">
                            Tanggal Mulai <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="tanggal_mulai"
                            type="date"
                            {...register('tanggal_mulai')}
                            className="mt-1 block h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                        {errors.tanggal_mulai && (
                            <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.tanggal_mulai.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="tanggal_deadline" className="block text-sm font-medium text-gray-700">
                            Tanggal Deadline <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="tanggal_deadline"
                            type="date"
                            {...register('tanggal_deadline')}
                            className="mt-1 block h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                        {errors.tanggal_deadline && (
                            <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.tanggal_deadline.message}</p>
                        )}
                    </div>
                </div>
            </form>
        </Modal>
    );
}
