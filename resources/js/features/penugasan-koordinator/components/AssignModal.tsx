import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, X, UserCheck, ChevronDown } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { cn } from '@/shared/lib/utils';
import type { Periode } from '@/features/periode/types/periode.types';
import api from '@/shared/lib/api';

const schema = z.object({
    periode_id: z.coerce
        .number()
        .min(1, 'Periode wajib dipilih'),
});

interface AssignModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { periode_id: number; koordinator_dosen_ids: number[] }) => void;
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
        reset,
        formState: { errors },
    } = useForm<{ periode_id: number | string }>({
        resolver: zodResolver(schema),
        defaultValues: {
            periode_id: defaultPeriodeId ? Number(defaultPeriodeId) : '',
        },
    });

    // Autocomplete states
    const [koordinatorSearch, setKoordinatorSearch]       = useState('');
    const [allDosen, setAllDosen]         = useState<any[]>([]);
    const [koordinatorResults, setKoordinatorResults]     = useState<any[]>([]);
    const [selectedKoordinators, setSelectedKoordinators] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [submitError, setSubmitError]   = useState('');

    useEffect(() => {
        if (open) {
            reset({
                periode_id: defaultPeriodeId ? Number(defaultPeriodeId) : '',
            });
            setKoordinatorSearch('');
            setSelectedKoordinators([]);
            setKoordinatorResults([]);
            setShowDropdown(false);
            setSubmitError('');

            // Ambil semua dosen aktif
            api.get('/dosen/search', { params: { q: '', per_page: 200 } }).then((res) => {
                setAllDosen(res.data.data);
                setKoordinatorResults(res.data.data);
            });
        }
    }, [open, defaultPeriodeId, reset]);

    // Client-side filtering
    useEffect(() => {
        const query = koordinatorSearch.trim().toLowerCase();
        // Saring dosen yang belum dipilih saja
        const unselectedDosen = allDosen.filter(
            (d) => !selectedKoordinators.some((p) => p.id === d.id)
        );

        if (!query) {
            setKoordinatorResults(unselectedDosen);
        } else {
            const filtered = unselectedDosen.filter(
                (d) =>
                    d.nama_lengkap.toLowerCase().includes(query) ||
                    (d.kode_dosen && d.kode_dosen.toLowerCase().includes(query))
            );
            setKoordinatorResults(filtered);
        }
    }, [koordinatorSearch, allDosen, selectedKoordinators]);

    const handleSelectKoordinator = (dosen: any) => {
        if (!selectedKoordinators.some((p) => p.id === dosen.id)) {
            setSelectedKoordinators((prev) => [...prev, dosen]);
        }
        setKoordinatorSearch('');
        setShowDropdown(false);
        setSubmitError('');
    };

    const handleRemoveKoordinator = (id: number) => {
        setSelectedKoordinators((prev) => prev.filter((p) => p.id !== id));
    };

    const handleFormSubmit = (formData: { periode_id: number | string }) => {
        if (selectedKoordinators.length === 0) {
            setSubmitError('Pilih minimal satu dosen Koordinator.');
            return;
        }
        onSubmit({
            periode_id: Number(formData.periode_id),
            koordinator_dosen_ids: selectedKoordinators.map((p) => p.id),
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Tugaskan Dosen sebagai Koordinator"
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
                        Assign Koordinator
                    </button>
                </>
            }
        >
            <form id="assign-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 min-h-[340px]">
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

                {/* Dosen Koordinator — Autocomplete / Dropdown Combobox */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">
                        Dosen yang Ditugaskan sebagai Koordinator <span className="text-red-500">*</span>
                    </label>
                    <p className="mt-0.5 text-xs text-gray-400">
                        Anda dapat memilih lebih dari satu dosen untuk ditugaskan sekaligus.
                    </p>

                    <div className="relative mt-1.5">
                        <Search
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                            id="assign-koordinator-search"
                            type="text"
                            value={koordinatorSearch}
                            onChange={(e) => {
                                setKoordinatorSearch(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            placeholder="Ketik nama dosen atau klik panah untuk melihat daftar..."
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

                    {/* Tag list dosen terpilih */}
                    {selectedKoordinators.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-2 rounded-lg border border-purple-100 bg-purple-50/20 p-2.5">
                            {selectedKoordinators.map((koordinator) => (
                                <span
                                    key={koordinator.id}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-purple-200 pl-2.5 pr-1.5 py-1 text-xs font-medium text-gray-800 shadow-sm"
                                >
                                    <span>{koordinator.nama_lengkap}</span>
                                    {koordinator.kode_dosen && (
                                        <span className="rounded bg-gray-100 px-1 text-[10px] font-mono text-gray-500">
                                            {koordinator.kode_dosen}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveKoordinator(koordinator.id)}
                                        className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                                        title="Hapus"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Dropdown hasil pencarian */}
                    {showDropdown && (
                        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl divide-y divide-gray-100">
                            {koordinatorResults.length > 0 ? (
                                koordinatorResults.map((d) => (
                                    <li
                                        key={d.id}
                                        onMouseDown={() => handleSelectKoordinator(d)}
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
                                    {koordinatorSearch ? `Tidak ada dosen yang sesuai dengan kata kunci "${koordinatorSearch}"` : 'Semua dosen telah terpilih'}
                                </li>
                            )}
                        </ul>
                    )}

                    {submitError && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{submitError}</p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
