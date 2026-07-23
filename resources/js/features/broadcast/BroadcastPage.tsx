import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Megaphone,
    Plus,
    Send,
    Globe2,
    Building2,
    Clock,
    CheckCircle2,
    Eye,
    X,
} from 'lucide-react';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { Modal } from '@/shared/components/ui/Modal';
import { useToast } from '@/shared/hooks/useToast';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatDate } from '@/shared/lib/utils';

import {
    useBroadcastList,
    useBroadcastFeed,
    useCreateBroadcast,
    usePublishBroadcast,
} from './hooks/useBroadcast';
import type { Broadcast, CreateBroadcastPayload, TargetBroadcast } from './types/broadcast.types';
import api from '@/shared/lib/api';

/* ── Schema ─────────────────────────────────────────────────── */

const schema = z
    .object({
        judul: z.string().min(3, 'Judul minimal 3 karakter').max(200, 'Judul maksimal 200 karakter'),
        isi: z.string().min(10, 'Isi pengumuman minimal 10 karakter'),
        target: z.enum(['semua', 'prodi_tertentu']),
        prodi_id: z.coerce.number().nullable().optional(),
        periode_id: z.coerce.number().nullable().optional(),
    })
    .refine(
        (d) => d.target !== 'prodi_tertentu' || (d.prodi_id != null && d.prodi_id > 0),
        { message: 'Program studi wajib dipilih untuk target prodi tertentu.', path: ['prodi_id'] },
    );

type FormValues = z.infer<typeof schema>;

/* ── Target badge helper ────────────────────────────────────── */
function TargetBadge({ target }: { target: string }) {
    if (target === 'semua') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                <Globe2 size={11} /> Semua Dosen
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
            <Building2 size={11} /> Prodi Tertentu
        </span>
    );
}

/* ── Status badge ───────────────────────────────────────────── */
function PublishBadge({ publishedAt }: { publishedAt: string | null }) {
    if (!publishedAt) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
                <Clock size={11} /> Draf
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle2 size={11} /> Terbit
        </span>
    );
}

