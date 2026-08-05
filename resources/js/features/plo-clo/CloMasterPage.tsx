import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Search, Edit2, Trash2, X, Check, Loader2, GraduationCap, BookMarked, RotateCcw
} from 'lucide-react';
import api from '@/shared/lib/api';
import { useToast } from '@/shared/hooks/useToast';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';

interface CloItem {
    id: number;
    kode: string;
    deskripsi: string;
    plo_id?: number | null;
    mata_kuliah_id?: number | null;
    mata_kuliah_nama?: string | null;
    mata_kuliah?: { id: number; nama_mk: string; kode_mk: string } | null;
}

interface PloItem {
    id: number;
    kode: string;
    deskripsi: string;
}

interface CourseItem {
    id: number;
    kode_mk: string;
    nama_mk: string;
}

/* ── Modal Form CLO ──────────────────────────────────────────── */

interface CloModalProps {
    editItem?: CloItem | null;
    plos: PloItem[];
    courses: CourseItem[];
    onClose: () => void;
    onSaved: () => void;
}

function CloFormModal({ editItem, plos, courses, onClose, onSaved }: CloModalProps) {
    const { toast } = useToast();
    const [kode, setKode]               = useState(editItem?.kode ?? '');
    const [deskripsi, setDeskripsi]     = useState(editItem?.deskripsi ?? '');
    const [ploId, setPloId]             = useState<string>(editItem?.plo_id ? String(editItem.plo_id) : '');
    const [mataKuliahId, setMataKuliahId] = useState<string>(editItem?.mata_kuliah_id ? String(editItem.mata_kuliah_id) : '');
    const [saving, setSaving]           = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!kode.trim()) { toast.error('Kode CLO wajib diisi.'); return; }
        if (!deskripsi.trim()) { toast.error('Deskripsi CLO wajib diisi.'); return; }
        if (!ploId) { toast.error('PLO terkait wajib dipilih.'); return; }

        setSaving(true);
        try {
            const payload = {
                kode,
                deskripsi,
                plo_id: Number(ploId),
                mata_kuliah_id: mataKuliahId ? Number(mataKuliahId) : null,
            };

            if (editItem) {
                await api.put(`/clo/${editItem.id}`, payload);
                toast.success('CLO berhasil diperbarui.');
            } else {
                await api.post('/clo', payload);
                toast.success('CLO berhasil ditambahkan.');
            }
            onSaved();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan CLO.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h3 className="font-bold text-gray-800 text-base">{editItem ? 'Edit CLO' : 'Tambah CLO Baru'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Kelola Capaian Pembelajaran Mata Kuliah</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
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

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Deskripsi CLO <span className="text-red-500">*</span></label>
                        <textarea
                            rows={3}
                            value={deskripsi}
                            onChange={(e) => setDeskripsi(e.target.value)}
                            placeholder="Mahasiswa mampu..."
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 resize-none focus:border-[var(--color-primary)] focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">PLO Terkait <span className="text-red-500">*</span></label>
                        <select
                            value={ploId}
                            onChange={(e) => setPloId(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                        >
                            <option value="">-- Pilih PLO --</option>
                            {plos.map((p) => (
                                <option key={p.id} value={p.id}>{p.kode} — {p.deskripsi.slice(0, 50)}…</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mata Kuliah (Opsional)</label>
                        <select
                            value={mataKuliahId}
                            onChange={(e) => setMataKuliahId(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-[var(--color-primary)] focus:outline-none"
                        >
                            <option value="">-- Belum Ditentukan --</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>{c.kode_mk} - {c.nama_mk}</option>
                            ))}
                        </select>
                    </div>

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
                            {editItem ? 'Simpan' : 'Tambah'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Delete Confirm Modal ────────────────────────────────────── */

function DeleteConfirmModal({ item, onClose, onDeleted }: { item: CloItem; onClose: () => void; onDeleted: () => void }) {
    const { toast } = useToast();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/clo/${item.id}`);
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
                            CLO <span className="font-semibold text-gray-700">{item.kode}</span> akan dihapus.
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

/* ── Main Master CLO Page ────────────────────────────────────── */

export function CloMasterPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState<CloItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<CloItem | null>(null);

    /* Fetch CLO List */
    const { data: clos = [], isLoading } = useQuery<CloItem[]>({
        queryKey: ['clo-master-list'],
        queryFn: async () => {
            const res = await api.get('/clo', { params: { per_page: 200 } });
            return res.data.data;
        },
    });

    /* Fetch PLOs */
    const { data: plos = [] } = useQuery<PloItem[]>({
        queryKey: ['plo-list'],
        queryFn: async () => {
            const res = await api.get('/plo', { params: { per_page: 200 } });
            return res.data.data;
        },
    });

    /* Fetch Courses */
    const { data: courses = [] } = useQuery<CourseItem[]>({
        queryKey: ['courses'],
        queryFn: async () => {
            const res = await api.get('/courses');
            return res.data.data;
        },
    });

    const handleSaved = () => {
        queryClient.invalidateQueries({ queryKey: ['clo-master-list'] });
        queryClient.invalidateQueries({ queryKey: ['clo'] });
    };

    const filtered = clos.filter((c) => {
        const q = search.toLowerCase();
        return (
            c.kode.toLowerCase().includes(q) ||
            c.deskripsi.toLowerCase().includes(q) ||
            (c.mata_kuliah?.nama_mk ?? '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title="Master CLO"
                    description="Kelola seluruh daftar Capaian Pembelajaran Mata Kuliah (CLO) Program Studi."
                    breadcrumb={[{ label: 'Master CLO' }]}
                />
                <button
                    onClick={() => { setEditItem(null); setShowModal(true); }}
                    className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] shadow-sm transition shrink-0 mt-1 cursor-pointer"
                >
                    <Plus size={15} />
                    Tambah CLO
                </button>
            </div>

            {/* Filter Bar */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                    <Search size={16} className="shrink-0 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari kode CLO, deskripsi, atau mata kuliah…"
                        className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-none ring-0"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                            <X size={14} />
                        </button>
                    )}
                    <span className="ml-2 shrink-0 rounded-full bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                        {filtered.length} CLO
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {isLoading ? (
                    <table className="w-full text-sm">
                        <tbody><SkeletonTable rows={8} cols={5} /></tbody>
                    </table>
                ) : filtered.length === 0 ? (
                    <EmptyState isSearchEmpty={!!search} description={search ? `Tidak ada CLO yang cocok dengan "${search}"` : undefined} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-6 py-3.5 w-12">No</th>
                                    <th className="px-6 py-3.5 w-32">Kode CLO</th>
                                    <th className="px-6 py-3.5">Deskripsi CLO</th>
                                    <th className="px-6 py-3.5 w-60">Mata Kuliah Terkait</th>
                                    <th className="px-6 py-3.5 w-24 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50/60 transition">
                                        <td className="px-6 py-4 text-gray-400 tabular-nums text-xs">{idx + 1}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-md bg-[var(--color-primary-light)] px-2.5 py-0.5 text-xs font-mono font-bold text-[var(--color-primary)]">
                                                {item.kode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800 leading-relaxed">
                                            {item.deskripsi}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.mata_kuliah?.nama_mk || item.mata_kuliah_nama ? (
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                                                    <BookMarked size={13} className="text-gray-400 shrink-0" />
                                                    <span>{item.mata_kuliah?.nama_mk || item.mata_kuliah_nama}</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Belum terhubung MK</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => { setEditItem(item); setShowModal(true); }}
                                                    title="Edit CLO"
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteItem(item)}
                                                    title="Hapus CLO"
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition cursor-pointer"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showModal && (
                <CloFormModal
                    editItem={editItem}
                    plos={plos}
                    courses={courses}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                    onSaved={handleSaved}
                />
            )}

            {deleteItem && (
                <DeleteConfirmModal
                    item={deleteItem}
                    onClose={() => setDeleteItem(null)}
                    onDeleted={handleSaved}
                />
            )}
        </div>
    );
}
