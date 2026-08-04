import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, UserPlus, Save } from 'lucide-react';
import type { DosenUser, DosenFormData } from '../types/dosen.types';
import type { ProgramStudi } from '@/features/plo-clo/types/plo.types';

interface DosenModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: DosenFormData) => void;
    editingDosen?: DosenUser | null;
    prodiList: ProgramStudi[];
    loading?: boolean;
}

export function DosenModal({
    open,
    onClose,
    onSubmit,
    editingDosen,
    prodiList,
    loading = false,
}: DosenModalProps) {
    const isEdit = !!editingDosen;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<DosenFormData>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            kode_dosen: '',
            tipe_dosen: 'biasa',
            semester_lb: '',
            prodi_id: '',
            is_coordinator: false,
            status_aktif: true,
        },
    });

    const watchTipeDosen = watch('tipe_dosen');

    useEffect(() => {
        if (editingDosen) {
            reset({
                name: editingDosen.nama_lengkap || editingDosen.name || '',
                email: editingDosen.email || '',
                password: '',
                kode_dosen: editingDosen.kode_dosen || '',
                tipe_dosen: editingDosen.tipe_dosen || 'biasa',
                semester_lb: editingDosen.semester_lb || '',
                prodi_id: editingDosen.prodi_id || '',
                is_coordinator: editingDosen.is_coordinator ?? false,
                status_aktif: editingDosen.status_aktif ?? true,
            });
        } else {
            reset({
                name: '',
                email: '',
                password: '',
                kode_dosen: '',
                tipe_dosen: 'biasa',
                semester_lb: '',
                prodi_id: '',
                is_coordinator: false,
                status_aktif: true,
            });
        }
    }, [editingDosen, open, reset]);

    if (!open) return null;

    const handleFormSubmit = (data: DosenFormData) => {
        // Clean up empty fields if editing and password is empty
        const payload: DosenFormData = { ...data };
        if (isEdit && !payload.password) {
            delete payload.password;
        }
        if (payload.tipe_dosen === 'biasa') {
            payload.semester_lb = '';
        }
        onSubmit(payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all z-10 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[var(--color-primary)]">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">
                                {isEdit ? 'Edit Akun Dosen' : 'Tambah Akun Dosen Baru'}
                            </h3>
                            <p className="text-xs text-gray-500">
                                {isEdit ? 'Ubah informasi data master dosen' : 'Daftarkan akun dosen ke sistem verifikasi'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-5 space-y-4">
                    {/* Nama Lengkap */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Nama Lengkap & Gelar <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Dr. Ir. Ahmad Dahlan, M.T."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                            {...register('name', { required: 'Nama lengkap wajib diisi.' })}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Kode Dosen / NIDN */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Kode Dosen / NIDN <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: DSN-SI-001"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                {...register('kode_dosen', { required: 'Kode dosen wajib diisi.' })}
                            />
                            {errors.kode_dosen && <p className="mt-1 text-xs text-red-500">{errors.kode_dosen.message}</p>}
                        </div>

                        <input
                            type="hidden"
                            value={prodiList[0]?.id || ''}
                            {...register('prodi_id')}
                        />
                    </div>

                    {/* Email & Password */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Email Tel-U <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                placeholder="dosen@telkomuniversity.ac.id"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                {...register('email', { required: 'Email wajib diisi.' })}
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Password {isEdit ? '(Opsional)' : <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="password"
                                placeholder={isEdit ? 'Kosongkan jika tidak diganti' : 'Minimal 6 karakter'}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                {...register('password', {
                                    required: isEdit ? false : 'Password wajib diisi untuk dosen baru.',
                                    minLength: { value: 6, message: 'Minimal 6 karakter.' },
                                })}
                            />
                            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                        </div>
                    </div>

                    {/* Tipe Dosen & Semester LB */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Tipe Dosen
                            </label>
                            <div className="flex items-center gap-4 mt-2">
                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="biasa"
                                        className="text-[var(--color-primary)] focus:ring-0"
                                        {...register('tipe_dosen')}
                                    />
                                    Dosen Tetap (Biasa)
                                </label>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="lb"
                                        className="text-[var(--color-primary)] focus:ring-0"
                                        {...register('tipe_dosen')}
                                    />
                                    Dosen LB (Luar Biasa)
                                </label>
                            </div>
                        </div>

                        {watchTipeDosen === 'lb' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Semester Keaktifan LB <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none bg-white"
                                    {...register('semester_lb', {
                                        required: watchTipeDosen === 'lb' ? 'Semester LB wajib dipilih.' : false,
                                    })}
                                >
                                    <option value="">-- Pilih Semester --</option>
                                    <option value="ganjil">Ganjil</option>
                                    <option value="genap">Genap</option>
                                </select>
                                {errors.semester_lb && (
                                    <p className="mt-1 text-xs text-red-500">{errors.semester_lb.message}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status Koordinator */}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <input
                            type="checkbox"
                            id="is_coordinator"
                            className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-0"
                            {...register('is_coordinator')}
                        />
                        <label htmlFor="is_coordinator" className="text-xs font-semibold text-gray-700 cursor-pointer">
                            Tetapkan sebagai Koordinator Program Studi (Akses Monitoring & Manajemen Dosen)
                        </label>
                    </div>

                    {/* Status Aktif */}
                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="status_aktif"
                            className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-0"
                            {...register('status_aktif')}
                        />
                        <label htmlFor="status_aktif" className="text-xs font-semibold text-gray-700 cursor-pointer">
                            Akun Aktif (Dosen dapat memilih & mengunggah berkas soal)
                        </label>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50 transition"
                        >
                            {loading && (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            )}
                            <Save size={15} />
                            {isEdit ? 'Simpan Perubahan' : 'Tambah Dosen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
