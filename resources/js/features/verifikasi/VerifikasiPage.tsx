import { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Eye, FileText, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { useToast } from '@/shared/hooks/useToast';
import { formatDate } from '@/shared/lib/utils';
import api from '@/shared/lib/api';

import type { Soal } from '@/features/soal/types/soal.types';
import type { Periode } from '@/features/periode/types/periode.types';
import { useTugasSaya, useSubmitVerifikasi } from './hooks/useVerifikasi';
import { VerifikasiModal } from './components/VerifikasiModal';

export function VerifikasiPage() {
    const { toast } = useToast();

    // Filters
    const [search, setSearch] = useState('');
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Modal
    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
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
        page,
        per_page: perPage,
    });

    const submitMutation = useSubmitVerifikasi();

    const handleReset = () => {
        setSearch('');
        const active = periodes.find((p) => p.status === 'aktif');
        if (active) setSelectedPeriodeId(String(active.id));
        setPage(1);
    };

    const handleOpenVerify = (soal: Soal) => {
        setSelectedSoal(soal);
        setVerifyModalOpen(true);
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
                                <th className="px-6 py-4 w-32 text-center">Action</th>
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
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleOpenVerify(r)}
                                                    className="flex items-center gap-1 rounded bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-2.5 py-1.5 text-xs font-semibold shadow-sm transition"
                                                >
                                                    <CheckSquare size={13} /> Verify
                                                </button>
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

            <VerifikasiModal
                open={verifyModalOpen}
                onClose={() => setVerifyModalOpen(false)}
                onSubmit={handleSaveVerification}
                soal={selectedSoal}
                loading={submitMutation.isPending}
            />
        </div>
    );
}
