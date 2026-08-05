import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, BookMarked, Layers, GraduationCap, Edit2, Trash2, Plus, X, Check, Loader2, Settings2,
} from 'lucide-react';
import api from '@/shared/lib/api';
import { useToast } from '@/shared/hooks/useToast';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';

/* ── Types ─────────────────────────────────────────────────── */

interface Course {
    id: number;
    kode_mk: string;
    nama_mk: string;
    semester: number | null;
    sks: number | null;
    kategori: string | null;
    clo_count: number;
}

interface Clo {
    id: number;
    kode: string;
    deskripsi: string;
    mata_kuliah_id?: number | null;
}

interface Plo {
    id: number;
    kode: string;
    deskripsi: string;
}

/* ── Helper: Badge ──────────────────────────────────────────── */

function InfoBadge({ label, value, color = 'gray' }: { label: string; value: string | number; color?: string }) {
    const colors: Record<string, string> = {
        gray: 'bg-gray-50 border-gray-200 text-gray-700',
        primary: 'bg-[var(--color-primary-light)] border-[var(--color-primary-light)] text-[var(--color-primary)]',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        violet: 'bg-violet-50 border-violet-200 text-violet-700',
    };
    return (
        <div className={`flex flex-col items-center justify-center rounded-xl border px-6 py-4 text-center ${colors[color]}`}>
            <span className="text-xs font-medium opacity-70 mb-1">{label}</span>
            <span className="text-lg font-bold">{value}</span>
        </div>
    );
}

/* ── CLO Form Modal ──────────────────────────────────────────── */

interface CloModalProps {
    courseId: number;
    editClo?: Clo | null;
    plos: Plo[];
    onClose: () => void;
    onSaved: () => void;
}

