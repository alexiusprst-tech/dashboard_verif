import React, { useState } from 'react';
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
                            Soal belum pernah diminta perbaikan oleh PIC verifikator.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item: RevisionHistoryItem, idx: number) => {
                            const isOpen = openIndex === idx;
                            return (
                                <div
                                    key={item.id || idx}
                                    className="overflow-hidden rounded-xl border border-amber-200/80 bg-amber-50/30"
                                >
                                    {/* Accordion Header */}
                                    <button
                                        type="button"
                                        onClick={() => toggleAccordion(idx)}
                                        className="flex w-full items-center justify-between p-3.5 text-left transition hover:bg-amber-100/40"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-xs">
                                                {item.revision}
                                            </span>
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900">
                                                    Revisi #{item.revision} ({item.version})
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
                                            <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                                                Perlu Revisi
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
                                        <div className="border-t border-amber-200/50 bg-white p-4">
                                            <div className="mb-2 text-xs font-bold text-gray-500">
                                                Catatan Verifikator:
                                            </div>
                                            <div className="rounded-xl bg-amber-50/60 p-3 text-xs leading-relaxed text-gray-800 border border-amber-200/60">
                                                {item.notes}
                                            </div>

                                            {item.file_soal && (
                                                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
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
