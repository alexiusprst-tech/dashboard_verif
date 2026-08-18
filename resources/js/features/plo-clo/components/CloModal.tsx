import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, X, BookOpen, Check } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { cn } from '@/shared/lib/utils';
import type { Clo, CloFormData, Plo, MataKuliah } from '../types/plo.types';

const schema = z.object({
    kode:       z.string().min(1, 'Kode CLO wajib diisi').max(20, 'Kode CLO maksimal 20 karakter'),
    deskripsi:  z.string().min(1, 'Deskripsi CLO wajib diisi'),
    plo_id:     z.coerce.number({ error: 'PLO wajib dipilih' }).min(1, 'PLO wajib dipilih'),
});

type FormValues = z.infer<typeof schema>;

interface CloModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CloFormData) => void;
    clo?: Clo | null;
    ploList: Plo[];
    mataKuliahList?: MataKuliah[];
    defaultPloId?: number;
    loading?: boolean;
}

export function CloModal({
    open,
    onClose,
    onSubmit,
    clo,
    ploList,
    mataKuliahList = [],
    defaultPloId,
    loading = false,
}: CloModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema) as any,
        defaultValues: {
            kode:       '',
            deskripsi:  '',
            plo_id:     defaultPloId || ('' as any),
        },
    });

    /* Mata kuliah multi-select state — managed outside RHF for flexibility */
    const [selectedMkIds, setSelectedMkIds] = useState<number[]>([]);
    const [mkSearch, setMkSearch] = useState('');

    useEffect(() => {
        if (open) {
            if (clo) {
                reset({
                    kode:       clo.kode,
                    deskripsi:  clo.deskripsi,
                    plo_id:     clo.plo_id || (clo.plo?.id ?? ('' as any)),
                });
                /* Pre-fill from existing clo.courses */
                setSelectedMkIds(clo.courses?.map((c) => c.id) ?? []);
            } else {
                reset({
                    kode:       '',
                    deskripsi:  '',
                    plo_id:     defaultPloId || (ploList.length > 0 ? ploList[0].id : ('' as any)),
                });
                setSelectedMkIds([]);
            }
            setMkSearch('');
        }
    }, [clo, reset, open, defaultPloId, ploList]);

    const toggleMk = (id: number) => {
        setSelectedMkIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const removeMk = (id: number) => setSelectedMkIds((prev) => prev.filter((x) => x !== id));

    const filteredMk = mataKuliahList.filter((mk) =>
        `${mk.kode_mk} ${mk.nama_mk}`.toLowerCase().includes(mkSearch.toLowerCase())
    );

    const handleFormSubmit = (data: FormValues) => {
        onSubmit({
            ...data,
            plo_id: Number(data.plo_id),
            mata_kuliah_ids: selectedMkIds,
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={clo ? 'Edit CLO' : 'Tambah CLO'}
            size="lg"
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
            <form id="clo-form" onSubmit={handleSubmit(handleFormSubmit as any)} className="space-y-4">
                {/* PLO Induk */}
                <div>
                    <label htmlFor="plo_id" className="block text-sm font-medium text-gray-700">
                        Pilih PLO Induk <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="plo_id"
                        {...register('plo_id')}
                        className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                        <option value="">— Pilih PLO Induk —</option>
                        {ploList.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.kode}{p.deskripsi ? ` - ${p.deskripsi.substring(0, 60)}${p.deskripsi.length > 60 ? '...' : ''}` : ''}
                            </option>
                        ))}
                    </select>
                    {errors.plo_id && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.plo_id.message}</p>
                    )}
                </div>

                {/* Kode CLO */}
                <div>
                    <label htmlFor="kode" className="block text-sm font-medium text-gray-700">
                        Kode CLO <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="kode"
                        type="text"
                        placeholder="Contoh: CLO-01"
                        {...register('kode')}
                        className="mt-1 block h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    {errors.kode && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.kode.message}</p>
                    )}
                </div>

                {/* Deskripsi CLO */}
                <div>
                    <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700">
                        Deskripsi CLO <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="deskripsi"
                        rows={3}
                        placeholder="Tuliskan deskripsi kompetensi CLO..."
                        {...register('deskripsi')}
                        className="mt-1 block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                    {errors.deskripsi && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.deskripsi.message}</p>
                    )}
                </div>

                {/* Mata Kuliah Terkait */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Mata Kuliah Terkait
                        <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">
                            {selectedMkIds.length} dipilih
                        </span>
                    </label>

                    {/* Selected pills */}
                    {selectedMkIds.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                            {selectedMkIds.map((id) => {
                                const mk = mataKuliahList.find((m) => m.id === id);
                                if (!mk) return null;
                                return (
                                    <span
                                        key={id}
                                        className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700"
                                    >
                                        <BookOpen size={10} />
                                        {mk.kode_mk} — {mk.nama_mk}
                                        <button
                                            type="button"
                                            onClick={() => removeMk(id)}
                                            className="ml-0.5 rounded-full p-0.5 hover:bg-green-200 transition"
                                            aria-label={`Hapus ${mk.nama_mk}`}
                                        >
                                            <X size={9} />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    )}

                    {/* Search + list */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                        {/* Search bar */}
                        <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
                            <Search size={13} className="flex-shrink-0 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari kode atau nama mata kuliah..."
                                value={mkSearch}
                                onChange={(e) => setMkSearch(e.target.value)}
                                className="flex-1 bg-transparent text-xs outline-none placeholder-gray-400"
                            />
                            {mkSearch && (
                                <button type="button" onClick={() => setMkSearch('')}
                                    className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600 transition">
                                    <X size={11} />
                                </button>
                            )}
                        </div>

                        {/* Scrollable list */}
                        <div className="max-h-44 overflow-y-auto">
                            {filteredMk.length === 0 ? (
                                <p className="px-4 py-4 text-center text-xs text-gray-400">
                                    {mkSearch ? 'Tidak ditemukan.' : 'Belum ada mata kuliah tersedia.'}
                                </p>
                            ) : (
                                filteredMk.map((mk) => {
                                    const isSelected = selectedMkIds.includes(mk.id);
                                    return (
                                        <button
                                            key={mk.id}
                                            type="button"
                                            onClick={() => toggleMk(mk.id)}
                                            className={cn(
                                                'flex w-full items-center gap-3 px-3 py-2.5 text-left text-xs transition hover:bg-white',
                                                isSelected && 'bg-green-50 hover:bg-green-50',
                                            )}
                                        >
                                            {/* Checkbox */}
                                            <span className={cn(
                                                'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition',
                                                isSelected
                                                    ? 'border-green-500 bg-green-500 text-white'
                                                    : 'border-gray-300 bg-white',
                                            )}>
                                                {isSelected && <Check size={10} strokeWidth={3} />}
                                            </span>

                                            {/* Kode badge */}
                                            <span className="flex-shrink-0 rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-600">
                                                {mk.kode_mk}
                                            </span>

                                            {/* Nama */}
                                            <span className={cn('flex-1 font-medium', isSelected ? 'text-green-700' : 'text-gray-700')}>
                                                {mk.nama_mk}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer count */}
                        <div className="border-t border-gray-200 bg-white px-3 py-1.5 text-right">
                            <span className="text-[10px] text-gray-400">
                                {filteredMk.length} mata kuliah · {selectedMkIds.length} dipilih
                            </span>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