function CloModal({ courseId, editClo, plos, onClose, onSaved }: CloModalProps) {
    const { toast } = useToast();
    const [kode, setKode] = useState(editClo?.kode ?? '');
    const [deskripsi, setDeskripsi] = useState(editClo?.deskripsi ?? '');
    const [ploId, setPloId] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kode.trim()) { toast.error('Kode CLO wajib diisi.'); return; }
        if (!deskripsi.trim()) { toast.error('Deskripsi CLO wajib diisi.'); return; }
        if (!ploId && !editClo) { toast.error('PLO wajib dipilih.'); return; }

        setSaving(true);
        try {
            if (editClo) {
                await api.put(`/clo/${editClo.id}`, {
                    kode,
                    deskripsi,
                    mata_kuliah_id: courseId,
                    plo_id: ploId || undefined,
                });
                toast.success('CLO berhasil diperbarui.');
            } else {
                await api.post('/clo', {
                    kode,
                    deskripsi,
                    mata_kuliah_id: courseId,
                    plo_id: ploId,
                });
                toast.success('CLO berhasil ditambahkan.');
            }
            onSaved();
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.message || (editClo ? 'Gagal memperbarui CLO.' : 'Gagal menambah CLO.');
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h3 className="font-bold text-gray-800 text-base">{editClo ? 'Edit CLO' : 'Tambah CLO'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Capaian Pembelajaran Mata Kuliah</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    {/* Kode */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kode CLO <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={kode}
                            onChange={(e) => setKode(e.target.value)}
                            placeholder="mis. CLO-01"
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                        />
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deskripsi CLO <span className="text-red-500">*</span></label>
                        <textarea
                            rows={4}
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                            placeholder="Mahasiswa mampu..."
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 resize-none focus:border-[var(--color-primary)] focus:outline-none"
                        />
                    </div>

                    {/* PLO */}
                    {!editClo && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">PLO Terkait <span className="text-red-500">*</span></label>
                            <select
                                value={ploId}
                                onChange={(e) => setPloId(e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                <option value="">-- Pilih PLO --</option>
                                {plos.map((p) => (
                                    <option key={p.id} value={p.id}>{p.kode} — {p.deskripsi.slice(0, 60)}{p.deskripsi.length > 60 ? '…' : ''}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] transition disabled:opacity-60"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            {editClo ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Delete Confirm Modal ────────────────────────────────────── */

function DeleteConfirm({ clo, onClose, onDeleted }: { clo: Clo; onClose: () => void; onDeleted: () => void }) {
    const { toast } = useToast();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/clo/${clo.id}`);
            toast.success('CLO berhasil dihapus.');
            onDeleted();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menghapus CLO.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                        <Trash2 size={16} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Hapus CLO?</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            CLO <span className="font-semibold text-gray-700">{clo.kode}</span> akan dihapus secara permanen. Tindakan ini tidak bisa dibatalkan.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                        Batal
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition disabled:opacity-60"
                    >
                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main Detail Page ────────────────────────────────────────── */

export function MatkulDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [showModal, setShowModal] = useState(false);
    const [editClo, setEditClo] = useState<Clo | null>(null);
    const [deleteClo, setDeleteClo] = useState<Clo | null>(null);

    /* Fetch course detail */
    const { data: course, isLoading: loadingCourse } = useQuery<Course>({
        queryKey: ['course', id],
        queryFn: async () => {
            const res = await api.get(`/courses/${id}`);
            return res.data.data;
        },
        enabled: !!id,
    });

    /* Fetch CLOs for this course */
    const { data: clos = [], isLoading: loadingClo, refetch: refetchClo } = useQuery<Clo[]>({
        queryKey: ['clo', 'by-course', id],
        queryFn: async () => {
            const res = await api.get('/clo', { params: { dropdown: 1, mata_kuliah_id: id } });
            return res.data.data;
        },
        enabled: !!id,
    });

    /* Fetch PLOs (for add CLO form) */
    const { data: plos = [] } = useQuery<Plo[]>({
        queryKey: ['plo-all'],
        queryFn: async () => {
            const res = await api.get('/plo', { params: { per_page: 200 } });
            return res.data.data;
        },
    });

    const handleSaved = () => {
        refetchClo();
        queryClient.invalidateQueries({ queryKey: ['course', id] });
        queryClient.invalidateQueries({ queryKey: ['courses'] });
    };

    if (loadingCourse) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader title="Detail Mata Kuliah" breadcrumb={[{ label: 'Mata Kuliah', href: '/matkul' }, { label: 'Detail' }]} />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
                    <div className="animate-pulse h-24 bg-gray-100 rounded-lg" />
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader title="Detail Mata Kuliah" breadcrumb={[{ label: 'Mata Kuliah', href: '/matkul' }, { label: 'Detail' }]} />
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-12 text-center text-gray-400">
                    Mata kuliah tidak ditemukan.
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title={course.nama_mk}
                    description={`Detail dan daftar Capaian Pembelajaran Mata Kuliah (CLO)`}
                    breadcrumb={[
                        { label: 'Mata Kuliah', href: '/matkul' },
                        { label: 'Detail' },
                    ]}
                />
                <div className="flex items-center gap-2 mt-1 shrink-0">
                    <button
                        onClick={() => navigate(`/matkul/${id}/kelola-clo`)}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                    >
                        <Settings2 size={15} />
                        Kelola CLO
                    </button>
                    <button
                        onClick={() => navigate('/matkul')}
                        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition"
                    >
                        <ArrowLeft size={15} />
                        Kembali
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
                        <BookMarked size={18} className="text-[var(--color-primary)]" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Kode Mata Kuliah</p>
                        <p className="font-bold text-gray-800 font-mono">{course.kode_mk}</p>
                    </div>
                    <div className="ml-6">
                        <p className="text-xs text-gray-400 font-medium">Nama Mata Kuliah</p>
                        <p className="font-bold text-gray-800">{course.nama_mk}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
                    <InfoBadge label="Semester" value={course.semester ?? '—'} color="gray" />
                    <InfoBadge label="SKS" value={course.sks ?? '—'} color="emerald" />
                    <InfoBadge label="Kategori" value={course.kategori ?? 'wajib'} color="gray" />
                    <InfoBadge label="Jumlah CLO" value={course.clo_count ?? 0} color="primary" />
                </div>
            </div>

            {/* CLO Section */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* CLO Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <GraduationCap size={18} className="text-[var(--color-primary)]" />
                        <div>
                            <h2 className="font-bold text-gray-800 text-sm">Capaian Pembelajaran Mata Kuliah (CLO)</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{clos.length} CLO terdaftar</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setEditClo(null); setShowModal(true); }}
                        className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] shadow-sm transition"
                    >
                        <Plus size={15} />
                        Tambah CLO
                    </button>
                </div>

                {/* CLO List */}
                <div className="divide-y divide-gray-100">
                    {loadingClo && (
                        <div className="p-6">
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    )}

                    {!loadingClo && clos.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Layers size={22} className="text-gray-300" />
                            </div>
                            <p className="text-sm font-semibold text-gray-500">Belum ada CLO</p>
                            <p className="text-xs text-gray-400 mt-1">Klik "Tambah CLO" untuk menambahkan capaian pembelajaran.</p>
                        </div>
                    )}

                    {!loadingClo && clos.map((clo, idx) => (
                        <div
                            key={clo.id}
                            className="flex items-start gap-4 px-6 py-5 hover:bg-gray-50/50 group transition"
                        >
                            {/* Number bubble */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                                {idx + 1}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-gray-600">
                                        {clo.kode}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">{clo.deskripsi}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
                                <button
                                    onClick={() => { setEditClo(clo); setShowModal(true); }}
                                    title="Edit CLO"
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                >
                                    <Edit2 size={13} />
                                </button>
                                <button
                                    onClick={() => setDeleteClo(clo)}
                                    title="Hapus CLO"
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer info */}
                {!loadingClo && clos.length > 0 && (
                    <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-xs text-gray-400">
                            Menampilkan {clos.length} CLO untuk mata kuliah ini.{' '}
                            <button
                                onClick={() => navigate(`/matkul/${id}/kelola-clo`)}
                                className="text-[var(--color-primary)] font-semibold hover:underline"
                            >
                                Kelola relasi CLO →
                            </button>
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showModal && (
                <CloModal
                    courseId={Number(id)}
                    editClo={editClo}
                    plos={plos}
                    onClose={() => { setShowModal(false); setEditClo(null); }}
                    onSaved={handleSaved}
                />
            )}

            {deleteClo && (
                <DeleteConfirm
                    clo={deleteClo}
                    onClose={() => setDeleteClo(null)}
                    onDeleted={handleSaved}
                />
            )}
        </div>
    );
}
