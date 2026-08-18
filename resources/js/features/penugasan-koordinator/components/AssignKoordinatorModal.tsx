import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, X, BookOpen, GraduationCap, ChevronDown, Check, UserPlus } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { cn } from '@/shared/lib/utils';
import type { Periode } from '@/features/periode/types/periode.types';
import api from '@/shared/lib/api';

const schema = z.object({
    periode_id: z.coerce.number().min(1, 'Periode akademik wajib dipilih'),
    course_id: z.string().optional(),
});

interface CourseOption {
    id: number;
    kode_mk: string;
    nama_mk: string;
    sks: number | null;
    semester: number | null;
}

interface DosenOption {
    id: number;
    nama_lengkap: string;
    kode_dosen: string;
    email?: string;
    is_koordinator_mk?: boolean;
}

interface AssignKoordinatorModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: { periode_id: number; dosen_ids: number[]; course_ids: (number | null)[] }) => void;
    periodes: Periode[];
    defaultPeriodeId: string;
    loading?: boolean;
}

export function AssignKoordinatorModal({
    open,
    onClose,
    onSubmit,
    periodes,
    defaultPeriodeId,
    loading = false,
}: AssignKoordinatorModalProps) {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<{ periode_id: number | string; course_id: string }>({
        resolver: zodResolver(schema),
        defaultValues: {
            periode_id: defaultPeriodeId ? Number(defaultPeriodeId) : '',
            course_id: '',
        },
    });

    // Courses state
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [courseSearch, setCourseSearch] = useState('');
    const [selectedCourses, setSelectedCourses] = useState<CourseOption[]>([]);
    const [isAllCourses, setIsAllCourses] = useState(false);
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);

    // Dosen state
    const [dosenSearch, setDosenSearch] = useState('');
    const [allDosen, setAllDosen] = useState<DosenOption[]>([]);
    const [filteredDosen, setFilteredDosen] = useState<DosenOption[]>([]);
    const [selectedDosen, setSelectedDosen] = useState<DosenOption[]>([]);
    const [showDosenDropdown, setShowDosenDropdown] = useState(false);

    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        if (open) {
            reset({
                periode_id: defaultPeriodeId ? Number(defaultPeriodeId) : '',
                course_id: '',
            });
            setDosenSearch('');
            setSelectedDosen([]);
            setFilteredDosen([]);
            setShowDosenDropdown(false);

            setCourseSearch('');
            setSelectedCourses([]);
            setIsAllCourses(false);
            setShowCourseDropdown(false);

            setSubmitError('');

            // Load all lecturers
            api.get('/dosen/search', { params: { q: '', per_page: 200 } }).then((res) => {
                setAllDosen(res.data.data);
                setFilteredDosen(res.data.data);
            });

            // Load all courses
            api.get('/courses').then((res) => {
                setCourses(res.data.data);
            });
        }
    }, [open, defaultPeriodeId, reset]);

    // Dosen search filtering
    useEffect(() => {
        const query = dosenSearch.trim().toLowerCase();
        const unselected = allDosen.filter(
            (d) => !selectedDosen.some((sd) => sd.id === d.id)
        );

        if (!query) {
            setFilteredDosen(unselected);
        } else {
            const result = unselected.filter(
                (d) =>
                    d.nama_lengkap.toLowerCase().includes(query) ||
                    (d.kode_dosen && d.kode_dosen.toLowerCase().includes(query)) ||
                    (d.email && d.email.toLowerCase().includes(query))
            );
            setFilteredDosen(result);
        }
    }, [dosenSearch, allDosen, selectedDosen]);

    // Course search filtering
    const filteredCourses = courses.filter((c) => {
        if (selectedCourses.some((sc) => sc.id === c.id)) return false;
        const q = courseSearch.trim().toLowerCase();
        if (!q) return true;
        return (
            c.nama_mk.toLowerCase().includes(q) ||
            c.kode_mk.toLowerCase().includes(q) ||
            (c.semester && `semester ${c.semester}`.includes(q))
        );
    });

    const handleSelectDosen = (dosen: DosenOption) => {
        if (!selectedDosen.some((d) => d.id === dosen.id)) {
            setSelectedDosen((prev) => [...prev, dosen]);
        }
        setDosenSearch('');
        setShowDosenDropdown(false);
        setSubmitError('');
    };

    const handleRemoveDosen = (id: number) => {
        setSelectedDosen((prev) => prev.filter((d) => d.id !== id));
    };

    const handleSelectCourse = (course: CourseOption) => {
        setIsAllCourses(false);
        if (!selectedCourses.some((c) => c.id === course.id)) {
            setSelectedCourses((prev) => [...prev, course]);
        }
        setCourseSearch('');
        setShowCourseDropdown(false);
        setSubmitError('');
    };

    const handleRemoveCourse = (id: number) => {
        setSelectedCourses((prev) => prev.filter((c) => c.id !== id));
    };

    const handleToggleAllCourses = () => {
        setIsAllCourses((prev) => {
            if (!prev) {
                setSelectedCourses([]);
            }
            return !prev;
        });
        setShowCourseDropdown(false);
        setSubmitError('');
    };

    const handleFormSubmit = (formData: { periode_id: number | string }) => {
        if (selectedDosen.length === 0) {
            setSubmitError('Pilih minimal satu dosen untuk dijadikan Koordinator MK.');
            return;
        }

        if (!isAllCourses && selectedCourses.length === 0) {
            setSubmitError('Pilih minimal satu mata kuliah atau pilih "Semua Mata Kuliah".');
            return;
        }

        const courseIds = isAllCourses
            ? [null]
            : selectedCourses.map((c) => c.id);

        onSubmit({
            periode_id: Number(formData.periode_id),
            dosen_ids: selectedDosen.map((d) => d.id),
            course_ids: courseIds,
        });
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Tugaskan Dosen Koordinator Mata Kuliah"
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
                        form="assign-koordinator-form"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
                    >
                        {loading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        )}
                        <UserPlus size={15} />
                        Tugaskan Koordinator MK
                    </button>
                </>
            }
        >
            <form
                id="assign-koordinator-form"
                onSubmit={handleSubmit(handleFormSubmit)}
                className="space-y-5 min-h-[380px]"
            >
                {/* Info Alert */}
                <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3 text-xs text-purple-900 flex items-start gap-2.5">
                    <GraduationCap className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold">Peran Koordinator MK:</span> Dosen yang ditugaskan akan mendapatkan role <strong>Koordinator MK</strong> dan menerima notifikasi sistem untuk mengoordinasikan mata kuliah yang dipilih pada periode ini.
                    </div>
                </div>

                {/* Periode */}
                <div>
                    <label htmlFor="assign-k-periode" className="block text-sm font-medium text-gray-700">
                        Periode Akademik <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="assign-k-periode"
                        {...register('periode_id')}
                        className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        <option value="">Pilih Periode Akademik...</option>
                        {periodes.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nama_periode} ({p.semester?.toUpperCase()} {p.tahun_akademik})
                            </option>
                        ))}
                    </select>
                    {errors.periode_id && (
                        <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.periode_id.message}</p>
                    )}
                </div>

                {/* Mata Kuliah — Multi select or All */}
                <div className="relative">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                            Mata Kuliah yang Dikoordinasikan <span className="text-red-500">*</span>
                        </label>
                        <button
                            type="button"
                            onClick={handleToggleAllCourses}
                            className={cn(
                                "text-xs font-semibold px-2 py-0.5 rounded transition cursor-pointer",
                                isAllCourses
                                    ? "bg-purple-100 text-purple-700 border border-purple-300"
                                    : "text-gray-500 hover:text-purple-700 underline"
                            )}
                        >
                            {isAllCourses ? "✓ Semua Mata Kuliah Terpilih" : "Pilih Semua Mata Kuliah"}
                        </button>
                    </div>

                    {!isAllCourses && (
                        <div className="relative mt-1.5">
                            <BookOpen
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            />
                            <input
                                id="assign-k-course-search"
                                type="text"
                                value={courseSearch}
                                onChange={(e) => {
                                    setCourseSearch(e.target.value);
                                    setShowCourseDropdown(true);
                                }}
                                onFocus={() => setShowCourseDropdown(true)}
                                onBlur={() => setTimeout(() => setShowCourseDropdown(false), 200)}
                                placeholder="Cari kode atau nama mata kuliah..."
                                className="block h-10 w-full rounded-lg border border-gray-300 pl-9 pr-10 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                            />
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setShowCourseDropdown((prev) => !prev);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                title="Lihat semua mata kuliah"
                            >
                                <ChevronDown
                                    size={16}
                                    className={cn("transition-transform duration-200", showCourseDropdown && "rotate-180")}
                                />
                            </button>
                        </div>
                    )}

                    {/* Selected courses tags */}
                    {!isAllCourses && selectedCourses.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 rounded-lg border border-gray-200 bg-gray-50/50 p-2.5">
                            {selectedCourses.map((c) => (
                                <span
                                    key={c.id}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-gray-200 pl-2 pr-1.5 py-1 text-xs font-medium text-gray-800 shadow-sm"
                                >
                                    <span className="font-mono text-[10px] bg-red-50 text-[var(--color-primary)] px-1 rounded font-semibold">
                                        {c.kode_mk}
                                    </span>
                                    <span>{c.nama_mk}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCourse(c.id)}
                                        className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                                        title="Hapus"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Course dropdown list */}
                    {!isAllCourses && showCourseDropdown && (
                        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl divide-y divide-gray-100">
                            {filteredCourses.length > 0 ? (
                                filteredCourses.map((c) => (
                                    <li
                                        key={c.id}
                                        onMouseDown={() => handleSelectCourse(c)}
                                        className="cursor-pointer px-3.5 py-2.5 hover:bg-purple-50/40 text-gray-700 transition-colors flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-bold text-[var(--color-primary)] bg-red-50 px-1.5 py-0.5 rounded">
                                                    {c.kode_mk}
                                                </span>
                                                <span className="font-medium text-sm text-gray-900">{c.nama_mk}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                                <span>Semester {c.semester ?? '-'}</span>
                                                <span>•</span>
                                                <span>{c.sks ?? '-'} SKS</span>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-3 text-center text-xs text-gray-400">
                                    {courseSearch
                                        ? `Tidak ada mata kuliah yang sesuai dengan "${courseSearch}"`
                                        : 'Semua mata kuliah sudah terpilih'}
                                </li>
                            )}
                        </ul>
                    )}
                </div>

                {/* Dosen Koordinator Selection */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700">
                        Dosen yang Ditugaskan sebagai Koordinator MK <span className="text-red-500">*</span>
                    </label>
                    <p className="mt-0.5 text-xs text-gray-400">
                        Pilih satu atau lebih dosen yang ingin dijadikan Koordinator MK.
                    </p>

                    <div className="relative mt-1.5">
                        <Search
                            size={15}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                            id="assign-k-dosen-search"
                            type="text"
                            value={dosenSearch}
                            onChange={(e) => {
                                setDosenSearch(e.target.value);
                                setShowDosenDropdown(true);
                            }}
                            onFocus={() => setShowDosenDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDosenDropdown(false), 200)}
                            placeholder="Ketik nama dosen atau NIDN/Kode Dosen..."
                            className="block h-10 w-full rounded-lg border border-gray-300 pl-9 pr-10 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                        />
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                setShowDosenDropdown((prev) => !prev);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                            title="Lihat semua dosen"
                        >
                            <ChevronDown
                                size={16}
                                className={cn("transition-transform duration-200", showDosenDropdown && "rotate-180")}
                            />
                        </button>
                    </div>

                    {/* Selected Dosen tags */}
                    {selectedDosen.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-2 rounded-lg border border-purple-100 bg-purple-50/30 p-2.5">
                            {selectedDosen.map((d) => (
                                <span
                                    key={d.id}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-purple-200 pl-2.5 pr-1.5 py-1 text-xs font-medium text-gray-800 shadow-sm"
                                >
                                    <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                                        {d.nama_lengkap.charAt(0).toUpperCase()}
                                    </div>
                                    <span>{d.nama_lengkap}</span>
                                    {d.kode_dosen && (
                                        <span className="rounded bg-gray-100 px-1 text-[10px] font-mono text-gray-500">
                                            {d.kode_dosen}
                                        </span>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDosen(d.id)}
                                        className="rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                                        title="Hapus"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Dosen search dropdown */}
                    {showDosenDropdown && (
                        <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl divide-y divide-gray-100">
                            {filteredDosen.length > 0 ? (
                                filteredDosen.map((d) => (
                                    <li
                                        key={d.id}
                                        onMouseDown={() => handleSelectDosen(d)}
                                        className="cursor-pointer px-3.5 py-2.5 hover:bg-purple-50/40 text-gray-700 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-red-100 text-[var(--color-primary)] flex items-center justify-center text-xs font-bold shrink-0">
                                                    {d.nama_lengkap.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-sm text-gray-900">{d.nama_lengkap}</span>
                                                    {d.email && <p className="text-xs text-gray-400">{d.email}</p>}
                                                </div>
                                            </div>
                                            {d.kode_dosen && (
                                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono font-medium text-gray-600">
                                                    {d.kode_dosen}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-3 text-center text-xs text-gray-400">
                                    {dosenSearch
                                        ? `Tidak ada dosen yang sesuai dengan kata kunci "${dosenSearch}"`
                                        : 'Semua dosen sudah terpilih'}
                                </li>
                            )}
                        </ul>
                    )}

                    {submitError && (
                        <p className="mt-2 text-xs text-[var(--color-danger)] font-medium">{submitError}</p>
                    )}
                </div>
            </form>
        </Modal>
    );
}
