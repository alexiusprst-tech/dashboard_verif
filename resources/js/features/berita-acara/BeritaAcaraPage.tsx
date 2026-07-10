import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, CheckCircle2, AlertCircle, Calendar, Eye, X } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { Modal } from '@/shared/components/ui/Modal';
import { useToast } from '@/shared/hooks/useToast';
import { useAuth } from '@/shared/hooks/useAuth';
import { formatDate } from '@/shared/lib/utils';
import api from '@/shared/lib/api';

import type { BeritaAcara } from './types/beritaAcara.types';
import type { Periode } from '@/features/periode/types/periode.types';
import { useBaList, useGenerateBa } from './hooks/useBeritaAcara';

export function BeritaAcaraPage() {
    const { toast } = useToast();
    const { user } = useAuth();

    // Filters
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // View Detail Modal
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedBa, setSelectedBa] = useState<BeritaAcara | null>(null);

    // Load periodes
    useEffect(() => {
        api.get('/periode', { params: { per_page: 50 } }).then((res) => {
            setPeriodes(res.data.data);
            const active = res.data.data.find((p: any) => p.status === 'aktif');
            if (active) setSelectedPeriodeId(String(active.id));
            else if (res.data.data.length > 0) setSelectedPeriodeId(String(res.data.data[0].id));
        });
    }, []);

    const { data: response, isLoading, refetch } = useBaList({
        periode_id: selectedPeriodeId || undefined,
        page,
        per_page: perPage,
    });

    const generateMutation = useGenerateBa();

    const handleGenerate = async (regenerate = false) => {
        if (!selectedPeriodeId) {
            toast.error('Pilih Periode terlebih dahulu.');
            return;
        }
        try {
            await generateMutation.mutateAsync({
                periode_id: Number(selectedPeriodeId),
                regenerate,
            });
            toast.success(regenerate ? 'Berita Acara berhasil diregenerasi.' : 'Berita Acara berhasil digenerate.');
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal generate Berita Acara.');
        }
    };

    const handleOpenDetail = async (ba: BeritaAcara) => {
        // Load items
        try {
            const res = await api.get(`/berita-acara`, {
                params: { periode_id: ba.periode_id, per_page: 100 }
            });
            // find with items loaded; we may need to refetch individual detail
            setSelectedBa(ba);
            setDetailModalOpen(true);
        } catch {
            setSelectedBa(ba);
            setDetailModalOpen(true);
        }
    };

    const handleReset = () => {
        const active = periodes.find((p) => p.status === 'aktif');
        if (active) setSelectedPeriodeId(String(active.id));
        setPage(1);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Berita Acara Verifikasi"
                description="Generate dan download Berita Acara resmi hasil verifikasi soal ujian per periode pelaksanaan."
                breadcrumb={[{ label: 'Berita Acara' }]}
                action={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleGenerate(false)}
                            disabled={generateMutation.isPending || !selectedPeriodeId}
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
                        >
                            {generateMutation.isPending ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <FileText size={16} />
                            )}
                            Generate BA
                        </button>
                        <button
                            onClick={() => handleGenerate(true)}
                            disabled={generateMutation.isPending || !selectedPeriodeId}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw size={15} />
                            Regenerate
                        </button>
                    </div>
                }
            />

            <FilterBar onReset={handleReset}>
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase">Periode:</span>
                </div>
                <select
                    value={selectedPeriodeId}
                    onChange={(e) => {
                        setSelectedPeriodeId(e.target.value);
                        setPage(1);
                    }}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                >
                    {periodes.map((p) => (
                        <option key={p.id} value={p.id}>{p.nama_periode}</option>
                    ))}
                </select>
            </FilterBar>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-gray-600">
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input type="checkbox" className="rounded border-gray-300 text-[var(--color-primary)]" />
                                </th>
                                <th className="px-6 py-4 w-16">No</th>
                                <th className="px-6 py-4 w-48">Nomor BA</th>
                                <th className="px-6 py-4">Periode</th>
                                <th className="px-6 py-4 w-52">Verifikator / PIC</th>
                                <th className="px-6 py-4 w-48">Tanggal Generate</th>
                                <th className="px-6 py-4 w-16">PDF</th>
                                <th className="px-6 py-4 w-40 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading && <SkeletonTable rows={4} cols={8} />}
                            {!isLoading && (response?.data.length ?? 0) > 0 &&
                                response?.data.map((r, idx) => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input type="checkbox" className="rounded border-gray-300 text-[var(--color-primary)]" />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {(page - 1) * perPage + idx + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 font-mono font-bold text-[var(--color-primary)]">
                                                <FileText size={14} /> {r.nomor_ba}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {r.periode?.nama_periode ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {r.verifier?.name ?? r.verifier?.nama_lengkap ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-xs">
                                            {r.generated_at ? formatDate(r.generated_at) : '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {r.file_pdf ? (
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600">
                                                    <CheckCircle2 size={12} />
                                                </span>
                                            ) : (
                                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                                    <AlertCircle size={12} />
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenDetail(r)}
                                                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                {r.file_url && (
                                                    <a
                                                        href={r.file_url}
                                                        download
                                                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
                                                        title="Download PDF"
                                                    >
                                                        <Download size={15} />
                                                    </a>
                                                )}
                                                <a
                                                    href={`/api/berita-acara/${r.id}/print?type=both&token=${localStorage.getItem('auth_token')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg px-2 py-1 text-xs font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition"
                                                    title="Print"
                                                >
                                                    Print
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {!isLoading && (!response || (response?.data.length ?? 0) === 0) && (
                    <EmptyState />
                )}

                {response?.meta && (
                    <div className="border-t border-gray-200 px-6 py-4">
                        <Pagination
                            meta={response.meta}
                            onPageChange={(p) => setPage(p)}
                            onPerPageChange={(pp) => { setPerPage(pp); setPage(1); }}
                        />
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <Modal
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={`Detail Berita Acara — ${selectedBa?.nomor_ba}`}
                size="lg"
            >
                {selectedBa && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Nomor Berita Acara</p>
                                <p className="font-mono font-bold text-[var(--color-primary)]">{selectedBa.nomor_ba}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Periode</p>
                                <p className="font-semibold text-gray-800">{selectedBa.periode?.nama_periode}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Verifikator PIC</p>
                                <p className="text-gray-700">{selectedBa.verifier?.name ?? selectedBa.verifier?.nama_lengkap}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tanggal Generate</p>
                                <p className="text-gray-700">{selectedBa.generated_at ? formatDate(selectedBa.generated_at) : '—'}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 border-t border-gray-100 pt-4">
                            {selectedBa.file_url && (
                                <a
                                    href={selectedBa.file_url}
                                    download
                                    className="flex items-center gap-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 text-sm font-semibold transition"
                                >
                                    <Download size={15} /> Download PDF
                                </a>
                            )}
                            <a
                                href={`/api/berita-acara/${selectedBa.id}/print?type=ba&token=${localStorage.getItem('auth_token')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] text-white px-3 py-2 text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition"
                            >
                                <FileText size={15} /> Print Berita Acara
                            </a>
                            <a
                                href={`/api/berita-acara/${selectedBa.id}/print?type=both&token=${localStorage.getItem('auth_token')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 rounded-lg border border-gray-300 text-gray-700 px-3 py-2 text-sm font-semibold hover:bg-gray-50 transition"
                            >
                                <FileText size={15} /> Print BA + Soal
                            </a>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
