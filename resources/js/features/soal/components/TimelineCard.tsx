import React from 'react';
import {
    FileText,
    UploadCloud,
    Clock,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    FileCheck2,
    User,
    Calendar,
} from 'lucide-react';
import { useSoalTimeline } from '../hooks/useSoalTimeline';
import type { TimelineItem } from '../types/timeline.types';

interface TimelineCardProps {
    soalId: number;
}

export function TimelineCard({ soalId }: TimelineCardProps) {
    const { data: timeline = [], isLoading, isError } = useSoalTimeline(soalId);

    const getStatusIcon = (status: string, iconStr: string) => {
        switch (status) {
            case 'draft':
            case 'submitted':
                return <FileText className="h-4 w-4 text-blue-500" />;
            case 'in_review':
                return <Clock className="h-4 w-4 text-sky-500" />;
            case 'revision_requested':
            case 'revisi':
                return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'revision_uploaded':
                return <UploadCloud className="h-4 w-4 text-indigo-500" />;
            case 'approved':
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'rejected':
                return <XCircle className="h-4 w-4 text-rose-500" />;
            case 'berita_acara_generated':
                return <FileCheck2 className="h-4 w-4 text-purple-500" />;
            default:
                return <FileText className="h-4 w-4 text-slate-500" />;
        }
    };

    const getBadgeStyle = (color: string) => {
        switch (color) {
            case 'green':
            case 'emerald':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'amber':
            case 'yellow':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'red':
            case 'rose':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'indigo':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200';
            case 'purple':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'blue':
            default:
                return 'bg-blue-50 text-blue-700 border-blue-200';
        }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="pb-3 border-b border-gray-100 mb-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <Clock className="h-4 w-4 text-[var(--color-primary)]" />
                    Timeline Riwayat Verifikasi
                </h3>
            </div>
            <div>
                {isLoading ? (
                    <div className="space-y-4 py-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4 animate-pulse">
                                <div className="h-8 w-8 rounded-full bg-gray-100 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 rounded bg-gray-100" />
                                    <div className="h-3 w-2/3 rounded bg-gray-50" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                        Gagal memuat timeline riwayat verifikasi.
                    </div>
                ) : timeline.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                        Belum ada aktivitas tercatat untuk soal ini.
                    </div>
                ) : (
                    <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                        {timeline.map((item: TimelineItem, idx: number) => (
                            <div key={item.id || idx} className="relative group">
                                {/* Dot Icon Anchor */}
                                <div className="absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-white shadow-xs border border-gray-200">
                                    {getStatusIcon(item.status, item.icon_status)}
                                </div>

                                {/* Content Body */}
                                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3.5 transition hover:bg-gray-50">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                        <span
                                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getBadgeStyle(
                                                item.color,
                                            )}`}
                                        >
                                            {item.status_label}
                                        </span>

                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{item.date}</span>
                                            {item.time && (
                                                <span className="font-mono text-[11px] font-semibold text-gray-600">
                                                    • {item.time}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {item.actor_name && (
                                        <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-1">
                                            <User className="h-3.5 w-3.5 text-gray-400" />
                                            <span>{item.actor_name}</span>
                                            {item.actor_role && (
                                                <span className="text-gray-400 font-normal">
                                                    ({item.actor_role})
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
