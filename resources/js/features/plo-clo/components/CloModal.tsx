import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/shared/components/ui/Modal';
import type { Clo, CloFormData, Plo, MataKuliah } from '../types/plo.types';

const schema = z.object({
    kode:           z.string().min(1, 'Kode CLO wajib diisi').max(20, 'Kode CLO maksimal 20 karakter'),
    deskripsi:      z.string().min(1, 'Deskripsi CLO wajib diisi'),
    plo_id:         z.coerce.number({ invalid_type_error: 'PLO wajib dipilih' }).min(1, 'PLO wajib dipilih'),
    mata_kuliah_id: z.coerce.number({ invalid_type_error: 'Mata Kuliah wajib dipilih' }).min(1, 'Mata Kuliah wajib dipilih'),
    periode_id:     z.coerce.number().optional(),
});

interface CloModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CloFormData) => void;
    clo?: Clo | null;
    ploList: Plo[];
    mataKuliahList: MataKuliah[];
    /** Periode yang sedang aktif/dipilih — disertakan saat create/update CLO */
    defaultPeriodeId?: string | number;
    loading?: boolean;
}

export function CloModal({
    open,
    onClose,
    onSubmit,
    clo,
    ploList,
    mataKuliahList,
    defaultPeriodeId,
    loading = false,
}: CloModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CloFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            kode:           '',
            deskripsi:      '',
            plo_id:         '',
            mata_kuliah_id: '',
            periode_id:     defaultPeriodeId ? Number(defaultPeriodeId) : undefined,
        },
    });

    useEffect(() => {
        if (clo) {
            reset({
                kode:           clo.kode,
                deskripsi:      clo.deskripsi,
                plo_id:         clo.plo_id || (clo.plo?.id ?? ''),
                mata_kuliah_id: clo.mata_kuliah_id || (clo.mata_kuliah?.id ?? ''),
                periode_id:     clo.periode_id ?? (defaultPeriodeId ? Number(defaultPeriodeId) : undefined),
            });
        } else {
            reset({
                kode:           '',
                deskripsi:      '',
                plo_id:         '',
                mata_kuliah_id: '',
                periode_id:     defaultPeriodeId ? Number(defaultPeriodeId) : undefined,
            });
        }
    }, [clo, reset, open, defaultPeriodeId]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={clo ? 'Edit CLO' : 'Tambah CLO'}
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
                        form="clo-form"
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
            <form id="clo-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="plo_id" className="block text-sm font-medium text-gray-700">
                        Pilih PLO <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="plo_id"
                        {...register('plo_id')}
                        className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                        <option value="">Pilih PLO</option>
                        {ploList.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.kode} - {p.deskripsi.substring(0, 50)}...
                            </option>
                        ))}
                    </select>
                    {errors.plo_id && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.plo_id.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="mata_kuliah_id" className="block text-sm font-medium text-gray-700">
                        Mata Kuliah <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="mata_kuliah_id"
                        {...register('mata_kuliah_id')}
                        className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                        <option value="">Pilih Mata Kuliah</option>
                        {mataKuliahList.map((mk) => (
                            <option key={mk.id} value={mk.id}>
                                {mk.kode_mk} - {mk.nama_mk}
                            </option>
                        ))}
                    </select>
                    {errors.mata_kuliah_id && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.mata_kuliah_id.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="kode" className="block text-sm font-medium text-gray-700">
                        Kode CLO <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="kode"
                        type="text"
                        placeholder="Contoh: CLO-1"
                        {...register('kode')}
                        className="mt-1 block h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    {errors.kode && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.kode.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">
                        Deskripsi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="deskripsi"
                        rows={4}
                        placeholder="Tuliskan deskripsi kompetensi CLO..."
                        {...register('deskripsi')}
                        className="mt-1 block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    {errors.deskripsi && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.deskripsi.message}</p>
                    )}
                </div>
                {/* Hidden field: periode_id — scoping CLO per periode */}
                <input type="hidden" {...register('periode_id')} />
            </form>
        </Modal>
    );
}
