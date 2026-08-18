import { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2, AlertCircle, Calendar, Eye, Users } from 'lucide-react';
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
import { useBaList } from './hooks/useBeritaAcara';

interface PicOption {
    id: number;
    nama_lengkap: string;
    kode_dosen: string | null;
}

export function BeritaAcaraPage() {
    const { toast } = useToast();
    const { user } = useAuth();

    // Filters
    const [periodes, setPeriodes] = useState<Periode[]>([]);
    const [selectedPeriodeId, setSelectedPeriodeId] = useState('');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // PIC dropdown (hanya untuk super admin)
    const [picList, setPicList] = useState<PicOption[]>([]);
    const [selectedVerifierId, setSelectedVerifierId] = useState('');

    // View Detail Modal
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedBa, setSelectedBa] = useState<BeritaAcara | null>(null);

    // Load periodes
    useEffect(() => {
        api.get('/periode', { params: { per_page: 50 } })
            .then((res) => {
                const data: Periode[] = res.data?.data ?? [];
                setPeriodes(data);
                const active = data.find((p: any) => p.status === 'aktif');
                if (active) setSelectedPeriodeId(String(active.id));
                else if (data.length > 0) setSelectedPeriodeId(String(data[0].id));
            })
            .catch(() => setPeriodes([]));
    }, []);

    // Load daftar PIC untuk dropdown pilih verifikator (hanya super admin)
    useEffect(() => {
        if (!user?.is_super_admin || !selectedPeriodeId) return;
        api.get('/penugasan', { params: { periode_id: selectedPeriodeId, per_page: 100 } })
            .then((res) => {
                const pics: PicOption[] = (res.data?.data ?? []).map((p: any) => ({
                    id: p.dosen?.id ?? p.user_id,
                    nama_lengkap: p.dosen?.nama_lengkap ?? p.dosen?.name ?? '—',
                    kode_dosen: p.dosen?.kode_dosen ?? null,
                }));
                // Deduplicate
                const unique = pics.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
                setPicList(unique);
                setSelectedVerifierId('');
            })
            .catch(() => setPicList([]));
    }, [user?.is_super_admin, selectedPeriodeId]);

    // Untuk PIC: verifier_id otomatis = diri sendiri
    useEffect(() => {
        if (!user?.is_super_admin && user?.id) {
            setSelectedVerifierId(String(user.id));
        }
    }, [user?.is_super_admin, user?.id]);

    const { data: response, isLoading, refetch } = useBaList({
        periode_id: selectedPeriodeId || undefined,
        verifier_id: selectedVerifierId || undefined,
        page,
        per_page: perPage,
    });

    const handleOpenDetail = async (ba: BeritaAcara) => {
        try {
            await api.get(`/berita-acara`, {
                params: { periode_id: ba.periode_id, per_page: 100 }
            });
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
                description="Daftar dan unduh Berita Acara resmi hasil verifikasi soal ujian per periode pelaksanaan."
                breadcrumb={[{ label: 'Berita Acara' }]}
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
                    {(periodes ?? []).map((p) => (
                        <option key={p.id} value={p.id}>{p.nama_periode}</option>
                    ))}
                </select>

                {/* Dropdown Verifikator — hanya tampil untuk Super Admin */}
                {user?.is_super_admin && (
                    <>
                        <div className="flex items-center gap-2 ml-2">
                            <Users size={16} className="text-gray-400" />
                            <span className="text-xs font-semibold text-gray-500 uppercase">Verifikator:</span>
                        </div>
                        <select
                            value={selectedVerifierId}
                            onChange={(e) => {
                                setSelectedVerifierId(e.target.value);
                                setPage(1);
                            }}
                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-[var(--color-primary)] focus:outline-none"
                        >
                            <option value="">— Semua Verifikator —</option>
                            {(picList ?? []).map((pic) => (
                                <option key={pic.id} value={pic.id}>
                                    {pic.nama_lengkap}{pic.kode_dosen ? ` (${pic.kode_dosen})` : ''}
                                </option>
                            ))}
                        </select>
                    </>
                )}
            </FilterBar>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-gray-600">
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input type="checkbox" className="rounded border-gray-300 text-[var(--color-primary)]" />
                                </th>
                                <th className="px-6 py-4 w-14">No</th>
                                <th className="px-6 py-4 w-44">Nomor BA</th>
                                <th className="px-6 py-4">Soal Ujian & Mata Kuliah</th>
                                <th className="px-6 py-4 w-44">Dosen Pengampu</th>
                                <th className="px-6 py-4 w-44">Verifikator</th>
                                <th className="px-6 py-4 w-36">Tanggal</th>
                                <th className="px-6 py-4 w-28 text-center">Dokumen</th>
                                <th className="px-6 py-4 w-28 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading && <SkeletonTable rows={4} cols={9} />}
                            {!isLoading && (response?.data ?? []).length > 0 &&
                                (response?.data ?? []).map((r, idx) => {
                                    const soal = r.soal ?? r.items?.[0]?.soal;
                                    const mk = soal?.mata_kuliah;
                                    const dosen = soal?.dosen;

                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input type="checkbox" className="rounded border-gray-300 text-[var(--color-primary)]" />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {(page - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-[var(--color-primary)]">
                                                    <FileText size={13} /> {r.nomor_ba}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 line-clamp-1">
                                                    {soal?.judul_soal ?? (r.items?.[0] as any)?.judul_soal ?? 'Berita Acara Evaluasi'}
                                                </div>
                                                <div className="text-xs text-gray-500 font-medium">
                                                    {mk ? `${mk.kode_mk} - ${mk.nama_mk}` : (r.items?.[0] as any)?.mata_kuliah_nama ?? r.periode?.nama_periode}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-gray-700">
                                                {dosen?.nama_lengkap ?? (r.items?.[0] as any)?.dosen_pengampu_nama ?? '—'}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-700">
                                                <div className="font-medium text-gray-900">{r.verifier?.name ?? '—'}</div>
                                                <div className="text-[11px] text-gray-400">Verifikator</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-xs">
                                                {r.generated_at ? formatDate(r.generated_at) : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {r.file_url ? (
                                                        <a
                                                            href={r.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="rounded p-1 bg-red-50 text-red-600 hover:bg-red-100 transition"
                                                            title="Unduh / Lihat PDF"
                                                        >
                                                            <span className="text-[10px] font-bold px-1">PDF</span>
                                                        </a>
                                                    ) : null}
                                                    {r.file_docx_url ? (
                                                        <a
                                                            href={r.file_docx_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="rounded p-1 bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                                            title="Unduh DOCX"
                                                        >
                                                            <span className="text-[10px] font-bold px-1">DOCX</span>
                                                        </a>
                                                    ) : null}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenDetail(r)}
                                                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[var(--color-primary)] transition cursor-pointer"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <a
                                                        href={`/api/berita-acara/${r.id}/print?type=ba&token=${localStorage.getItem('auth_token')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="rounded-md px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-[var(--color-primary)] hover:text-white transition cursor-pointer"
                                                        title="Print"
                                                    >
                                                        Print
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {!isLoading && (response?.data ?? []).length === 0 && (
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
                            {selectedBa.soal && (
                                <div className="col-span-2 rounded-lg bg-gray-50 p-3 border border-gray-200">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Soal Ujian Terkait</p>
                                    <p className="font-bold text-gray-900">{selectedBa.soal.judul_soal}</p>
                                    <p className="text-xs text-gray-600">
                                        Mata Kuliah: {selectedBa.soal.mata_kuliah ? `${selectedBa.soal.mata_kuliah.kode_mk} - ${selectedBa.soal.mata_kuliah.nama_mk}` : '—'}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Dosen Pengampu: {selectedBa.soal.dosen?.nama_lengkap ?? '—'}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Verifikator Soal</p>
                                <p className="text-gray-700 font-medium">{selectedBa.verifier?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Tanggal Generate</p>
                                <p className="text-gray-700">{selectedBa.generated_at ? formatDate(selectedBa.generated_at) : '—'}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2.5 border-t border-gray-100 pt-4">
                            {selectedBa.file_url && (
                                <a
                                    href={selectedBa.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition"
                                >
                                    <Download size={14} /> Unduh PDF
                                </a>
                            )}
                            {selectedBa.file_docx_url && (
                                <a
                                    href={selectedBa.file_docx_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] text-white px-3.5 py-2 text-xs font-bold hover:bg-[var(--color-primary-dark)] shadow-xs transition"
                                >
                                    <Download size={14} /> Unduh Word (.docx)
                                </a>
                            )}
                            <a
                                href={`/api/berita-acara/${selectedBa.id}/print?type=ba&token=${localStorage.getItem('auth_token')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3.5 py-2 text-xs font-semibold shadow-xs transition"
                            >
                                <FileText size={14} /> Print Berita Acara
                            </a>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
