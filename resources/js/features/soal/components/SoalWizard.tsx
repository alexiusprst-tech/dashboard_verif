import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText, Check, Upload, HelpCircle, Download } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';
import api from '@/shared/lib/api';
import type { Periode } from '@/features/periode/types/periode.types';
import type { MataKuliah, Clo } from '@/features/plo-clo/types/plo.types';
import type { Kategori, TemplateSoal } from '@/features/kategori/types/kategori.types';

interface SoalWizardProps {
    onClose: () => void;
    onSubmit: (formData: FormData) => Promise<void>;
    loading?: boolean;
}

export function SoalWizard({ onClose, onSubmit, loading = false }: SoalWizardProps) {
    const { toast } = useToast();
    const [step, setStep] = useState(1);

    // Lists loaded from backend
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [courses, setCourses] = useState<MataKuliah[]>([]);
    const [clos, setClos] = useState<Clo[]>([]);
    const [kategoris, setKategoris] = useState<Kategori[]>([]);
    const [templates, setTemplates] = useState<TemplateSoal[]>([]);

    // Selection states
    const [selectedPeriode, setSelectedPeriode] = useState<string>('');
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [selectedClo, setSelectedClo] = useState<string>('');
    const [selectedKategori, setSelectedKategori] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [judulSoal, setJudulSoal] = useState('');
    const [fileSoal, setFileSoal] = useState<File | null>(null);

    // Load active periodes, categories, and courses on mount
    useEffect(() => {
        api.get('/periode', { params: { per_page: 50 } }).then((res) => {
            setPeriodes(res.data.data);
            const active = res.data.data.find((p: any) => p.status === 'aktif');
            if (active) setSelectedPeriode(String(active.id));
        });

        api.get('/kategori', { params: { per_page: 50 } }).then((res) => {
            setKategoris(res.data.data);
        });

        api.get('/courses').then((res) => {
            setCourses(res.data.data);
        });
    }, []);

    // Load CLO when course changes
    useEffect(() => {
        if (selectedCourse) {
            api.get('/clo', { params: { dropdown: 1, mata_kuliah_id: selectedCourse } }).then((res) => {
                setClos(res.data.data);
                setSelectedClo('');
            });
        } else {
            setClos([]);
            setSelectedClo('');
        }
    }, [selectedCourse]);

    // Load Template when kategori changes
    useEffect(() => {
        if (selectedKategori) {
            api.get('/templates', { params: { kategori_id: selectedKategori } }).then((res) => {
                setTemplates(res.data.data);
                const activeTemp = res.data.data.find((t: any) => t.is_active);
                if (activeTemp) setSelectedTemplate(String(activeTemp.id));
                else setSelectedTemplate('');
            });
        } else {
            setTemplates([]);
            setSelectedTemplate('');
        }
    }, [selectedKategori]);

    const steps = [
        { title: 'Pilih Periode', desc: 'Tentukan periode pelaksanaan ujian' },
        { title: 'Mata Kuliah', desc: 'Pilih mata kuliah yang diampu' },
        { title: 'Kompetensi CLO', desc: 'Pilih CLO yang diukur' },
        { title: 'Kategori & Template', desc: 'Pilih kategori dan unduh template' },
        { title: 'Upload File', desc: 'Unggah file soal ujian' },
        { title: 'Preview & Submit', desc: 'Review kelengkapan berkas' },
    ];

    const nextStep = () => {
        // Simple manual validation per step
        if (step === 1 && !selectedPeriode) {
            toast.error('Silakan pilih Periode terlebih dahulu.');
            return;
        }
        if (step === 2 && !selectedCourse) {
            toast.error('Silakan pilih Mata Kuliah terlebih dahulu.');
            return;
        }
        if (step === 3 && !selectedClo) {
            toast.error('Silakan pilih CLO terlebih dahulu.');
            return;
        }
        if (step === 4 && (!selectedKategori || !selectedTemplate)) {
            toast.error('Silakan pilih Kategori dan Template.');
            return;
        }
        if (step === 5) {
            if (!judulSoal.trim()) {
                toast.error('Judul Soal wajib diisi.');
                return;
            }
            if (!fileSoal) {
                toast.error('File Soal wajib diunggah.');
                return;
            }
        }
        setStep((s) => Math.min(s + 1, 6));
    };

    const prevStep = () => {
        setStep((s) => Math.max(s - 1, 1));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            const ext = selected.name.split('.').pop()?.toLowerCase();
            const allowed = ['doc', 'docx', 'pdf', 'zip', 'rar'];
            if (ext && allowed.includes(ext)) {
                setFileSoal(selected);
            } else {
                toast.error('Format file tidak didukung. Gunakan doc, docx, pdf, zip, atau rar.');
            }
        }
    };

    const handleSubmit = async () => {
        const fd = new FormData();
        fd.append('periode_id', selectedPeriode);
        fd.append('mata_kuliah_id', selectedCourse);
        fd.append('clo_id', selectedClo);
        fd.append('template_id', selectedTemplate);
        fd.append('judul_soal', judulSoal);
        if (fileSoal) {
            fd.append('file_soal', fileSoal);
        }

        try {
            await onSubmit(fd);
        } catch (err) {
            // Error toast handled in parent
        }
    };

    const currentPeriodeObj = periodes.find((p) => String(p.id) === selectedPeriode);
    const currentCourseObj = courses.find((c) => String(c.id) === selectedCourse);
    const currentCloObj = clos.find((c) => String(c.id) === selectedClo);
    const currentKategoriObj = kategoris.find((k) => String(k.id) === selectedKategori);
    const currentTemplateObj = templates.find((t) => String(t.id) === selectedTemplate);

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Wizard Upload Soal</h2>
                    <p className="text-xs text-gray-500">Ikuti 6 langkah mudah untuk mengunggah soal ujian Anda</p>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                    Kembali ke Daftar
                </button>
            </div>

            {/* Step Indicators */}
            <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-6">
                {steps.map((st, idx) => {
                    const num = idx + 1;
                    const isActive = step === num;
                    const isCompleted = step > num;

                    return (
                        <div
                            key={idx}
                            className={`flex flex-col border-t-2 pt-2 transition-all ${
                                isActive
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                    : isCompleted
                                    ? 'border-green-600 text-green-600'
                                    : 'border-gray-200 text-gray-400'
                            }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-wider">Langkah {num}</span>
                            <span className="text-xs font-semibold truncate mt-0.5">{st.title}</span>
                        </div>
                    );
                })}
            </div>

            {/* Step Content Area */}
            <div className="min-h-[250px] border border-gray-100 rounded-xl p-5 bg-gray-50/50 mb-6">
                {/* STEP 1: Pilih Periode */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800">Langkah 1: Pilih Periode Akademik</h3>
                        <p className="text-xs text-gray-500">Pilih periode pelaksanaan ujian yang saat ini sedang aktif atau berjalan.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {periodes.map((p) => (
                                <label
                                    key={p.id}
                                    onClick={() => setSelectedPeriode(String(p.id))}
                                    className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                                        selectedPeriode === String(p.id)
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                                            : 'border-gray-200 bg-white hover:bg-gray-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        checked={selectedPeriode === String(p.id)}
                                        onChange={() => {}}
                                        className="mt-1 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{p.nama_periode}</p>
                                        <p className="text-xs text-gray-500">
                                            Semester {p.semester} • TA {p.tahun_akademik}
                                        </p>
                                        {p.status === 'aktif' && (
                                            <span className="mt-1.5 inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold text-green-700 border border-green-200 uppercase">
                                                Aktif
                                            </span>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: Pilih Mata Kuliah */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800">Langkah 2: Pilih Mata Kuliah</h3>
                        <p className="text-xs text-gray-500">Pilih salah satu mata kuliah yang diampu yang ingin diunggah soal ujiannya.</p>
                        <div className="max-w-md">
                            <select
                                value={selectedCourse}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                            >
                                <option value="">Pilih Mata Kuliah...</option>
                                {courses.map((mk) => (
                                    <option key={mk.id} value={mk.id}>
                                        {mk.kode_mk} - {mk.nama_mk}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* STEP 3: Pilih CLO */}
                {step === 3 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800">Langkah 3: Pilih CLO (Course Learning Outcomes)</h3>
                        <p className="text-xs text-gray-500">Tentukan CLO atau Capaian Pembelajaran Mata Kuliah yang diukur pada ujian ini.</p>
                        {clos.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-white py-10 text-center text-gray-400">
                                <HelpCircle size={24} className="mx-auto text-gray-300 mb-1" />
                                <p className="text-xs">Mata Kuliah terpilih belum memiliki data CLO.</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Silakan hubungi koordinator atau tambahkan CLO terlebih dahulu.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {clos.map((c) => (
                                    <label
                                        key={c.id}
                                        onClick={() => setSelectedClo(String(c.id))}
                                        className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition ${
                                            selectedClo === String(c.id)
                                                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                                                : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            checked={selectedClo === String(c.id)}
                                            onChange={() => {}}
                                            className="mt-1 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                        />
                                        <div>
                                            <span className="inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                                                {c.kode}
                                            </span>
                                            <p className="mt-2 text-xs text-gray-600 line-clamp-3" title={c.deskripsi}>
                                                {c.deskripsi}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 4: Pilih Kategori & Template */}
                {step === 4 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800">Langkah 4: Pilih Kategori & Unduh Template</h3>
                        <p className="text-xs text-gray-500">Unduh berkas template Word standar agar penulisan soal sesuai format Telkom University.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">Kategori Ujian</label>
                                <select
                                    value={selectedKategori}
                                    onChange={(e) => setSelectedKategori(e.target.value)}
                                    className="mt-1 block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                >
                                    <option value="">Pilih Kategori...</option>
                                    {kategoris.map((k) => (
                                        <option key={k.id} value={k.id}>
                                            {k.nama_kategori} - {k.deskripsi}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedKategori && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Template Aktif (.docx)</label>
                                    {templates.length === 0 ? (
                                        <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-1.5">
                                            <AlertCircle size={14} className="text-red-500" />
                                            Kategori ini belum memiliki template aktif.
                                        </div>
                                    ) : (
                                        <div className="mt-1 border border-gray-200 rounded-lg p-3 bg-white flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText size={20} className="text-blue-500" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-gray-800 truncate max-w-[150px]">
                                                        {templates[0].nama_file}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">Versi {templates[0].versi}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={templates[0].file_url || `/storage/${templates[0].file_path}`}
                                                download
                                                className="flex items-center gap-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 text-[10px] font-semibold transition"
                                            >
                                                <Download size={11} /> Unduh
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 5: Upload File */}
                {step === 5 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800">Langkah 5: Judul & Unggah File Soal</h3>
                        <p className="text-xs text-gray-500">Lengkapi judul soal dan lampirkan berkas soal ujian Anda dalam format doc, docx, pdf, zip atau rar.</p>

                        <div className="space-y-3 max-w-lg">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">Judul Soal</label>
                                <input
                                    type="text"
                                    value={judulSoal}
                                    onChange={(e) => setJudulSoal(e.target.value)}
                                    placeholder="Contoh: Ujian Tengah Semester Ganjil - Dasar Pemrograman Kelas IF-46"
                                    className="mt-1 block h-10 w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase">Berkas Soal Ujian</label>
                                <div className="mt-1.5 flex items-center gap-3">
                                    <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 text-sm text-gray-600 hover:border-[var(--color-primary)] hover:bg-gray-50 transition">
                                        <Upload size={16} />
                                        Pilih Berkas Soal
                                        <input
                                            type="file"
                                            accept=".doc,.docx,.pdf,.zip,.rar"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                    {fileSoal && (
                                        <div className="text-xs text-gray-600 flex flex-col">
                                            <span className="font-semibold text-gray-800">{fileSoal.name}</span>
                                            <span>{(fileSoal.size / 1024 / 1024).toFixed(2)} MB</span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 block">
                                    Format didukung: doc, docx, pdf, zip, rar. Maksimal ukuran 15MB.
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 6: Preview & Submit */}
                {step === 6 && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800">Langkah 6: Review & Finalisasi</h3>
                        <p className="text-xs text-gray-500">Periksa kembali data soal ujian sebelum dikirimkan ke pihak verifikator.</p>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm divide-y divide-gray-100">
                            <div className="grid grid-cols-3 py-2">
                                <span className="font-semibold text-gray-500">Periode</span>
                                <span className="col-span-2 text-gray-800 font-semibold">{currentPeriodeObj?.nama_periode}</span>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                                <span className="font-semibold text-gray-500">Mata Kuliah</span>
                                <span className="col-span-2 text-gray-800">{currentCourseObj?.kode_mk} - {currentCourseObj?.nama_mk}</span>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                                <span className="font-semibold text-gray-500">CLO Relasi</span>
                                <span className="col-span-2 text-gray-800">{currentCloObj?.kode} - {currentCloObj?.deskripsi}</span>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                                <span className="font-semibold text-gray-500">Kategori & Template</span>
                                <span className="col-span-2 text-gray-800">{currentKategoriObj?.nama_kategori} ({currentTemplateObj?.nama_file})</span>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                                <span className="font-semibold text-gray-500">Judul Soal</span>
                                <span className="col-span-2 text-gray-800 font-medium">{judulSoal}</span>
                            </div>
                            <div className="grid grid-cols-3 py-2">
                                <span className="font-semibold text-gray-500">Berkas Soal</span>
                                <span className="col-span-2 text-[var(--color-primary)] font-semibold truncate flex items-center gap-1">
                                    <FileText size={15} /> {fileSoal?.name}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <button
                    onClick={prevStep}
                    disabled={step === 1 || loading}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} /> Sebelumnya
                </button>

                {step < 6 ? (
                    <button
                        onClick={nextStep}
                        className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
                    >
                        Berikutnya <ChevronRight size={16} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <Check size={16} />
                        )}
                        Kirim Soal Ujian
                    </button>
                )}
            </div>
        </div>
    );
}
