import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/shared/components/ui/Modal';
import type { Plo, PloFormData, ProgramStudi } from '../types/plo.types';

const schema = z.object({
    kode: z.string().min(1, 'Kode PLO wajib diisi').max(20, 'Kode PLO maksimal 20 karakter'),
    deskripsi: z.string().min(1, 'Deskripsi PLO wajib diisi'),
    prodi_id: z.coerce.number({ invalid_type_error: 'Program Studi wajib dipilih' }).min(1, 'Program Studi wajib dipilih'),
});

interface PloModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: PloFormData) => void;
    plo?: Plo | null;
    programStudiList: ProgramStudi[];
    loading?: boolean;
}

export function PloModal({
    open,
    onClose,
    onSubmit,
    plo,
    programStudiList,
    loading = false,
}: PloModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PloFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            kode: '',
            deskripsi: '',
            prodi_id: '',
        },
    });

    useEffect(() => {
        if (plo) {
            reset({
                kode: plo.kode,
                deskripsi: plo.deskripsi,
                prodi_id: plo.prodi_id,
            });
        } else {
            reset({
                kode: '',
                deskripsi: '',
                prodi_id: '',
            });
        }
    }, [plo, reset, open]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={plo ? 'Edit PLO' : 'Tambah PLO'}
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
                        form="plo-form"
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
            <form id="plo-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="prodi_id" className="block text-sm font-medium text-gray-700">
                        Program Studi <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="prodi_id"
                        {...register('prodi_id')}
                        className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                        <option value="">Pilih Program Studi</option>
                        {programStudiList.map((prodi) => (
                            <option key={prodi.id} value={prodi.id}>
                                {prodi.nama_prodi}
                            </option>
                        ))}
                    </select>
                    {errors.prodi_id && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.prodi_id.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="kode" className="block text-sm font-medium text-gray-700">
                        Kode PLO <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="kode"
                        type="text"
                        placeholder="Contoh: PLO-1"
                        {...register('register' in errors ? 'kode' : 'kode')}
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
                        placeholder="Tuliskan deskripsi kompetensi PLO..."
                        {...register('deskripsi')}
                        className="mt-1 block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    {errors.deskripsi && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.deskripsi.message}</p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
