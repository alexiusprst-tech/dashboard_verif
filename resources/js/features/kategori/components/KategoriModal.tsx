import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/shared/components/ui/Modal';
import type { Kategori, KategoriFormData } from '../types/kategori.types';

const schema = z.object({
    nama_kategori: z.string().min(1, 'Nama Kategori wajib diisi').max(100, 'Nama Kategori maksimal 100 karakter'),
    deskripsi: z.string().min(1, 'Deskripsi wajib diisi'),
});

interface KategoriModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: KategoriFormData) => void;
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
    }, [kategori, reset, open]);

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
            <form id="kategori-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                <div>
                    <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">
                        Deskripsi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="deskripsi"
                        rows={4}
                        placeholder="Tuliskan deskripsi mengenai cakupan kategori..."
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
