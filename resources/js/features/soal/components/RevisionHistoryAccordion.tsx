import { useState } from 'react';
import {
    History,
    ChevronDown,
    ChevronUp,
    FileText,
    User,
    Calendar,
    AlertCircle,
} from 'lucide-react';
import { useRevisionHistory } from '../hooks/useSoalTimeline';
import type { RevisionHistoryItem } from '../types/timeline.types';

interface RevisionHistoryAccordionProps {
    soalId: number;
}

export function RevisionHistoryAccordion({ soalId }: RevisionHistoryAccordionProps) {
    const { data: history = [], isLoading, isError } = useRevisionHistory(soalId);
    const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

    const toggleAccordion = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="pb-3 border-b border-gray-100 mb-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <History className="h-4 w-4 text-amber-600" />
                    Detail Catatan Revisi
                </h3>
            </div>
            <div>
                {isLoading ? (
                    <div className="space-y-3 py-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                ) : isError ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                        Gagal memuat detail catatan revisi.
                    </div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <AlertCircle className="h-9 w-9 text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-600">
                            Belum terdapat riwayat revisi.
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Soal belum pernah diminta perbaikan oleh Verifikator Soal.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item: RevisionHistoryItem, idx: number) => {
                            const isOpen = openIndex === idx;
                            const isApproved = item.status === 'approved';
                            const isRejected = item.status === 'rejected';

                            const badgeBg = isApproved
                                ? 'bg-green-100 border-green-200 text-green-800'
                                : isRejected
                                ? 'bg-red-100 border-red-200 text-red-800'
                                : 'bg-amber-100 border-amber-200 text-amber-800';

                            const circleBg = isApproved ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-amber-500';
                            const label = item.status_label || (isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Perlu Revisi');

                            return (
                                <div
                                    key={item.id || idx}
                                    className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50"
                                >
                                    {/* Accordion Header */}
                                    <button
                                        type="button"
                                        onClick={() => toggleAccordion(idx)}
                                        className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-gray-100/60"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`flex h-7 w-7 items-center justify-center rounded-full ${circleBg} text-xs font-bold text-white shadow-xs`}>
                                                {item.revision}
                                            </span>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900">
                                                    Verifikasi #{item.revision} ({item.version})
                                                </h4>
                                                <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <User className="h-3 w-3 text-gray-400" />
                                                        {item.verifier_name}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-gray-400" />
                                                        {item.created_at}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeBg}`}>
                                                {label}
                                            </span>
                                            {isOpen ? (
                                                <ChevronUp className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Accordion Body */}
                                    {isOpen && (
                                        <div className="border-t border-amber-200/50 bg-white p-4 space-y-3">
                                            <div>
                                                <div className="mb-1.5 text-xs font-bold text-gray-500">
                                                    Catatan Keseluruhan:
                                                </div>
                                                <div className="rounded-xl bg-amber-50/60 p-3 text-xs leading-relaxed text-gray-800 border border-amber-200/60">
                                                    {item.notes}
                                                </div>
                                            </div>

                                            {/* Catatan Khusus Per CLO jika ada */}
                                            {item.catatan_clo && item.catatan_clo.length > 0 && (
                                                <div>
                                                    <div className="mb-1.5 text-xs font-bold text-gray-500 flex items-center gap-1.5">
                                                        <span>Catatan Khusus Per CLO:</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {item.catatan_clo.map((c, cIdx) => (
                                                            <div
                                                                key={cIdx}
                                                                className="rounded-lg border border-blue-100 bg-blue-50/40 p-2.5 text-xs space-y-1"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white font-mono">
                                                                            {c.kode}
                                                                        </span>
                                                                        {c.deskripsi && (
                                                                            <span className="text-[11px] text-gray-600 font-medium line-clamp-1">
                                                                                {c.deskripsi}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {c.status && (
                                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                                                            c.status === 'sesuai'
                                                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                                                : 'bg-orange-100 text-orange-700 border border-orange-200'
                                                                        }`}>
                                                                            {c.status === 'sesuai' ? 'Sesuai' : 'Perlu Revisi'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {c.catatan && (
                                                                    <p className="text-gray-800 bg-white/80 p-2 rounded border border-blue-100/80 leading-relaxed mt-1">
                                                                        {c.catatan}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Berita Acara Otomatis */}
                                            {(item.ba_pdf_url || item.ba_docx_url) && (
                                                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-indigo-50/70 border border-indigo-200 p-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                                                        <div>
                                                            <div className="text-xs font-bold text-indigo-950">
                                                                Berita Acara Evaluasi ({item.ba_nomor ?? 'Resmi'})
                                                            </div>
                                                            <div className="text-[11px] text-indigo-700">
                                                                Dokumen hasil evaluasi kesesuaian soal dengan CLO.
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {item.ba_pdf_url && (
                                                            <a
                                                                href={item.ba_pdf_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-red-700 transition"
                                                            >
                                                                PDF
                                                            </a>
                                                        )}
                                                        {item.ba_docx_url && (
                                                            <a
                                                                href={item.ba_docx_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 transition"
                                                            >
                                                                Word (.docx)
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {item.file_soal && (
                                                <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 pt-1 border-t border-gray-100">
                                                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                                                    <span>Versi Dokumen: </span>
                                                    <span className="font-semibold font-mono text-gray-700">
                                                        {item.version}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
