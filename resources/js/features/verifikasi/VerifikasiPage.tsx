import { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Eye, FileText, Filter } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Modal } from '@/shared/components/ui/Modal';
import { useToast } from '@/shared/hooks/useToast';
import { useAuth } from '@/shared/hooks/useAuth';

import api from '@/shared/lib/api';

import type { Soal } from '@/features/soal/types/soal.types';
import type { Periode } from '@/features/periode/types/periode.types';
import { useTugasSaya, useSubmitVerifikasi } from './hooks/useVerifikasi';
import { VerifikasiModal } from './components/VerifikasiModal';
import { TimelineCard } from '@/features/soal/components/TimelineCard';
import { RevisionHistoryAccordion } from '@/features/soal/components/RevisionHistoryAccordion';

export function VerifikasiPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    // Filters
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modals
    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedSoal, setSelectedSoal] = useState<Soal | null>(null);

    // Load Periodes on mount
    useEffect(() => {
        api.get('/periode', { params: { per_page: 50 } }).then((res) => {
            setPeriodes(res.data.data);
            const active = res.data.data.find((p: any) => p.status === 'aktif');
            if (active) setSelectedPeriodeId(String(active.id));
            else if (res.data.data.length > 0) setSelectedPeriodeId(String(res.data.data[0].id));
        });
    }, []);

    const {
        data: response,
        isLoading,
        refetch,
    } = useTugasSaya({
        periode_id: selectedPeriodeId || undefined,
        status: selectedStatus || undefined,
        page,
        per_page: perPage,
    });

    const submitMutation = useSubmitVerifikasi();

    const handleReset = () => {
        setSelectedStatus('');
        const active = periodes.find((p) => p.status === 'aktif');
        if (active) setSelectedPeriodeId(String(active.id));
        setPage(1);
    };

    const handleOpenVerify = (soal: Soal) => {
        setSelectedSoal(soal);
        setVerifyModalOpen(true);
    };

    const handleOpenDetail = (soal: Soal) => {
        setSelectedSoal(soal);
        setDetailModalOpen(true);
    };

    const handleSaveVerification = async (data: any) => {
        if (!selectedSoal) return;
        try {
            await submitMutation.mutateAsync({
                soalId: selectedSoal.id,
                payload: data,
            });
            toast.success('Hasil verifikasi soal berhasil disimpan.');
            setVerifyModalOpen(false);
            refetch();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menyimpan hasil verifikasi.');
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Tugas Verifikasi Soal Ujian"
                description="Verifikasi kesesuaian soal ujian dosen dengan kurikulum, PLO/CLO, dan template standar."
                breadcrumb={[{ label: 'Verifikasi Soal' }]}
            />

            <FilterBar onReset={handleReset}>
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase">Periode Akademik:</span>
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
                        <option key={p.id} value={p.id}>
                            {p.nama_periode}
                        </option>
                    ))}
                </select>

                <div className="flex items-center gap-2 ml-3">
                    <Filter size={16} className="text-gray-400" />
                    <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
                </div>
                <select
                    value={selectedStatus}
                    onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setPage(1);
                    }}
                    className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                >
                    <option value="">— Semua Status —</option>
                    <option value="pending">Perlu Diverifikasi (Baru & Revisi)</option>
                    <option value="in_review">In Review / Baru</option>
                    <option value="submitted">Submitted</option>
                    <option value="revisi">Revisi</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                </select>
            </FilterBar>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-gray-600">
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                </th>
                                <th className="px-6 py-4 w-16">No</th>
                                <th className="px-6 py-4">Judul Soal / Berkas</th>
                                <th className="px-6 py-4 w-48">Dosen Pengampu</th>
                                <th className="px-6 py-4 w-32">Status Soal</th>
                                <th className="px-6 py-4 w-40">Mata Kuliah</th>
                                <th className="px-6 py-4 w-28">CLO Relasi</th>
                                <th className="px-6 py-4 w-20 text-center">Versi</th>
                                <th className="px-6 py-4 w-36 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading && <SkeletonTable rows={5} cols={9} />}

                            {!isLoading && (response?.data.length ?? 0) > 0 &&
                                response?.data.map((r, idx) => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {(page - 1) * perPage + idx + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800 line-clamp-1">{r.judul_soal}</span>
                                                <a
                                                    href={r.file_url || `/storage/${r.file_soal}`}
                                                    download
                                                    className="mt-0.5 text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                                                >
                                                    <FileText size={12} /> Unduh Berkas
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {r.dosen?.nama_lengkap || r.dosen_name || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={r.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-800">{r.mata_kuliah?.kode_mk}</span>
                                                <span className="text-xs text-gray-400 truncate max-w-[120px]">{r.mata_kuliah?.nama_mk}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                                                {r.clo?.kode ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">{r.versi}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleOpenDetail(r)}
                                                    title="Lihat Riwayat & Detail"
                                                    className="flex items-center gap-1 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-2 py-1.5 text-xs font-medium shadow-xs transition cursor-pointer"
                                                >
                                                    <Eye size={13} /> Riwayat
                                                </button>
                                                {r.dosen_id === user?.id && !user?.is_super_admin ? (
                                                    <span
                                                        title="Anda tidak dapat memverifikasi soal yang Anda upload sendiri"
                                                        className="inline-flex items-center gap-1 rounded bg-gray-100 border border-gray-200 text-gray-400 px-2.5 py-1.5 text-xs font-medium cursor-not-allowed"
                                                    >
                                                        Soal Anda
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenVerify(r)}
                                                        title="Proses Verifikasi"
                                                        className="flex items-center gap-1 rounded bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition cursor-pointer"
                                                    >
                                                        <CheckSquare size={13} /> Verify
                                                    </button>
                                                )}
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
                            onPerPageChange={(pp) => {
                                setPerPage(pp);
                                setPage(1);
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Verifikasi Modal */}
            <VerifikasiModal
                open={verifyModalOpen}
                onClose={() => setVerifyModalOpen(false)}
                onSubmit={handleSaveVerification}
                soal={selectedSoal}
                loading={submitMutation.isPending}
            />

            {/* Detail & Riwayat Modal */}
            <Modal
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={selectedSoal ? `Riwayat & Detail Verifikasi — ${selectedSoal.judul_soal}` : 'Riwayat Verifikasi'}
                size="xl"
            >
                {selectedSoal && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase">Informasi Soal</h4>
                                <p className="mt-1 text-sm font-bold text-gray-900">{selectedSoal.judul_soal}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Dosen: <strong className="text-gray-700">{selectedSoal.dosen?.nama_lengkap || selectedSoal.dosen_name || '—'}</strong>
                                </p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase">Mata Kuliah & Status</h4>
                                <p className="mt-1 text-xs text-gray-700">
                                    <strong>MK:</strong> {selectedSoal.mata_kuliah?.kode_mk} - {selectedSoal.mata_kuliah?.nama_mk}
                                </p>
                                <div className="mt-1.5 flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Status:</span>
                                    <StatusBadge status={selectedSoal.status} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <TimelineCard soalId={selectedSoal.id} />
                            <RevisionHistoryAccordion soalId={selectedSoal.id} />
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