/* ── Main Component ─────────────────────────────────────────── */
export function BroadcastPage() {
    const { toast } = useToast();
    const { role } = useAuth();
    const isSuperAdmin = role === 'coordinator';

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const [createOpen, setCreateOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Broadcast | null>(null);
    const [confirmPublishId, setConfirmPublishId] = useState<number | null>(null);

    const [periodes, setPeriodes] = useState<{ id: number; nama_periode: string }[]>([]);
    const [prodis, setProdis] = useState<{ id: number; nama_prodi: string }[]>([]);

    // Load helpers
    useEffect(() => {
        api.get('/periode', { params: { per_page: 50 } }).then((r) => setPeriodes(r.data.data || []));
        api.get('/program-studi').then((r) => setProdis(r.data.data || []));
    }, []);

    // Data
    const listQuery = isSuperAdmin
        ? // eslint-disable-next-line react-hooks/rules-of-hooks
          useBroadcastList({ page, per_page: perPage })
        : // eslint-disable-next-line react-hooks/rules-of-hooks
          useBroadcastFeed({ page, per_page: perPage });

    const createMut = useCreateBroadcast();
    const publishMut = usePublishBroadcast();

    /* Form */
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { target: 'semua', prodi_id: null, periode_id: null },
    });
    const targetVal = watch('target');

    const onSubmit = async (data: FormValues) => {
        try {
            const payload: CreateBroadcastPayload = {
                judul: data.judul,
                isi: data.isi,
                target: data.target as TargetBroadcast,
                prodi_id: data.target === 'prodi_tertentu' ? data.prodi_id : null,
                periode_id: data.periode_id ?? null,
            };
            await createMut.mutateAsync(payload);
            toast.success('Draf broadcast berhasil dibuat!');
            reset();
            setCreateOpen(false);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal membuat broadcast.');
        }
    };

    const handlePublish = async () => {
        if (!confirmPublishId) return;
        try {
            await publishMut.mutateAsync(confirmPublishId);
            toast.success('Broadcast berhasil diterbitkan dan notifikasi terkirim!');
            setConfirmPublishId(null);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menerbitkan broadcast.');
        }
    };

    const rows = listQuery.data?.data ?? [];
    const meta = listQuery.data?.meta;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Broadcast & Pengumuman"
                description={
                    isSuperAdmin
                        ? 'Kelola dan terbitkan pengumuman kepada seluruh dosen atau program studi tertentu.'
                        : 'Lihat pengumuman terbaru dari koordinator dan admin.'
                }
                breadcrumb={[{ label: 'Broadcast' }]}
                action={
                    isSuperAdmin ? (
                        <button
                            onClick={() => { reset(); setCreateOpen(true); }}
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)]"
                        >
                            <Plus size={16} /> Buat Pengumuman
                        </button>
                    ) : null
                }
            />

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-gray-600">
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700">
                            <tr>
                                <th className="px-6 py-4 w-16">No</th>
                                <th className="px-6 py-4">Judul Pengumuman</th>
                                <th className="px-6 py-4 w-48">Target</th>
                                <th className="px-6 py-4 w-40">Periode</th>
                                <th className="px-6 py-4 w-36">Status</th>
                                <th className="px-6 py-4 w-44">Tanggal Terbit</th>
                                <th className="px-6 py-4 w-40 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {listQuery.isLoading && <SkeletonTable rows={5} cols={7} />}
                            {!listQuery.isLoading && rows.length > 0 &&
                                rows.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {(page - 1) * perPage + idx + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-900 leading-tight">{item.judul}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.isi}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <TargetBadge target={item.target} />
                                                {item.prodi && (
                                                    <span className="text-xs text-gray-400">{item.prodi.nama_prodi}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-xs">
                                            {item.periode?.nama_periode ?? '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <PublishBadge publishedAt={item.published_at} />
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {item.published_at
                                                ? formatDate(item.published_at)
                                                : item.created_at
                                                ? formatDate(item.created_at)
                                                : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => { setSelectedItem(item); setDetailOpen(true); }}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                {isSuperAdmin && !item.published_at && (
                                                    <button
                                                        onClick={() => setConfirmPublishId(item.id)}
                                                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition"
                                                        title="Terbitkan"
                                                    >
                                                        <Send size={12} /> Publish
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {!listQuery.isLoading && rows.length === 0 && <EmptyState />}

                {meta && (
                    <div className="border-t border-gray-200 px-6 py-4">
                        <Pagination
                            meta={meta}
                            onPageChange={(p) => setPage(p)}
                            onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }}
                        />
                    </div>
                )}
            </div>

            {/* ── Create Modal ─────────────────────────────────────── */}
            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Buat Pengumuman Baru"
                size="lg"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {/* Judul */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Judul Pengumuman <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register('judul')}
                            type="text"
                            placeholder="Contoh: Pengumpulan Soal UTS Semester Genap 2025"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                        />
                        {errors.judul && (
                            <p className="mt-1 text-xs text-red-500">{errors.judul.message}</p>
                        )}
                    </div>

                    {/* Target */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Target Penerima <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('target')}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                <option value="semua">Semua Dosen</option>
                                <option value="prodi_tertentu">Program Studi Tertentu</option>
                            </select>
                        </div>

                        {/* Prodi (conditional) */}
                        {targetVal === 'prodi_tertentu' && (
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Program Studi <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('prodi_id')}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                                >
                                    <option value="">— Pilih Prodi —</option>
                                    {prodis.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nama_prodi}</option>
                                    ))}
                                </select>
                                {errors.prodi_id && (
                                    <p className="mt-1 text-xs text-red-500">{errors.prodi_id.message}</p>
                                )}
                            </div>
                        )}

                        {/* Periode */}
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Periode (Opsional)</label>
                            <select
                                {...register('periode_id')}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                <option value="">— Tidak Terkait Periode —</option>
                                {periodes.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nama_periode}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Isi */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Isi Pengumuman <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register('isi')}
                            rows={6}
                            placeholder="Tulis isi pengumuman di sini..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                        />
                        {errors.isi && (
                            <p className="mt-1 text-xs text-red-500">{errors.isi.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setCreateOpen(false)}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={createMut.isPending}
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
                        >
                            {createMut.isPending ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Megaphone size={15} />
                            )}
                            Simpan Draf
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Detail Modal ─────────────────────────────────────── */}
            <Modal
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                title="Detail Pengumuman"
                size="lg"
            >
                {selectedItem && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-gray-900">{selectedItem.judul}</h3>
                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                    <TargetBadge target={selectedItem.target} />
                                    <PublishBadge publishedAt={selectedItem.published_at} />
                                    {selectedItem.prodi && (
                                        <span className="text-xs text-gray-500">• {selectedItem.prodi.nama_prodi}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm border-y border-gray-100 py-3">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Pembuat</p>
                                <p className="text-gray-700">{selectedItem.creator_name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Periode</p>
                                <p className="text-gray-700">{selectedItem.periode?.nama_periode ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Tanggal Dibuat</p>
                                <p className="text-gray-700">{formatDate(selectedItem.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Tanggal Terbit</p>
                                <p className="text-gray-700">
                                    {selectedItem.published_at ? formatDate(selectedItem.published_at) : 'Belum diterbitkan'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Isi Pengumuman</p>
                            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {selectedItem.isi}
                            </div>
                        </div>

                        {isSuperAdmin && !selectedItem.published_at && (
                            <div className="border-t border-gray-100 pt-4">
                                <button
                                    onClick={() => {
                                        setDetailOpen(false);
                                        setConfirmPublishId(selectedItem.id);
                                    }}
                                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                                >
                                    <Send size={15} /> Terbitkan Pengumuman
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── Confirm Publish Modal ────────────────────────────── */}
            <Modal
                open={confirmPublishId !== null}
                onClose={() => setConfirmPublishId(null)}
                title="Konfirmasi Publikasi"
                size="sm"
            >
                <div className="flex flex-col gap-4">
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                        Setelah diterbitkan, pengumuman ini tidak dapat ditarik kembali dan notifikasi akan dikirim ke semua target penerima.
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => setConfirmPublishId(null)}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={publishMut.isPending}
                            className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            {publishMut.isPending ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Send size={15} />
                            )}
                            Ya, Terbitkan
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
