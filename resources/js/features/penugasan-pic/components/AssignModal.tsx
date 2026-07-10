import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, X, Check, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import type { PenugasanFormData } from '../types/penugasan.types';
import type { Periode } from '@/features/periode/types/periode.types';
import api from '@/shared/lib/api';

const schema = z.object({
    periode_id: z.coerce.number({ invalid_type_error: 'Periode wajib dipilih' }).min(1, 'Periode wajib dipilih'),
    pic_dosen_id: z.coerce.number({ invalid_type_error: 'Dosen PIC wajib dipilih' }).min(1, 'Dosen PIC wajib dipilih'),
    target_dosen_id: z.array(z.number()).min(1, 'Pilih minimal 1 Dosen Target'),
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
        control,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<PenugasanFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            periode_id: defaultPeriodeId ? Number(defaultPeriodeId) : '',
            pic_dosen_id: '',
            target_dosen_id: [],
        },
    });

    // Autocomplete states
    const [picSearch, setPicSearch] = useState('');
    const [picResults, setPicResults] = useState<any[]>([]);
    const [selectedPic, setSelectedPic] = useState<any | null>(null);

    const [targetSearch, setTargetSearch] = useState('');
    const [targetResults, setTargetResults] = useState<any[]>([]);
    const [selectedTargets, setSelectedTargets] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            reset({
                periode_id: defaultPeriodeId ? Number(defaultPeriodeId) : '',
                pic_dosen_id: '',
                target_dosen_id: [],
            });
            setPicSearch('');
            setSelectedPic(null);
            setTargetSearch('');
            setSelectedTargets([]);
        }
    }, [open, defaultPeriodeId, reset]);

    // Handle searching PIC Dosen
    useEffect(() => {
        if (picSearch.trim().length >= 2) {
            api.get('/dosen/search', { params: { q: picSearch } }).then((res) => {
                setPicResults(res.data.data);
            });
        } else {
            setPicResults([]);
        }
    }, [picSearch]);

    // Handle searching Target Dosen
    useEffect(() => {
        if (targetSearch.trim().length >= 2) {
            api.get('/dosen/search', { params: { q: targetSearch } }).then((res) => {
                setTargetResults(res.data.data);
            });
        } else {
            setTargetResults([]);
        }
    }, [targetSearch]);

    const handleSelectPic = (dosen: any) => {
        setSelectedPic(dosen);
        setValue('pic_dosen_id', dosen.id);
        setPicSearch('');
        setPicResults([]);
    };

    const handleClearPic = () => {
        setSelectedPic(null);
        setValue('pic_dosen_id', '');
    };

    const handleSelectTarget = (dosen: any) => {
        if (selectedTargets.some((t) => t.id === dosen.id)) return;
        const next = [...selectedTargets, dosen];
        setSelectedTargets(next);
        setValue('target_dosen_id', next.map((t) => t.id));
        setTargetSearch('');
        setTargetResults([]);
    };

    const handleRemoveTarget = (id: number) => {
        const next = selectedTargets.filter((t) => t.id !== id);
        setSelectedTargets(next);
        setValue('target_dosen_id', next.map((t) => t.id));
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Tambah Penugasan PIC"
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
                        form="assign-form"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
                    >
                        {loading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        Simpan Penugasan
                    </button>
                </>
            }
        >
            <form id="assign-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label htmlFor="periode_id" className="block text-sm font-medium text-gray-700">
                        Periode Pelaksanaan <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="periode_id"
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

                {/* PIC Dosen (Autocomplete) */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">
                        Dosen PIC / Verifikator <span className="text-red-500">*</span>
                    </label>
                    {selectedPic ? (
                        <div className="mt-1.5 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                            <span className="font-semibold text-gray-800">
                                {selectedPic.kode_dosen} - {selectedPic.nama_lengkap}
                            </span>
                            <button
                                type="button"
                                onClick={handleClearPic}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    ) : (
                        <div className="relative mt-1">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="text"
                                value={picSearch}
                                onChange={(e) => setPicSearch(e.target.value)}
                                placeholder="Ketik nama atau kode dosen (min. 2 karakter)..."
                                className="block h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Dropdown search results */}
                    {picResults.length > 0 && (
                        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg divide-y divide-gray-100">
                            {picResults.map((d) => (
                                <li
                                    key={d.id}
                                    onClick={() => handleSelectPic(d)}
                                    className="cursor-pointer px-4 py-2 text-xs hover:bg-gray-50 text-gray-700"
                                >
                                    <strong>{d.kode_dosen}</strong> - {d.nama_lengkap}
                                </li>
                            ))}
                        </ul>
                    )}
                    {errors.pic_dosen_id && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.pic_dosen_id.message}</p>
                    )}
                </div>

                {/* Target Dosen (Autocomplete & Multi selection) */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">
                        Dosen Target (Soal yang akan diverifikasi) <span className="text-red-500">*</span>
                    </label>

                    {/* Tag list for selected target dosens */}
                    {selectedTargets.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5 border border-gray-200 rounded-lg p-2 bg-gray-50/50">
                            {selectedTargets.map((t) => (
                                <span
                                    key={t.id}
                                    className="inline-flex items-center gap-1 rounded bg-white border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700"
                                >
                                    <strong>{t.kode_dosen}</strong> - {t.nama_lengkap}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTarget(t.id)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="relative mt-2">
                        <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            value={targetSearch}
                            onChange={(e) => setTargetSearch(e.target.value)}
                            placeholder="Ketik nama atau kode dosen (min. 2 karakter)..."
                            className="block h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        />
                    </div>

                    {/* Dropdown target search results */}
                    {targetResults.length > 0 && (
                        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg divide-y divide-gray-100">
                            {targetResults.map((d) => (
                                <li
                                    key={d.id}
                                    onClick={() => handleSelectTarget(d)}
                                    className="cursor-pointer px-4 py-2 text-xs hover:bg-gray-50 text-gray-700"
                                >
                                    <strong>{d.kode_dosen}</strong> - {d.nama_lengkap}
                                </li>
                            ))}
                        </ul>
                    )}
                    {errors.target_dosen_id && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.target_dosen_id.message}</p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
