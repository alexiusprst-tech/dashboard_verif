import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Upload,
    FileText,
    Calendar,
    Tag,
    BookOpen,
    Layers,
    X,
    Sparkles,
    AlertCircle,
    Info,
    Check,
    Plus,
    FileDown,
    Eye,
    CheckCircle2,
    Search,
    ChevronDown,
} from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { cn } from '@/shared/lib/utils';
import { useToast } from '@/shared/hooks/useToast';
import { useAuth } from '@/shared/hooks/useAuth';
import api from '@/shared/lib/api';
import { LembarSoalModal } from '@/features/lembar-soal/components/LembarSoalModal';
import { downloadDocx, triggerFileDownload } from '@/features/lembar-soal/api/lembarSoalApi';
import type { LembarSoalData, LembarSoalPlo } from '@/features/lembar-soal/types/lembarSoal.types';

import type { Periode } from '@/features/periode/types/periode.types';
import type { MataKuliah, Clo } from '@/features/plo-clo/types/plo.types';

const PRESET_JENIS_ASESMEN = [
    { label: 'UTS (Ujian Tengah Semester)', value: 'UTS' },
    { label: 'UAS (Ujian Akhir Semester)', value: 'UAS' },
    { label: 'Quiz / Kuis', value: 'Quiz' },
    { label: 'Tugas / Assignment', value: 'Tugas' },
    { label: 'Praktikum', value: 'Praktikum' },
    { label: 'Proyek / Project', value: 'Proyek' },
    { label: 'Ujian Susulan', value: 'Ujian Susulan' },
];

