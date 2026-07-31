import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, X, UserCheck, ChevronDown } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { cn } from '@/shared/lib/utils';
import type { PenugasanFormData } from '../types/penugasan.types';
import type { Periode } from '@/features/periode/types/periode.types';
import api from '@/shared/lib/api';

const schema = z.object({
    periode_id: z.coerce
        .number()
        .min(1, 'Periode wajib dipilih'),
    pic_dosen_id: z.coerce
        .number()
        .min(1, 'Dosen PIC wajib dipilih'),
});

interface AssignModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: PenugasanFormData) => void;
    periodes: Periode[];
    defaultPeriodeId: string;
    loading?: boolean;
}

export function AssignModal({
    open,
    onClose,
    onSubmit,
    periodes,
    defaultPeriodeId,
    loading = false,
}: AssignModalProps) {
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<PenugasanFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            periode_id:   defaultPeriodeId ? Number(defaultPeriodeId) : '',
            pic_dosen_id: '',
        },
    });

    // Autocomplete states
    const [picSearch, setPicSearch]       = useState('');
    const [allDosen, setAllDosen]         = useState<any[]>([]);
    const [picResults, setPicResults]     = useState<any[]>([]);
    const [selectedPic, setSelectedPic]   = useState<any | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (open) {
            reset({
                periode_id:   defaultPeriodeId ? Number(defaultPeriodeId) : '',
                pic_dosen_id: '',
            });
            setPicSearch('');
            setSelectedPic(null);
            setPicResults([]);
            setShowDropdown(false);

            // Ambil semua dosen aktif
            api.get('/dosen/search', { params: { q: '', per_page: 200 } }).then((res) => {
                setAllDosen(res.data.data);
                setPicResults(res.data.data);
            });
        }
    }, [open, defaultPeriodeId, reset]);

    // Client-side filtering
    useEffect(() => {
        const query = picSearch.trim().toLowerCase();
        if (!query) {
            setPicResults(allDosen);
        } else {
            const filtered = allDosen.filter(
                (d) =>
                    d.nama_lengkap.toLowerCase().includes(query) ||
                    (d.kode_dosen && d.kode_dosen.toLowerCase().includes(query))
            );
            setPicResults(filtered);
        }
    }, [picSearch, allDosen]);

    const handleSelectPic = (dosen: any) => {
        setSelectedPic(dosen);
        setValue('pic_dosen_id', dosen.id);
        setPicSearch('');
        setShowDropdown(false);
    };

    const handleClearPic = () => {
        setSelectedPic(null);
        setValue('pic_dosen_id', '');
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Tugaskan Dosen sebagai PIC"
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
                        form="assign-form"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
                    >
                        {loading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        <UserCheck size={15} />
                        Assign PIC
                    </button>
                </>
            }
        >
            <form id="assign-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 min-h-[340px]">
                {/* Periode */}
                <div>
                    <label htmlFor="assign-periode" className="block text-sm font-medium text-gray-700">
                        Periode Pelaksanaan <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="assign-periode"
                        {...register('periode_id')}
                        className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        <option value="">Pilih Periode...</option>
                        {periodes.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nama_periode}
                            </option>
                        ))}
                    </select>
                    {errors.periode_id && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.periode_id.message}</p>
                    )}
                </div>

                {/* Dosen PIC — Autocomplete / Dropdown Combobox */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">
                        Dosen yang Ditugaskan sebagai PIC <span className="text-red-500">*</span>
                    </label>
                    <p className="mt-0.5 text-xs text-gray-400">
                        PIC akan bertanggung jawab memverifikasi seluruh soal dalam periode ini.
                    </p>

                    {selectedPic ? (
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--color-primary-light)] bg-[var(--color-primary-light)]/20 px-3.5 py-2.5 text-sm">
                            <div>
                                <span className="font-semibold text-gray-800">
                                    {selectedPic.nama_lengkap}
                                </span>
                                {selectedPic.kode_dosen && (
                                    <span className="ml-2 rounded bg-white/80 px-1.5 py-0.5 text-xs font-mono font-medium text-gray-700 border border-gray-200">
                                        {selectedPic.kode_dosen}
                                    </span>
                                )}
                                {selectedPic.email && (
                                    <p className="text-xs text-gray-500 mt-0.5">{selectedPic.email}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleClearPic}
                                className="ml-2 rounded-md p-1 text-gray-400 hover:bg-white hover:text-gray-600 transition-colors"
                                title="Ganti dosen"
                            >
                                <X size={16} />
                            </button>
                        </div>
                     ) : (
                        <div className="relative mt-1.5">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                id="assign-pic-search"
                                type="text"
                                value={picSearch}
                                onChange={(e) => {
                                    setPicSearch(e.target.value);
                                    setShowDropdown(true);
                                }}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                placeholder="Cari nama atau klik panah untuk melihat daftar dosen..."
                                className="block h-10 w-full rounded-lg border border-gray-300 pl-9 pr-10 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                            />
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setShowDropdown((prev) => !prev);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                title="Lihat semua dosen"
                            >
                                <ChevronDown
                                    size={16}
                                    className={cn("transition-transform duration-200", showDropdown && "rotate-180")}
                                />
                            </button>
                        </div>
                    )}

                    {/* Dropdown hasil pencarian */}
                    {showDropdown && !selectedPic && (
                        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl divide-y divide-gray-100">
                            {picResults.length > 0 ? (
                                picResults.map((d) => (
                                    <li
                                        key={d.id}
                                        onMouseDown={() => handleSelectPic(d)}
                                        className="cursor-pointer px-3.5 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm text-gray-900">{d.nama_lengkap}</span>
                                            {d.kode_dosen && (
                                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono font-medium text-gray-600">
                                                    {d.kode_dosen}
                                                </span>
                                            )}
                                        </div>
                                        {d.email && <p className="mt-0.5 text-xs text-gray-400">{d.email}</p>}
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-3 text-center text-xs text-gray-400">
                                    Tidak ada dosen yang sesuai dengan kata kunci "{picSearch}"
                                </li>
                            )}
                        </ul>
                    )}

                    {errors.pic_dosen_id && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.pic_dosen_id.message}</p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
