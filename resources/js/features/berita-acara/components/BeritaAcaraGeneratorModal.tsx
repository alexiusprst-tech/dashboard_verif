import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { useToast } from '@/shared/hooks/useToast';
import api from '@/shared/lib/api';
import {
    FileText,
    Download,
    Plus,
    Trash2,
    BookOpen,
    Sparkles,
    Calendar,
    UserCheck,
    CheckCircle2,
} from 'lucide-react';

interface EvaluasiItem {
    bentuk_asesmen: string;
    clo: string;
    no_soal: string;
    catatan_evaluasi: string;
    rekomendasi: string;
}

interface FormState {
    form_no: string;
    no_dokumen: string;
    no_revisi: string;
    berlaku: string;
    semester_tahun_akademik: string;
    fakultas: string;
    nama_evaluator: string;
    kode_dosen: string;
    program_studi: string;
    kode_mata_kuliah: string;
    nama_mata_kuliah: string;
    program_studi_mk: string;
    dosen_koordinator: string;
    evaluasi: EvaluasiItem[];
    kota: string;
    tanggal: string;
    ttd: {
        evaluator_soal: string;
        dosen_koordinator: string;
        ka_prodi: string;
    };
}

const DEFAULT_FORM: FormState = {
    form_no: '100-S1SI-001-R1',
    no_dokumen: '100-S1SI-001-R1',
    no_revisi: '00',
    berlaku: '18/08/2026',
    semester_tahun_akademik: 'Ganjil 2026/2027',
    fakultas: 'Rekayasa Industri',
    nama_evaluator: '',
    kode_dosen: '',
    program_studi: 'S1 Sistem Informasi',
    kode_mata_kuliah: '',
    nama_mata_kuliah: '',
    program_studi_mk: 'S1 Sistem Informasi',
    dosen_koordinator: '',
    evaluasi: [
        {
            bentuk_asesmen: 'UTS',
            clo: 'CLO1',
            no_soal: '1',
            catatan_evaluasi: 'Sesuai',
            rekomendasi: '-',
        },
    ],
    kota: 'Bandung',
    tanggal: '18 Agustus 2026',
    ttd: {
        evaluator_soal: '',
        dosen_koordinator: '',
        ka_prodi: 'Dr. Hubbul Walidain, S.Kom., M.T.',
    },
};

interface BeritaAcaraGeneratorModalProps {
    open: boolean;
    onClose: () => void;
    periodeId?: string | number;
}