const uploadSchema = z.object({
    periode_id: z.coerce.number().min(1, 'Periode akademik wajib dipilih'),
    mata_kuliah_id: z.coerce.number().min(1, 'Mata kuliah wajib dipilih'),
    judul_soal: z.string().min(3, 'Judul soal minimal 3 karakter').max(255, 'Judul soal maksimal 255 karakter'),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface UploadSoalModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    loading?: boolean;
}

export function UploadSoalModal({ open, onClose, onSubmit, loading = false }: UploadSoalModalProps) {
    const { toast } = useToast();
    const { user } = useAuth();

    // Data lists
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [courses, setCourses] = useState<MataKuliah[]>([]);
    const [clos, setClos] = useState<Clo[]>([]);
    const [loadingClos, setLoadingClos] = useState(false);

    // Selected Types of Assessment (Multiple selection: UTS, Quiz, UAS, etc.)
    const [selectedJenisAsesmen, setSelectedJenisAsesmen] = useState<string[]>(['UTS']);
    const [customJenis, setCustomJenis] = useState<string>('');
    const [showCustomInput, setShowCustomInput] = useState(false);

    // Selected CLOs (Multi-select) & Bobot LO (%)
    const [selectedCloIds, setSelectedCloIds] = useState<number[]>([]);
    const [cloWeights, setCloWeights] = useState<Record<number, number>>({});

    // Template Lembar Soal Generation & Preview States
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);

    // File State
    const [fileSoal, setFileSoal] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string>('');
    const [cloError, setCloError] = useState<string>('');
    const [jenisError, setJenisError] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);

    // Searchable Periode State
    const [periodeSearch, setPeriodeSearch] = useState('');
    const [showPeriodeDropdown, setShowPeriodeDropdown] = useState(false);

    // Searchable Course State
    const [courseSearch, setCourseSearch] = useState('');
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<UploadFormValues>({
        resolver: zodResolver(uploadSchema),
        defaultValues: {
            periode_id: '' as any,
            mata_kuliah_id: '' as any,
            judul_soal: '',
        },
    });

    const watchedPeriodeId = watch('periode_id');
    const watchedMataKuliahId = watch('mata_kuliah_id');

    // Filtered Periodes
    const filteredPeriodes = useMemo(() => {
        const q = periodeSearch.trim().toLowerCase();
        if (!q) return periodes;
        return periodes.filter(
            (p) =>
                p.nama_periode?.toLowerCase().includes(q) ||
                p.tahun_akademik?.toLowerCase().includes(q) ||
                p.semester?.toLowerCase().includes(q) ||
                (p.status === 'aktif' && 'aktif'.includes(q))
        );
    }, [periodes, periodeSearch]);

    // Filtered Courses
    const filteredCourses = useMemo(() => {
        const q = courseSearch.trim().toLowerCase();
        if (!q) return courses;
        return courses.filter(
            (c) =>
                c.nama_mk?.toLowerCase().includes(q) ||
                c.kode_mk?.toLowerCase().includes(q) ||
                (c.semester && `semester ${c.semester}`.includes(q)) ||
                (c.sks && `${c.sks} sks`.includes(q))
        );
    }, [courses, courseSearch]);

    // Selected objects
    const selectedPeriodeObj = useMemo(() => {
        return periodes.find((p) => String(p.id) === String(watchedPeriodeId));
    }, [periodes, watchedPeriodeId]);

    const selectedCourseObj = useMemo(() => {
        return courses.find((c) => String(c.id) === String(watchedMataKuliahId));
    }, [courses, watchedMataKuliahId]);

    // Load initial data on modal open
    useEffect(() => {
        if (open) {
            reset({
                periode_id: '' as any,
                mata_kuliah_id: '' as any,
                judul_soal: '',
            });
            setPeriodeSearch('');
            setShowPeriodeDropdown(false);
            setCourseSearch('');
            setShowCourseDropdown(false);
            setSelectedJenisAsesmen(['UTS']);
            setCustomJenis('');
            setShowCustomInput(false);
            setSelectedCloIds([]);
            setCloWeights({});
            setClos([]);
            setFileSoal(null);
            setFileError('');
            setCloError('');
            setJenisError('');

            // Fetch Active Periodes
            api.get('/periode', { params: { per_page: 50 } }).then((res) => {
                const list: Periode[] = res.data.data || [];
                setPeriodes(list);
                const active = list.find((p) => p.status === 'aktif');
                if (active) {
                    setValue('periode_id', active.id);
                } else if (list.length > 0) {
                    setValue('periode_id', list[0].id);
                }
            });

            // Fetch Courses
            api.get('/courses').then((res) => {
                setCourses(res.data.data || []);
            });
        }
    }, [open, reset, setValue]);

    // When Course changes -> load associated CLOs
    useEffect(() => {
        if (watchedMataKuliahId) {
            setLoadingClos(true);
            setSelectedCloIds([]);
            setCloWeights({});
            setCloError('');

            api.get('/clo', { params: { dropdown: 1, mata_kuliah_id: watchedMataKuliahId } })
                .then((res) => {
                    const loadedClos: Clo[] = res.data.data || [];
                    setClos(loadedClos);
                    if (loadedClos.length > 0) {
                        const allIds = loadedClos.map((c) => c.id);
                        setSelectedCloIds(allIds);

                        // Initial equal weight distribution summing to 100
                        const initialWeights: Record<number, number> = {};
                        const count = loadedClos.length;
                        const equalWeight = Math.floor(100 / count);
                        const remainder = 100 - equalWeight * count;

                        loadedClos.forEach((c, idx) => {
                            initialWeights[c.id] = equalWeight + (idx === 0 ? remainder : 0);
                        });
                        setCloWeights(initialWeights);
                    }
                })
                .catch(() => {
                    setClos([]);
                })
                .finally(() => {
                    setLoadingClos(false);
                });
        } else {
            setClos([]);
            setSelectedCloIds([]);
            setCloWeights({});
        }
    }, [watchedMataKuliahId]);

    // Toggle Jenis Asesmen selection
    const handleToggleJenisAsesmen = (value: string) => {
        setJenisError('');
        setSelectedJenisAsesmen((prev) => {
            if (prev.includes(value)) {
                const next = prev.filter((v) => v !== value);
                return next.length === 0 ? [value] : next;
            } else {
                return [...prev, value];
            }
        });
    };

    const handleAddCustomJenis = () => {
        const trimmed = customJenis.trim();
        if (trimmed && !selectedJenisAsesmen.includes(trimmed)) {
            setSelectedJenisAsesmen((prev) => [...prev, trimmed]);
            setCustomJenis('');
            setShowCustomInput(false);
            setJenisError('');
        }
    };

    // Toggle CLO selection
    const handleToggleClo = (cloId: number) => {
        setCloError('');
        setSelectedCloIds((prev) => {
            const next = prev.includes(cloId) ? prev.filter((id) => id !== cloId) : [...prev, cloId];
            return next;
        });
    };

    const handleSelectAllClos = () => {
        setCloError('');
        if (selectedCloIds.length === clos.length) {
            setSelectedCloIds([]);
        } else {
            setSelectedCloIds(clos.map((c) => c.id));
        }
    };

    // Update individual CLO weight
    const handleWeightChange = (cloId: number, weightVal: number) => {
        const safeWeight = isNaN(weightVal) ? 0 : Math.max(0, Math.min(100, weightVal));
        setCloWeights((prev) => ({
            ...prev,
            [cloId]: safeWeight,
        }));
    };

    // Calculate total Bobot of selected CLOs
    const totalSelectedBobot = useMemo(() => {
        return selectedCloIds.reduce((acc, id) => acc + (cloWeights[id] || 0), 0);
    }, [selectedCloIds, cloWeights]);

    // Auto-generate title helper
    const handleAutoGenerateTitle = () => {
        const selectedCourse = courses.find((c) => String(c.id) === String(watchedMataKuliahId));
        const selectedPeriode = periodes.find((p) => String(p.id) === String(watchedPeriodeId));
        const jenisStr = selectedJenisAsesmen.join(' & ') || 'UTS';

        if (selectedCourse) {
            const periodeStr = selectedPeriode ? ` (${selectedPeriode.nama_periode})` : '';
            setValue('judul_soal', `Naskah Soal ${jenisStr} - ${selectedCourse.kode_mk} ${selectedCourse.nama_mk}${periodeStr}`);
        }
    };

    // Construct dynamic Lembar Soal data payload for Generator & Preview
    const buildLembarSoalData = (): LembarSoalData => {
        const selectedCourse = courses.find((c) => String(c.id) === String(watchedMataKuliahId));
        const selectedPeriode = periodes.find((p) => String(p.id) === String(watchedPeriodeId));
        const tipeUjianStr = selectedJenisAsesmen.join(', ') || 'UTS';

        // Filter selected CLOs and group by PLO
        const selectedClos = clos.filter((c) => selectedCloIds.includes(c.id));
        const ploMap: Record<string, LembarSoalPlo> = {};

        selectedClos.forEach((clo) => {
            const ploKey = clo.plo?.kode || `PLO-${clo.plo_id || '1'}`;
            const ploDesc = clo.plo?.deskripsi || 'Capaian Pembelajaran Lulusan Program Studi.';

            if (!ploMap[ploKey]) {
                ploMap[ploKey] = {
                    kode: ploKey,
                    deskripsi: ploDesc,
                    clo: [],
                };
            }

            ploMap[ploKey].clo.push({
                kode: clo.kode,
                deskripsi: clo.deskripsi,
                bobot_lo: `${cloWeights[clo.id] ?? 0}%`,
            });
        });

        // Fallback PLO if none selected
        const ploList = Object.values(ploMap);
        if (ploList.length === 0) {
            ploList.push({
                kode: 'PLO1',
                deskripsi: 'Capaian Pembelajaran Lulusan Mata Kuliah.',
                clo: [
                    {
                        kode: 'CLO1',
                        deskripsi: 'Kemampuan menguasai konsep dan implementasi materi mata kuliah.',
                        bobot_lo: '100%',
                    },
                ],
            });
        }

        return {
            nama_evaluasi: `${tipeUjianStr} (${selectedPeriode?.nama_periode ?? 'Semester Aktif'})`,
            kode_nama_mk: selectedCourse ? `${selectedCourse.kode_mk} / ${selectedCourse.nama_mk}` : 'IS1234 / Mata Kuliah',
            kode_dosen: user?.kode_dosen || user?.name || 'D001',
            tipe_ujian: tipeUjianStr,
            tanggal_evaluasi: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            tipe_soal: 'Closed Book / Essay',
            form_no: 'FORM-AKD-01/02',
            petunjuk_pengerjaan: [
                'Bacalah setiap butir soal dengan cermat sebelum menjawab.',
                'Jawablah seluruh pertanyaan pada lembar jawaban yang telah disediakan.',
                'Dilarang melakukan kecurangan dalam bentuk apapun selama ujian berlangsung.',
            ],
            plo: ploList,
        };
    };

    // Quick download DOCX template handler
    const handleQuickDownloadTemplate = async () => {
        if (!watchedMataKuliahId) {
            toast.error('Pilih Mata Kuliah terlebih dahulu untuk mengunduh template.');
            return;
        }

        setDownloadingTemplate(true);
        try {
            const payload = buildLembarSoalData();
            const blob = await downloadDocx(payload);
            const fileName = `Lembar_Soal_${payload.tipe_ujian}_${payload.kode_nama_mk.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
            triggerFileDownload(blob, fileName);
            toast.success('Template Lembar Soal (.docx) berhasil diunduh! Silakan isi naskah soal di Word.');
        } catch (e) {
            toast.error('Gagal mengunduh template Lembar Soal.');
        } finally {
            setDownloadingTemplate(false);
        }
    };

    // File handling
    const handleFileValidation = (file: File): boolean => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        const allowedExtensions = ['.pdf', '.doc', '.docx'];
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
            setFileError('Format file tidak didukung. Harap unggah berkas PDF atau Word (.doc, .docx).');
            return false;
        }

        if (file.size > 10 * 1024 * 1024) {
            setFileError('Ukuran file melebihi batas maksimal 10MB.');
            return false;
        }

        setFileError('');
        return true;
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (handleFileValidation(file)) {
                setFileSoal(file);
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (handleFileValidation(file)) {
                setFileSoal(file);
            }
        }
    };

    const onFormSubmit = async (values: UploadFormValues) => {
        if (selectedJenisAsesmen.length === 0) {
            setJenisError('Pilih minimal satu jenis asesmen.');
            return;
        }

        if (clos.length > 0 && selectedCloIds.length === 0) {
            setCloError('Pilih minimal satu CLO yang berkaitan dengan soal ujian.');
            return;
        }

        if (!fileSoal) {
            setFileError('Berkas naskah soal wajib diunggah.');
            return;
        }

        const formData = new FormData();
        formData.append('periode_id', String(values.periode_id));
        formData.append('mata_kuliah_id', String(values.mata_kuliah_id));
        formData.append('judul_soal', values.judul_soal);
        formData.append('file_soal', fileSoal);

        // Attach jenis asesmen
        selectedJenisAsesmen.forEach((jenis) => {
            formData.append('jenis_asesmen[]', jenis);
        });

        // Attach primary CLO and CLO ids array
        if (selectedCloIds.length > 0) {
            formData.append('clo_id', String(selectedCloIds[0]));
            selectedCloIds.forEach((id) => {
                formData.append('clo_ids[]', String(id));
            });
        }

        try {
            await onSubmit(formData);
        } catch (e) {
            // Handled in parent
        }
    };

    return (
        <>
            <Modal
                open={open}
                onClose={onClose}
                title="Unggah Naskah Soal Ujian"
                size="2xl"
                footer={
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            form="upload-soal-form"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] disabled:opacity-60 cursor-pointer"
                        >
                            {loading && (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            )}
                            <Upload size={16} />
                            Unggah Soal Ujian
                        </button>
                    </>
                }
            >
                <form id="upload-soal-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    {/* Info Notice */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-900 flex items-start gap-3">
                        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            Unggah naskah soal ujian Anda dalam format <strong>PDF atau Word (.doc, .docx, maks. 10MB)</strong>. Tentukan jenis asesmen, pilih CLO terkait, dan atur bobot LO sebelum mengunggah.
                        </div>
                    </div>

                    {/* Section 1: Detail Akademik & Mata Kuliah */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <Calendar size={14} className="text-[var(--color-primary)]" />
                            1. Informasi Akademik & Mata Kuliah
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Searchable Periode Akademik */}
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Periode Akademik <span className="text-red-500">*</span>
                                </label>

                                <input type="hidden" {...register('periode_id')} />

                                <div className="relative">
                                    <Calendar
                                        size={15}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        value={
                                            showPeriodeDropdown
                                                ? periodeSearch
                                                : selectedPeriodeObj
                                                ? `${selectedPeriodeObj.nama_periode}${selectedPeriodeObj.status === 'aktif' ? ' (Aktif)' : ''}`
                                                : ''
                                        }
                                        onChange={(e) => {
                                            setPeriodeSearch(e.target.value);
                                            setShowPeriodeDropdown(true);
                                        }}
                                        onFocus={() => {
                                            setPeriodeSearch('');
                                            setShowPeriodeDropdown(true);
                                        }}
                                        onBlur={() => setTimeout(() => setShowPeriodeDropdown(false), 200)}
                                        placeholder="Cari periode (nama, tahun, semester)..."
                                        className={cn(
                                            "block h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-14 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-shadow",
                                            errors.periode_id && "border-red-400"
                                        )}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {watchedPeriodeId ? (
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setValue('periode_id', '' as any, { shouldValidate: true });
                                                    setPeriodeSearch('');
                                                    setShowPeriodeDropdown(false);
                                                }}
                                                className="p-1 text-gray-400 hover:text-gray-600 transition rounded cursor-pointer"
                                                title="Hapus pilihan"
                                            >
                                                <X size={14} />
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setShowPeriodeDropdown((prev) => !prev);
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600 transition rounded focus:outline-none cursor-pointer"
                                            title="Buka daftar periode"
                                        >
                                            <ChevronDown
                                                size={15}
                                                className={cn("transition-transform duration-200", showPeriodeDropdown && "rotate-180")}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Periode Dropdown Menu */}
                                {showPeriodeDropdown && (
                                    <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl divide-y divide-gray-50">
                                        {filteredPeriodes.length > 0 ? (
                                            filteredPeriodes.map((p) => {
                                                const isSelected = String(p.id) === String(watchedPeriodeId);
                                                return (
                                                    <li
                                                        key={p.id}
                                                        onMouseDown={() => {
                                                            setValue('periode_id', p.id, { shouldValidate: true });
                                                            setPeriodeSearch('');
                                                            setShowPeriodeDropdown(false);
                                                        }}
                                                        className={cn(
                                                            "cursor-pointer px-3.5 py-2.5 text-sm transition-colors flex items-center justify-between",
                                                            isSelected ? "bg-red-50/60 text-[var(--color-primary)] font-semibold" : "hover:bg-gray-50 text-gray-800"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span>{p.nama_periode}</span>
                                                            {p.status === 'aktif' && (
                                                                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                                    Aktif
                                                                </span>
                                                            )}
                                                        </div>
                                                        {isSelected && <Check size={14} className="text-[var(--color-primary)] shrink-0" />}
                                                    </li>
                                                );
                                            })
                                        ) : (
                                            <li className="px-4 py-3 text-center text-xs text-gray-400">
                                                Tidak ada periode yang sesuai dengan "{periodeSearch}"
                                            </li>
                                        )}
                                    </ul>
                                )}
                                {errors.periode_id && (
                                    <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.periode_id.message}</p>
                                )}
                            </div>

                            {/* Searchable Mata Kuliah */}
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Mata Kuliah <span className="text-red-500">*</span>
                                </label>

                                <input type="hidden" {...register('mata_kuliah_id')} />

                                <div className="relative">
                                    <BookOpen
                                        size={15}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        value={
                                            showCourseDropdown
                                                ? courseSearch
                                                : selectedCourseObj
                                                ? `${selectedCourseObj.kode_mk} - ${selectedCourseObj.nama_mk} (${selectedCourseObj.sks ?? 3} SKS)`
                                                : ''
                                        }
                                        onChange={(e) => {
                                            setCourseSearch(e.target.value);
                                            setShowCourseDropdown(true);
                                        }}
                                        onFocus={() => {
                                            setCourseSearch('');
                                            setShowCourseDropdown(true);
                                        }}
                                        onBlur={() => setTimeout(() => setShowCourseDropdown(false), 200)}
                                        placeholder="Cari kode atau nama mata kuliah..."
                                        className={cn(
                                            "block h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-14 text-sm focus:border-[var(--color-primary)] focus:outline-none transition-shadow",
                                            errors.mata_kuliah_id && "border-red-400"
                                        )}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {watchedMataKuliahId ? (
                                            <button
                                                type="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setValue('mata_kuliah_id', '' as any, { shouldValidate: true });
                                                    setCourseSearch('');
                                                    setShowCourseDropdown(false);
                                                }}
                                                className="p-1 text-gray-400 hover:text-gray-600 transition rounded cursor-pointer"
                                                title="Hapus pilihan"
                                            >
                                                <X size={14} />
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                setShowCourseDropdown((prev) => !prev);
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600 transition rounded focus:outline-none cursor-pointer"
                                            title="Buka daftar mata kuliah"
                                        >
                                            <ChevronDown
                                                size={15}
                                                className={cn("transition-transform duration-200", showCourseDropdown && "rotate-180")}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Course Dropdown Menu */}
                                {showCourseDropdown && (
                                    <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl divide-y divide-gray-50">
                                        {filteredCourses.length > 0 ? (
                                            filteredCourses.map((c) => {
                                                const isSelected = String(c.id) === String(watchedMataKuliahId);
                                                return (
                                                    <li
                                                        key={c.id}
                                                        onMouseDown={() => {
                                                            setValue('mata_kuliah_id', c.id, { shouldValidate: true });
                                                            setCourseSearch('');
                                                            setShowCourseDropdown(false);
                                                        }}
                                                        className={cn(
                                                            "cursor-pointer px-3.5 py-2.5 text-sm transition-colors flex items-center justify-between",
                                                            isSelected ? "bg-red-50/60" : "hover:bg-gray-50"
                                                        )}
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs font-bold text-[var(--color-primary)] bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                                                                    {c.kode_mk}
                                                                </span>
                                                                <span className="font-semibold text-gray-900">{c.nama_mk}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                                                                <span>Semester {c.semester ?? '-'}</span>
                                                                <span>•</span>
                                                                <span>{c.sks ?? 3} SKS</span>
                                                            </div>
                                                        </div>
                                                        {isSelected && <Check size={14} className="text-[var(--color-primary)] shrink-0" />}
                                                    </li>
                                                );
                                            })
                                        ) : (
                                            <li className="px-4 py-3 text-center text-xs text-gray-400">
                                                Tidak ada mata kuliah yang sesuai dengan "{courseSearch}"
                                            </li>
                                        )}
                                    </ul>
                                )}
                                {errors.mata_kuliah_id && (
                                    <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.mata_kuliah_id.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Jenis Asesmen / Jenis Soal (Multi-select) */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-semibold text-gray-700">
                                    Jenis Asesmen / Jenis Soal <span className="text-red-500">*</span>
                                </label>
                                <span className="text-[11px] text-gray-400">
                                    Pilih satu atau lebih jenis (misal: UTS, Quiz, dsb.)
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {PRESET_JENIS_ASESMEN.map((item) => {
                                    const isSelected = selectedJenisAsesmen.includes(item.value);
                                    return (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => handleToggleJenisAsesmen(item.value)}
                                            className={cn(
                                                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
                                                isSelected
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                            )}
                                        >
                                            {isSelected && <Check size={13} />}
                                            {item.label}
                                        </button>
                                    );
                                })}

                                {/* Extra custom tags */}
                                {selectedJenisAsesmen
                                    .filter((val) => !PRESET_JENIS_ASESMEN.some((p) => p.value === val))
                                    .map((val) => (
                                        <span
                                            key={val}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs"
                                        >
                                            <Check size={13} />
                                            {val}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleJenisAsesmen(val)}
                                                className="ml-0.5 rounded hover:bg-blue-700 p-0.5"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}

                                {!showCustomInput ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomInput(true)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition cursor-pointer"
                                    >
                                        <Plus size={13} />
                                        Jenis Lainnya...
                                    </button>
                                ) : (
                                    <div className="inline-flex items-center gap-1.5">
                                        <input
                                            type="text"
                                            value={customJenis}
                                            onChange={(e) => setCustomJenis(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCustomJenis();
                                                }
                                            }}
                                            placeholder="Ketik jenis asesmen..."
                                            className="h-8 rounded-lg border border-gray-300 bg-white px-2.5 text-xs focus:border-[var(--color-primary)] focus:outline-none"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCustomJenis}
                                            className="h-8 rounded-lg bg-[var(--color-primary)] px-2.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-dark)]"
                                        >
                                            Tambah
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCustomInput(false);
                                                setCustomJenis('');
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {jenisError && (
                                <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{jenisError}</p>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Pemetaan CLO & Input Bobot LO */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                <Layers size={14} className="text-[var(--color-primary)]" />
                                2. Capaian Pembelajaran Mata Kuliah (Pilih CLO & Input Bobot LO) <span className="text-red-500">*</span>
                            </h3>

                            <div className="flex items-center gap-2">
                                {/* Total Bobot Badge */}
                                {selectedCloIds.length > 0 && (
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                            totalSelectedBobot === 100
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}
                                    >
                                        {totalSelectedBobot === 100 ? (
                                            <CheckCircle2 size={11} />
                                        ) : (
                                            <AlertCircle size={11} />
                                        )}
                                        Total: {totalSelectedBobot}%
                                    </span>
                                )}

                                {clos.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleSelectAllClos}
                                        className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                                    >
                                        {selectedCloIds.length === clos.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {!watchedMataKuliahId ? (
                            <div className="rounded-lg border border-dashed border-gray-200 bg-white p-6 text-center text-xs text-gray-400">
                                Pilih Mata Kuliah terlebih dahulu untuk menampilkan daftar CLO.
                            </div>
                        ) : loadingClos ? (
                            <div className="flex items-center justify-center p-6 text-xs text-gray-400 gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
                                Memuat daftar CLO mata kuliah...
                            </div>
                        ) : clos.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/40 p-4 text-center text-xs text-amber-800 flex items-center justify-center gap-2">
                                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                                Mata kuliah ini belum memiliki data CLO pada sistem.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {clos.map((clo) => {
                                    const isSelected = selectedCloIds.includes(clo.id);
                                    return (
                                        <div
                                            key={clo.id}
                                            className={cn(
                                                'flex items-center justify-between gap-3 rounded-lg border p-2.5 transition',
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                            )}
                                        >
                                            <div
                                                onClick={() => handleToggleClo(clo.id)}
                                                className="flex items-start gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="mt-0.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="inline-flex rounded bg-blue-100/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-800 border border-blue-200">
                                                            {clo.kode}
                                                        </span>
                                                        {clo.plo && (
                                                            <span className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-mono text-gray-600">
                                                                {clo.plo.kode}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="mt-1 text-xs text-gray-700 font-medium line-clamp-1">
                                                        {clo.deskripsi}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Bobot Input (hanya aktif jika CLO dipilih) */}
                                            {isSelected && (
                                                <div className="flex items-center gap-1.5 shrink-0 bg-white px-2 py-1 rounded-md border border-blue-200 shadow-2xs">
                                                    <span className="text-[11px] font-bold text-gray-500">Bobot:</span>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={cloWeights[clo.id] ?? ''}
                                                        onChange={(e) =>
                                                            handleWeightChange(clo.id, parseInt(e.target.value, 10))
                                                        }
                                                        placeholder="20"
                                                        className="h-6 w-12 rounded border border-gray-300 px-1 text-center text-xs font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
                                                    />
                                                    <span className="text-xs font-bold text-gray-600">%</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {cloError && <p className="text-xs text-[var(--color-danger)] font-medium">{cloError}</p>}
                    </div>

                    {/* Section Generator Template Lembar Soal Banner */}
                    <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
                                    <FileDown size={18} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                                        Generator Template Lembar Soal Resmi
                                        <span className="rounded bg-blue-200/80 px-1.5 py-0.2 text-[9px] font-bold text-blue-800 uppercase">
                                            Telkom University
                                        </span>
                                    </h4>
                                    <p className="text-[11px] text-blue-800/80 mt-0.5 leading-relaxed">
                                        Unduh master template Lembar Soal Word (.docx) yang sudah terisi otomatis dengan informasi mata kuliah, petunjuk, PLO, CLO, dan bobot di atas. Anda tinggal mengetikkan butir soal di Microsoft Word lalu mengunggahnya.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <button
                                type="button"
                                onClick={handleQuickDownloadTemplate}
                                disabled={downloadingTemplate || !watchedMataKuliahId}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
                            >
                                {downloadingTemplate ? (
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <FileDown size={14} />
                                )}
                                Unduh Template Lembar Soal (.docx)
                            </button>

                            <button
                                type="button"
                                onClick={() => setPreviewModalOpen(true)}
                                disabled={!watchedMataKuliahId}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition disabled:opacity-50 cursor-pointer"
                            >
                                <Eye size={14} />
                                Preview Lembar Soal
                            </button>
                        </div>
                    </div>

                    {/* Section 3: Judul & Berkas Soal */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <FileText size={14} className="text-[var(--color-primary)]" />
                            3. Judul & Berkas Naskah Soal
                        </h3>

                        {/* Judul Soal */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-semibold text-gray-700">
                                    Judul Naskah Soal <span className="text-red-500">*</span>
                                </label>
                                {watchedMataKuliahId && (
                                    <button
                                        type="button"
                                        onClick={handleAutoGenerateTitle}
                                        className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <Sparkles size={12} />
                                        Generate Judul Otomatis
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                {...register('judul_soal')}
                                placeholder="Contoh: Soal UTS - IF2113 Dasar Pemrograman (Ganjil 2026/2027)"
                                className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                            />
                            {errors.judul_soal && (
                                <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.judul_soal.message}</p>
                            )}
                        </div>

                        {/* File Dropzone */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Berkas Soal Ujian (PDF atau Word) <span className="text-red-500">*</span>
                            </label>

                            {!fileSoal ? (
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setIsDragging(true);
                                    }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={cn(
                                        'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition',
                                        isDragging
                                            ? 'border-[var(--color-primary)] bg-blue-50/50'
                                            : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                                    )}
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[var(--color-primary)] mb-3">
                                        <Upload size={22} />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1">
                                        Tarik dan lepas berkas naskah soal di sini, atau{' '}
                                        <label
                                            htmlFor="file-upload-input"
                                            className="text-[var(--color-primary)] underline cursor-pointer font-bold"
                                        >
                                            pilih berkas
                                        </label>
                                    </p>
                                    <p className="text-[11px] text-gray-400">
                                        Mendukung PDF (.pdf) atau Word (.doc, .docx) hingga 10MB
                                    </p>
                                    <input
                                        id="file-upload-input"
                                        type="file"
                                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                        onChange={handleFileInput}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-bold text-gray-900 truncate">
                                                {fileSoal.name}
                                            </p>
                                            <p className="text-[11px] text-gray-400">
                                                {(fileSoal.size / 1024 / 1024).toFixed(2)} MB • {fileSoal.name.endsWith('.pdf') ? 'Dokumen PDF' : 'Dokumen Word'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFileSoal(null)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                        title="Hapus berkas"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {fileError && (
                                <p className="mt-1.5 text-xs text-[var(--color-danger)] font-medium">{fileError}</p>
                            )}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Quick Preview Lembar Soal Modal */}
            <LembarSoalModal
                open={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                data={buildLembarSoalData()}
            />
        </>
    );
}
