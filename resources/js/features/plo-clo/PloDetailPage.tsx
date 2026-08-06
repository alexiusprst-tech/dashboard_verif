import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, Edit2, Trash2, Plus, Layers, GraduationCap, Calendar, Clock,
    BookOpen, CheckCircle, AlertCircle, Loader2, BookMarked
} from 'lucide-react';
import api from '@/shared/lib/api';
import { useToast } from '@/shared/hooks/useToast';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { CloModal } from './components/CloModal';
import { PloModal } from './components/PloModal';
import type { Plo, Clo, ProgramStudi, PloFormData, CloFormData } from './types/plo.types';

export function PloDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Modals state
    const [editPloOpen, setEditPloOpen] = useState(false);
    const [cloModalOpen, setCloModalOpen] = useState(false);
    const [editingClo, setEditingClo] = useState<Clo | null>(null);

    // Confirm delete state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'plo' | 'clo'; id: number; title: string } | null>(null);

    // Fetch Program Studi list for PLO edit modal
    const { data: prodiList = [] } = useQuery<ProgramStudi[]>({
        queryKey: ['program-studi'],
        queryFn: async () => {
            const res = await api.get('/program-studi');
            return res.data.data;
        },
    });

    // Fetch PLO Detail
    const { data: plo, isLoading, error, refetch } = useQuery<Plo>({
        queryKey: ['plo-detail', id],
        queryFn: async () => {
            const res = await api.get(`/plo/${id}`);
            return res.data.data;
        },
        enabled: !!id,
    });

    // Fetch CLOs under this PLO
    const { data: clos = [], isLoading: closLoading, refetch: refetchClos } = useQuery<Clo[]>({
        queryKey: ['clo-by-plo', id],
        queryFn: async () => {
            const res = await api.get('/clo', { params: { dropdown: 1, plo_id: id } });
            return res.data.data;
        },
        enabled: !!id,
    });

    // Fetch semua PLO untuk dropdown di CloModal (agar bisa pilih PLO lain jika perlu)
    const { data: allPloList = [] } = useQuery<Plo[]>({
        queryKey: ['plo-dropdown-all', plo?.prodi_id],
        queryFn: async () => {
            const res = await api.get('/plo', { params: { prodi_id: plo?.prodi_id, per_page: 200 } });
            return res.data.data;
        },
        enabled: !!plo?.prodi_id,
        staleTime: 0,
    });

    // Handlers
    const handleUpdatePlo = async (data: PloFormData) => {
        if (!id) return;
        try {
            await api.put(`/plo/${id}`, data);
            toast.success('PLO berhasil diperbarui.');
            setEditPloOpen(false);
            refetch();
            queryClient.invalidateQueries({ queryKey: ['plo-list'] });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal merubah PLO.');
        }
    };

    const handleDeletePlo = async () => {
        if (!id) return;
        try {
            await api.delete(`/plo/${id}`);
            toast.success('PLO berhasil dihapus.');
            navigate('/plo-clo');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menghapus PLO.');
        }
    };

    const handleSaveClo = async (data: CloFormData) => {
        try {
            if (editingClo) {
                await api.put(`/clo/${editingClo.id}`, { ...data, plo_id: Number(id) });
                toast.success('CLO berhasil diperbarui.');
            } else {
                await api.post('/clo', { ...data, plo_id: Number(id) });
                toast.success('CLO berhasil ditambahkan.');
            }
            setCloModalOpen(false);
            setEditingClo(null);
            refetchClos();
            refetch();
            queryClient.invalidateQueries({ queryKey: ['clo-list'] });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan CLO.');
        }
    };

    const handleDeleteClo = async (cloId: number) => {
        try {
            await api.delete(`/clo/${cloId}`);
            toast.success('CLO berhasil dihapus.');
            refetchClos();
            refetch();
            queryClient.invalidateQueries({ queryKey: ['clo-list'] });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Gagal menghapus CLO.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader title="Detail PLO" breadcrumb={[{ label: 'PLO & CLO', href: '/plo-clo' }, { label: 'Detail PLO' }]} />
                <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
                </div>
            </div>
        );
    }

    if (error || !plo) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader title="Detail PLO" breadcrumb={[{ label: 'PLO & CLO', href: '/plo-clo' }, { label: 'Detail PLO' }]} />
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
                    <h3 className="text-base font-bold text-gray-800">PLO Tidak Ditemukan</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-4">Data PLO yang Anda cari mungkin sudah dihapus atau tidak tersedia.</p>
                    <button
                        onClick={() => navigate('/plo-clo')}
                        className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-dark)]"
                    >
                        <ArrowLeft size={14} /> Kembali ke PLO & CLO
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header Navigation */}
            <div className="flex items-start justify-between gap-4">
                <PageHeader
                    title={`Detail ${plo.kode}`}
                    description="Rincian informasi Capaian Pembelajaran Lulusan (PLO) serta daftar CLO terkait."
                    breadcrumb={[
                        { label: 'PLO & CLO', href: '/plo-clo' },
                        { label: plo.kode },
                    ]}
                />
                <button
                    onClick={() => navigate('/plo-clo')}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition shrink-0 mt-1 cursor-pointer"
                >
                    <ArrowLeft size={15} />
                    Kembali
                </button>
            </div>

            {/* PLO Summary Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-5">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[var(--color-primary)] font-bold text-lg shadow-sm">
                            <GraduationCap size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl font-extrabold text-gray-900 font-mono tracking-tight">{plo.kode}</h2>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                    <CheckCircle size={12} />
                                    Aktif
                                </span>
                            </div>
                            <p className="text-xs font-medium text-gray-500">
                                {plo.prodi?.nama_prodi || 'Program Studi Sistem Informasi'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setEditPloOpen(true)}
                            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm cursor-pointer"
                        >
                            <Edit2 size={14} className="text-blue-600" />
                            Edit PLO
                        </button>
                        <button
                            onClick={() => {
                                setDeleteTarget({ type: 'plo', id: plo.id, title: plo.kode });
                                setDeleteConfirmOpen(true);
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition shadow-sm cursor-pointer"
                        >
                            <Trash2 size={14} />
                            Hapus
                        </button>
                    </div>
                </div>

                {/* Deskripsi PLO */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Deskripsi PLO</h4>
                    <p className="text-sm text-gray-700 leading-relaxed font-normal bg-gray-50/70 p-4 rounded-xl border border-gray-100">
                        {plo.deskripsi}
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
                            <Layers size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-medium">Jumlah CLO</p>
                            <p className="text-sm font-bold text-gray-800">{clos.length} CLO Terhubung</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                            <Calendar size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] text-gray-400 font-medium">Dibuat Pada</p>
                            <p className="text-sm font-bold text-gray-800">
                                {plo.created_at ? new Date(plo.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List of CLOs under this PLO */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Daftar CLO pada PLO ini</h3>
                        <p className="text-xs text-gray-500">Seluruh Course Learning Outcomes yang menginduk pada {plo.kode}.</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingClo(null);
                            setCloModalOpen(true);
                        }}
                        className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-dark)] transition shadow-sm cursor-pointer"
                    >
                        <Plus size={15} />
                        Tambah CLO
                    </button>
                </div>

                {closLoading ? (
                    <div className="py-12 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />
                        Memuat daftar CLO...
                    </div>
                ) : clos.length === 0 ? (
                    <EmptyState
                        title="Belum Ada CLO"
                        description={`PLO ${plo.kode} belum memiliki CLO. Klik tombol 'Tambah CLO' untuk membuat CLO baru.`}
                        actionLabel="Tambah CLO Pertama"
                        onAction={() => {
                            setEditingClo(null);
                            setCloModalOpen(true);
                        }}
                    />
                ) : (
                    <div className="space-y-3">
                        {clos.map((c, idx) => (
                            <div
                                key={c.id}
                                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-[var(--color-primary)]/40 hover:shadow-sm transition"
                            >
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] font-mono font-bold text-xs">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <span className="font-bold font-mono text-sm text-gray-900">{c.kode}</span>
                                            {c.courses_count !== undefined && c.courses_count > 0 ? (
                                                <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                                                    {c.courses_count} Mata Kuliah
                                                </span>
                                            ) : (
                                                <span className="rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[11px] font-semibold text-gray-500">
                                                    Belum Dialokasikan
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">{c.deskripsi}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-center shrink-0 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                                    <button
                                        onClick={() => {
                                            setEditingClo(c);
                                            setCloModalOpen(true);
                                        }}
                                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                                    >
                                        <Edit2 size={13} className="text-blue-600" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            setDeleteTarget({ type: 'clo', id: c.id, title: c.kode });
                                            setDeleteConfirmOpen(true);
                                        }}
                                        className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition cursor-pointer"
                                    >
                                        <Trash2 size={13} />
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* PLO Edit Modal */}
            <PloModal
                open={editPloOpen}
                onClose={() => setEditPloOpen(false)}
                onSubmit={handleUpdatePlo}
                plo={plo}
                programStudiList={prodiList}
            />

            {/* CLO Add/Edit Modal */}
            <CloModal
                open={cloModalOpen}
                onClose={() => {
                    setCloModalOpen(false);
                    setEditingClo(null);
                }}
                onSubmit={handleSaveClo}
                clo={editingClo}
                ploList={allPloList.length > 0 ? allPloList : [plo]}
                defaultPloId={plo.id}
            />

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={() => {
                    if (deleteTarget) {
                        if (deleteTarget.type === 'plo') handleDeletePlo();
                        else handleDeleteClo(deleteTarget.id);
                    }
                    setDeleteConfirmOpen(false);
                }}
                title={`Hapus ${deleteTarget?.type === 'plo' ? 'PLO' : 'CLO'}`}
                description={`Apakah Anda yakin ingin menghapus ${deleteTarget?.type === 'plo' ? 'PLO' : 'CLO'} ${deleteTarget?.title}? Tindakan ini tidak dapat dibatalkan.`}
            />
        </div>
    );
}
