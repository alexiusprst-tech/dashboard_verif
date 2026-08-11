import { useState, useEffect } from 'react';
import { Search, X, Trash2, ArrowRight, UserPlus, GraduationCap } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/lib/utils';
import api from '@/shared/lib/api';

interface ManageTargetsModalProps {
    open: boolean;
    onClose: () => void;
    verifier: {
        id: number;
        user_id: number;
        dosen?: {
            id: number;
            nama_lengkap: string;
            kode_dosen?: string;
        };
    } | null;
    periodeId: string;
}

export function ManageTargetsModal({ open, onClose, verifier, periodeId }: ManageTargetsModalProps) {
    const { toast } = useToast();

    // Data lists
    const [assignedTargets, setAssignedTargets] = useState<any[]>([]);
    const [allDosen, setAllDosen]               = useState<any[]>([]);
    const [searchResults, setSearchResults]     = useState<any[]>([]);

    // States
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingList, setLoadingList] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Fetch assigned targets
    const fetchTargets = async () => {
        if (!verifier || !periodeId) return;
        setLoadingList(true);
        try {
            const res = await api.get('/penugasan-dosen', {
                params: { periode_id: periodeId, verifier_id: verifier.user_id },
            });
            setAssignedTargets(res.data.data);
        } catch (e: any) {
            toast.error('Gagal mengambil daftar dosen target.');
        } finally {
            setLoadingList(false);
        }
    };

    // Load Dosen and targets on mount/open
    useEffect(() => {
        if (open && verifier) {
            fetchTargets();
            setSearchQuery('');
            setShowDropdown(false);

            // Fetch all active dosen for target search
            api.get('/dosen/search', { params: { q: '', per_page: 200 } }).then((res) => {
                setAllDosen(res.data.data);
            });
        }
    }, [open, verifier, periodeId]);

    // Client-side filtering for searching Dosen to add
    useEffect(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!verifier) return;

        // Filter out:
        // 1. The verifier themselves (self-verification rule BR-003)
        // 2. Dosen who are already assigned to this verifier
        const availableDosen = allDosen.filter(
            (d) =>
                d.id !== verifier.user_id &&
                !assignedTargets.some((target) => target.target_dosen_id === d.id)
        );

        if (!query) {
            setSearchResults(availableDosen);
        } else {
            const filtered = availableDosen.filter(
                (d) =>
                    d.nama_lengkap.toLowerCase().includes(query) ||
                    (d.kode_dosen && d.kode_dosen.toLowerCase().includes(query))
            );
            setSearchResults(filtered);
        }
    }, [searchQuery, allDosen, assignedTargets, verifier]);

    // Assign new Dosen Target
    const handleAssignTarget = async (dosen: any) => {
        if (!verifier || !periodeId) return;
        setActionLoading(true);
        try {
            const res = await api.post('/penugasan-dosen', {
                periode_id: Number(periodeId),
                verifier_id: verifier.user_id,
                target_dosen_ids: [dosen.id],
            });
            toast.success(res.data.message || `Dosen ${dosen.nama_lengkap} berhasil ditugaskan.`);
            setSearchQuery('');
            setShowDropdown(false);
            fetchTargets();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal menambahkan dosen target.');
        } finally {
            setActionLoading(false);
        }
    };

    // Revoke Target Assignment
    const handleRevokeTarget = async (assignmentId: number, name: string) => {
        setActionLoading(true);
        try {
            await api.delete(`/penugasan-dosen/${assignmentId}`);
            toast.success(`Tugas verifikasi Dosen ${name} dicabut.`);
            fetchTargets();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Gagal mencabut dosen target.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Kelola Target Verifikasi: ${verifier?.dosen?.nama_lengkap ?? 'Verifikator'}`}
            size="lg"
        >
            <div className="space-y-6">
                {/* Search input to add target lecturers */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Tambah Dosen yang akan Diverifikasi <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            placeholder="Ketik nama atau kode dosen untuk menambah..."
                            className="block h-10 w-full rounded-lg border border-gray-300 pl-9 pr-4 text-sm focus:border-[var(--color-primary)] focus:outline-none"
                            disabled={actionLoading}
                        />
                    </div>

                    {/* Results Dropdown */}
                    {showDropdown && (
                        <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-2xl divide-y divide-gray-100">
                            {searchResults.length > 0 ? (
                                searchResults.map((d) => (
                                    <li
                                        key={d.id}
                                        onMouseDown={() => handleAssignTarget(d)}
                                        className="flex items-center justify-between cursor-pointer px-4 py-3 hover:bg-gray-50 text-gray-700 transition"
                                    >
                                        <div>
                                            <span className="font-semibold text-sm text-gray-900">{d.nama_lengkap}</span>
                                            {d.email && <p className="text-xs text-gray-400 mt-0.5">{d.email}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {d.kode_dosen && (
                                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono font-medium text-gray-600 border border-gray-200">
                                                    {d.kode_dosen}
                                                </span>
                                            )}
                                            <span className="rounded bg-purple-50 p-1 text-[var(--color-primary)] hover:bg-purple-100">
                                                <UserPlus size={14} />
                                            </span>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-3 text-center text-xs text-gray-400">
                                    {searchQuery ? `Tidak ada dosen yang sesuai` : 'Semua dosen aktif sudah ditugaskan'}
                                </li>
                            )}
                        </ul>
                    )}
                </div>

                {/* Assigned Targets list */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Daftar Dosen yang Diverifikasi ({assignedTargets.length})
                    </h4>

                    {loadingList ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-gray-100" />
                            ))}
                        </div>
                    ) : assignedTargets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
                            <GraduationCap size={32} strokeWidth={1.5} className="text-gray-400 mb-1.5" />
                            <p className="text-xs text-gray-500 font-medium">Belum ada dosen yang ditugaskan ke Verifikator ini.</p>
                            <p className="text-[11px] text-gray-400">Cari dosen di atas untuk menetapkan target verifikasi.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                            <table className="w-full border-collapse text-left text-sm text-gray-600">
                                <thead className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase text-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 w-12 text-center">No</th>
                                        <th className="px-4 py-3">Nama Lengkap</th>
                                        <th className="px-4 py-3 w-32 text-center">Kode Dosen</th>
                                        <th className="px-4 py-3 w-20 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {assignedTargets.map((target, idx) => (
                                        <tr key={target.id} className="hover:bg-gray-50/50 transition">
                                            <td className="px-4 py-3 text-center text-xs text-gray-400 font-mono">
                                                {idx + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-semibold text-gray-900">
                                                    {target.dosen?.nama_lengkap}
                                                </span>
                                                <p className="text-xs text-gray-400 mt-0.5">{target.dosen?.email}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {target.dosen?.kode_dosen ? (
                                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono font-medium text-gray-700 border border-gray-200">
                                                        {target.dosen?.kode_dosen}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-300">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRevokeTarget(target.id, target.dosen?.nama_lengkap)}
                                                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition cursor-pointer"
                                                    title="Cabut penugasan"
                                                    disabled={actionLoading}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-100 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </Modal>
    );
}