export function BeritaAcaraGeneratorModal({
    open,
    onClose,
    periodeId,
}: BeritaAcaraGeneratorModalProps) {
    const { toast } = useToast();
    const [courses, setCourses] = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
    const [loadingInit, setLoadingInit] = useState(false);
    const [downloadingDocx, setDownloadingDocx] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    // Load available courses for autofill selection
    useEffect(() => {
        if (open) {
            api.get('/courses')
                .then((res) => {
                    const list = res.data?.data ?? [];
                    setCourses(list);
                    if (list.length > 0 && !selectedCourseId) {
                        setSelectedCourseId(String(list[0].id));
                    }
                })
                .catch(() => setCourses([]));
        }
    }, [open]);

    // Fetch autofilled initial data when modal opens or course changes
    useEffect(() => {
        if (open) {
            setLoadingInit(true);
            const params: Record<string, any> = {};
            if (selectedCourseId) params.mata_kuliah_id = selectedCourseId;
            if (periodeId) params.periode_id = periodeId;

            api.get('/berita-acara-evaluasi/initial-data', { params })
                .then((res) => {
                    if (res.data?.data) {
                        setFormData(res.data.data);
                    }
                })
                .catch(() => {
                    // Fallback to default
                })
                .finally(() => {
                    setLoadingInit(false);
                });
        }
    }, [open, selectedCourseId, periodeId]);

    const handleAddRow = () => {
        const nextCloNum = formData.evaluasi.length + 1;
        setFormData((prev) => ({
            ...prev,
            evaluasi: [
                ...prev.evaluasi,
                {
                    bentuk_asesmen: 'UTS',
                    clo: `CLO${nextCloNum}`,
                    no_soal: String(nextCloNum),
                    catatan_evaluasi: 'Sesuai',
                    rekomendasi: '-',
                },
            ],
        }));
    };

    const handleRemoveRow = (index: number) => {
        if (formData.evaluasi.length <= 1) {
            toast.error('Minimal harus ada 1 baris evaluasi.');
            return;
        }
        setFormData((prev) => ({
            ...prev,
            evaluasi: prev.evaluasi.filter((_, i) => i !== index),
        }));
    };

    const handleEvaluasiChange = (index: number, field: keyof EvaluasiItem, val: string) => {
        setFormData((prev) => {
            const next = [...prev.evaluasi];
            next[index] = { ...next[index], [field]: val };
            return { ...prev, evaluasi: next };
        });
    };

    const handleDownloadDocx = async () => {
        try {
            setDownloadingDocx(true);
            const res = await api.post('/berita-acara-evaluasi/download-docx', formData, {
                responseType: 'blob',
            });
            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const kode = formData.kode_mata_kuliah.replace(/[^a-zA-Z0-9_-]/g, '_') || 'MK';
            a.download = `Berita_Acara_Evaluasi_${kode}_${new Date().toISOString().slice(0, 10)}.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Berkas Berita Acara Word (.docx) berhasil diunduh.');
        } catch (e: any) {
            toast.error('Gagal mengunduh berkas Word.');
        } finally {
            setDownloadingDocx(false);
        }
    };

    const handleDownloadPdf = async () => {
        try {
            setDownloadingPdf(true);
            const res = await api.post('/berita-acara-evaluasi/download-pdf', formData, {
                responseType: 'blob',
            });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const kode = formData.kode_mata_kuliah.replace(/[^a-zA-Z0-9_-]/g, '_') || 'MK';
            a.download = `Berita_Acara_Evaluasi_${kode}_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Berkas Berita Acara PDF berhasil diunduh.');
        } catch (e: any) {
            toast.error('Gagal mengunduh berkas PDF.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Generator Berita Acara Evaluasi Kesesuaian Soal dengan CLO"
            description="Format resmi Universitas Telkom (Form No: 100-S1SI-001-R1) untuk evaluasi kesesuaian soal asesmen."
            size="3xl"
            footer={
                <div className="flex flex-wrap items-center justify-between w-full gap-2">
                    <div className="text-xs text-gray-500 font-medium">
                        {formData.evaluasi.length} baris evaluasi siap digenerate
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                        >
                            Tutup
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf || downloadingDocx}
                            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition disabled:opacity-60 cursor-pointer"
                        >
                            {downloadingPdf ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Download size={14} />
                            )}
                            Unduh PDF
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadDocx}
                            disabled={downloadingDocx || downloadingPdf}
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--color-primary-dark)] transition disabled:opacity-60 cursor-pointer"
                        >
                            {downloadingDocx ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Download size={14} />
                            )}
                            Unduh Word (.docx)
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Autofill Toolbar */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-blue-600 shrink-0" />
                        <div>
                            <h4 className="text-xs font-bold text-blue-900">Autofill Data Berita Acara</h4>
                            <p className="text-[11px] text-blue-700">Pilih mata kuliah untuk mengisi seluruh data & CLO secara otomatis.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                            <option value="">-- Pilih Mata Kuliah --</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.kode_mk} - {c.nama_mk} ({c.clo_count ?? 0} CLO)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loadingInit && (
                    <div className="text-center py-2 text-xs text-blue-600 animate-pulse font-medium">
                        Memuat data struktur mata kuliah...
                    </div>
                )}

                {/* Section 1: Informasi Akademik & Evaluator */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Box: Informasi Akademik */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-3 shadow-2xs">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={14} className="text-[var(--color-primary)]" />
                            1. Informasi Akademik
                        </h4>

                        <div className="space-y-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                                    Semester / Tahun Akademik
                                </label>
                                <input
                                    type="text"
                                    value={formData.semester_tahun_akademik}
                                    onChange={(e) =>
                                        setFormData((p) => ({ ...p, semester_tahun_akademik: e.target.value }))
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                                    Fakultas
                                </label>
                                <input
                                    type="text"
                                    value={formData.fakultas}
                                    onChange={(e) => setFormData((p) => ({ ...p, fakultas: e.target.value }))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Box: Data Evaluator */}
                    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-3 shadow-2xs">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                            <UserCheck size={14} className="text-[var(--color-primary)]" />
                            2. Data Evaluator Soal
                        </h4>

                        <div className="space-y-2">
                            <div>
                                <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                                    Nama Evaluator
                                </label>
                                <input
                                    type="text"
                                    value={formData.nama_evaluator}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setFormData((p) => ({
                                            ...p,
                                            nama_evaluator: v,
                                            ttd: { ...p.ttd, evaluator_soal: v },
                                        }));
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                                        Kode Dosen
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.kode_dosen}
                                        onChange={(e) => setFormData((p) => ({ ...p, kode_dosen: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">
                                        Program Studi
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.program_studi}
                                        onChange={(e) => setFormData((p) => ({ ...p, program_studi: e.target.value }))}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Data Mata Kuliah */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen size={14} className="text-[var(--color-primary)]" />
                        3. Data Mata Kuliah & Dosen Koordinator
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Kode MK</label>
                            <input
                                type="text"
                                value={formData.kode_mata_kuliah}
                                onChange={(e) => setFormData((p) => ({ ...p, kode_mata_kuliah: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none font-mono font-bold"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Nama Mata Kuliah</label>
                            <input
                                type="text"
                                value={formData.nama_mata_kuliah}
                                onChange={(e) => setFormData((p) => ({ ...p, nama_mata_kuliah: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none font-semibold"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Prodi MK</label>
                            <input
                                type="text"
                                value={formData.program_studi_mk}
                                onChange={(e) => setFormData((p) => ({ ...p, program_studi_mk: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Dosen Koordinator</label>
                            <input
                                type="text"
                                value={formData.dosen_koordinator}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setFormData((p) => ({
                                        ...p,
                                        dosen_koordinator: v,
                                        ttd: { ...p.ttd, dosen_koordinator: v },
                                    }));
                                }}
                                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none font-semibold"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 3: Tabel Hasil Evaluasi (Dinamis) */}
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={14} className="text-[var(--color-primary)]" />
                                4. Tabel Hasil Evaluasi Kesesuaian Soal dengan CLO
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                                Isi evaluasi butir soal per bentuk asesmen dan capaian pembelajaran (CLO).
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddRow}
                            className="flex items-center gap-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                        >
                            <Plus size={13} /> Tambah Baris
                        </button>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-gray-100/80 border-b border-gray-200 text-gray-700 font-bold">
                                    <th className="p-2.5 w-28 text-center">Bentuk Asesmen</th>
                                    <th className="p-2.5 w-24 text-center">CLO</th>
                                    <th className="p-2.5 w-20 text-center">No. Soal</th>
                                    <th className="p-2.5 w-48">Catatan Evaluasi</th>
                                    <th className="p-2.5">Rekomendasi Terhadap CLO</th>
                                    <th className="p-2.5 w-12 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {formData.evaluasi.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/60 transition">
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={row.bentuk_asesmen}
                                                onChange={(e) =>
                                                    handleEvaluasiChange(idx, 'bentuk_asesmen', e.target.value)
                                                }
                                                placeholder="UTS/UAS/QUIZ"
                                                className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-center font-semibold text-gray-800 uppercase focus:border-blue-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={row.clo}
                                                onChange={(e) => handleEvaluasiChange(idx, 'clo', e.target.value)}
                                                placeholder="CLO1"
                                                className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-center font-bold text-blue-700 font-mono focus:border-blue-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={row.no_soal}
                                                onChange={(e) => handleEvaluasiChange(idx, 'no_soal', e.target.value)}
                                                placeholder="1"
                                                className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-center font-mono focus:border-blue-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={row.catatan_evaluasi}
                                                onChange={(e) =>
                                                    handleEvaluasiChange(idx, 'catatan_evaluasi', e.target.value)
                                                }
                                                placeholder="Sesuai / Belum sesuai"
                                                className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                value={row.rekomendasi}
                                                onChange={(e) =>
                                                    handleEvaluasiChange(idx, 'rekomendasi', e.target.value)
                                                }
                                                placeholder="-"
                                                className="w-full rounded border border-gray-200 px-2 py-1 text-xs text-gray-800 focus:border-blue-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(idx)}
                                                title="Hapus baris"
                                                className="p-1 text-gray-400 hover:text-red-600 rounded transition cursor-pointer"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 4: Tanggal & Penandatangan */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3.5 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-[var(--color-primary)]" />
                        5. Tanggal & Pejabat Penandatangan
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Kota & Tanggal</label>
                            <div className="flex gap-1.5">
                                <input
                                    type="text"
                                    value={formData.kota}
                                    onChange={(e) => setFormData((p) => ({ ...p, kota: e.target.value }))}
                                    placeholder="Kota"
                                    className="w-24 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={formData.tanggal}
                                    onChange={(e) => setFormData((p) => ({ ...p, tanggal: e.target.value }))}
                                    placeholder="18 Agustus 2026"
                                    className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Evaluator Soal</label>
                            <input
                                type="text"
                                value={formData.ttd.evaluator_soal}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        ttd: { ...p.ttd, evaluator_soal: e.target.value },
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Dosen Koordinator</label>
                            <input
                                type="text"
                                value={formData.ttd.dosen_koordinator}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        ttd: { ...p.ttd, dosen_koordinator: e.target.value },
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Ka. Prodi</label>
                            <input
                                type="text"
                                value={formData.ttd.ka_prodi}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        ttd: { ...p.ttd, ka_prodi: e.target.value },
                                    }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
