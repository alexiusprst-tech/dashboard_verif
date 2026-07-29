import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileDown, Calendar, Search, RefreshCw, BarChart } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useToast } from '@/shared/hooks/useToast';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FilterBar } from '@/shared/components/ui/FilterBar';
import { SearchBar } from '@/shared/components/ui/SearchBar';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonTable } from '@/shared/components/ui/Skeleton';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { formatDate } from '@/shared/lib/utils';
import api from '@/shared/lib/api';

import type { Periode } from '@/features/periode/types/periode.types';

/* ── Types ─────────────────────────────────────────────────── */

interface ReportItem {
    id: number;
    judul: string;
    status: string;
    dosen_nama: string;
    dosen_kode: string;
    mata_kuliah_nama: string;
    mata_kuliah_kode: string;
    kategori_nama: string;
    updated_at: string;
}

export function LaporanPage() {
    const { toast } = useToast();
    // Filters & Pagination
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [exporting, setExporting] = useState(false);

    // Fetch Periodes on mount
    useEffect(() => {
        api.get('/periode', { params: { per_page: 50 } }).then((res) => {
            setPeriodes(res.data.data || []);
            const active = res.data.data.find((p: any) => p.status === 'aktif');
            if (active) setSelectedPeriodeId(String(active.id));
            else if (res.data.data.length > 0) setSelectedPeriodeId(String(res.data.data[0].id));
        });
    }, []);

    // Main Report Query
    const {
        data: reportResponse,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ['report-list', selectedPeriodeId, selectedStatus, search, page, perPage],
        queryFn: async () => {
            const params: Record<string, any> = {
                page,
                per_page: perPage,
            };
            if (selectedPeriodeId) params.periode_id = selectedPeriodeId;
            if (selectedStatus) params.status = selectedStatus;
            if (search) params.search = search; // optional search on backend if supported

            const res = await api.get('/soal', { params });
            return {
                data: (res.data.data as ReportItem[]) || [],
                meta: res.data.meta,
            };
        },
        enabled: !!selectedPeriodeId,
    });

    const handleReset = () => {
        const active = periodes.find((p) => p.status === 'aktif');
        setSelectedPeriodeId(active ? String(active.id) : '');
        setSelectedStatus('');
        setSearch('');
        setPage(1);
    };

    // Export to PDF function using jspdf library
    const handleExportPdf = async () => {
        if (!selectedPeriodeId) return;
        setExporting(true);
        try {
            // Fetch ALL matching items (per_page: 9999) for report
            const params: Record<string, any> = {
                per_page: 9999,
                periode_id: selectedPeriodeId,
            };
            if (selectedStatus) params.status = selectedStatus;

            const res = await api.get('/soal', { params });
            const allItems = (res.data.data as ReportItem[]) || [];

            if (allItems.length === 0) {
                toast.error('Tidak ada data untuk diexport.');
                setExporting(false);
                return;
            }

            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape A4
            doc.setFontSize(16);
            const selectedPeriodeObj = periodes.find((p) => String(p.id) === selectedPeriodeId);
            doc.text(`Laporan Verifikasi Soal Ujian - ${selectedPeriodeObj?.nama_periode || ''}`, 14, 15);
            
            doc.setFontSize(10);
            let y = 30;
            // Headers
            doc.text("No", 14, y);
            doc.text("Judul Soal", 25, y);
            doc.text("Dosen Pengampu", 100, y);
            doc.text("Mata Kuliah", 160, y);
            doc.text("Kategori", 220, y);
            doc.text("Status", 245, y);
            doc.text("Terakhir Diupdate", 265, y);
            doc.line(14, y + 2, 285, y + 2);
            y += 10;

            allItems.forEach((item, idx) => {
                if (y > 185) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(String(idx + 1), 14, y);
                doc.text(doc.splitTextToSize(item.judul, 70), 25, y);
                doc.text(doc.splitTextToSize(item.dosen_nama, 55), 100, y);
                doc.text(doc.splitTextToSize(item.mata_kuliah_nama, 55), 160, y);
                doc.text(item.kategori_nama || '-', 220, y);
                doc.text(item.status.toUpperCase(), 245, y);
                doc.text(formatDate(item.updated_at), 265, y);
                y += 15;
            });

            const blobUrl = doc.output('bloburl');
            window.open(blobUrl, '_blank');
            toast.success('Laporan PDF berhasil digenerate untuk preview.');
        } catch (error) {
            console.error('Gagal mengeksport laporan PDF:', error);
            toast.error('Terjadi kesalahan saat mengeksport data.');
        } finally {
            setExporting(false);
        }
    };

    const rows = reportResponse?.data ?? [];
    const meta = reportResponse?.meta;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Laporan & Rekapitulasi"
                description="Unduh rekapitulasi progres verifikasi soal ujian dan progress kelengkapan berkas akademik."
                breadcrumb={[
                    { label: 'Monitoring', href: '/monitoring' },
                    { label: 'Laporan' }
                ]}
                action={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => refetch()}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
                        >
                            <RefreshCw size={15} /> Refresh
                        </button>
                        <button
                            onClick={handleExportPdf}
                            disabled={exporting || rows.length === 0}
                            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileDown size={15} />
                            {exporting ? 'Mengekspor...' : 'Export PDF'}
                        </button>
                    </div>
                }
            />

            {/* Filters */}
            <FilterBar onReset={handleReset}>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Periode:</span>
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
                    </div>

                    <div className="flex items-center gap-2">
                        <BarChart size={16} className="text-gray-400" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                        >
                            <option value="">Semua Status</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="in_review">Dalam Review</option>
                            <option value="approved">Disetujui</option>
                            <option value="revisi">Perlu Revisi</option>
                            <option value="rejected">Ditolak</option>
                        </select>
                    </div>

                    <SearchBar
                        value={search}
                        onChange={(val) => {
                            setSearch(val);
                            setPage(1);
                        }}
                        placeholder="Cari soal..."
                        className="w-full sm:w-64"
                    />
                </div>
            </FilterBar>

            {/* Table */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-gray-600">
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700">
                            <tr>
                                <th className="px-6 py-4 w-16">No</th>
                                <th className="px-6 py-4">Judul Soal</th>
                                <th className="px-6 py-4">Dosen Pengampu</th>
                                <th className="px-6 py-4">Mata Kuliah</th>
                                <th className="px-6 py-4 w-32">Kategori</th>
                                <th className="px-6 py-4 w-36">Status</th>
                                <th className="px-6 py-4 w-44">Terakhir Diupdate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading && <SkeletonTable rows={5} cols={7} />}

                            {!isLoading && rows.length > 0 &&
                                rows.map((r, idx) => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {(page - 1) * perPage + idx + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-800 line-clamp-1">{r.judul}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-700">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{r.dosen_nama}</span>
                                                <span className="text-[10px] text-gray-400 font-semibold">NIDN: {r.dosen_code || r.dosen_kode || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            <div className="flex flex-col">
                                                <span>{r.mata_kuliah_nama}</span>
                                                <span className="text-[10px] text-gray-400">{r.mata_kuliah_kode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {r.kategori_nama}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={r.status as any} />
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {formatDate(r.updated_at)}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {!isLoading && rows.length === 0 && (
                    <EmptyState isSearchEmpty={!!search} />
                )}

                {meta && (
                    <div className="border-t border-gray-200 px-6 py-4">
                        <Pagination
                            meta={meta}
                            onPageChange={(p) => setPage(p)}
                            onPerPageChange={(pp) => {
                                setPerPage(pp);
                                setPage(1);
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
