import React, { useState, useMemo } from 'react';
import {
    BookOpen,
    Search,
    Filter,
    AlertCircle,
    CheckCircle2,
    Clock,
    AlertTriangle,
    FileText,
    Sparkles,
} from 'lucide-react';
import { useUploadProgress } from '../hooks/useUploadProgress';
import type { CourseUploadProgress } from '../types/uploadProgress.types';

export function UploadProgressWidget() {
    const { data: progressList = [], isLoading, isError } = useUploadProgress();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredList = useMemo(() => {
        return progressList.filter((item: CourseUploadProgress) => {
            const matchesSearch =
                item.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.kode_mk.toLowerCase().includes(searchQuery.toLowerCase());

            if (statusFilter === 'all') return matchesSearch;
            if (statusFilter === 'belum_upload') return matchesSearch && item.status === 'belum_upload';
            if (statusFilter === 'in_review') return matchesSearch && (item.status === 'in_review' || item.status === 'submitted' || item.status === 'draft');
            if (statusFilter === 'revisi') return matchesSearch && item.status === 'revisi';
            if (statusFilter === 'approved') return matchesSearch && item.status === 'approved';
            return matchesSearch;
        });
    }, [progressList, searchQuery, statusFilter]);

    const getStatusBadge = (status: string, statusLabel: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Disetujui
                    </span>
                );
            case 'revisi':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                        <AlertTriangle className="h-3 w-3" />
                        Revisi
                    </span>
                );
            case 'in_review':
            case 'submitted':
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                        <Clock className="h-3 w-3" />
                        In Review
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                        <AlertCircle className="h-3 w-3" />
                        Ditolak
                    </span>
                );
            case 'belum_upload':
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500 border border-gray-200">
                        Belum Upload
                    </span>
                );
        }
    };

    const getProgressBarColor = (progress: number, status: string) => {
        if (status === 'approved') return 'bg-green-500';
        if (status === 'revisi') return 'bg-amber-500';
        if (status === 'in_review' || status === 'submitted' || status === 'draft') return 'bg-indigo-500';
        return 'bg-gray-300';
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 pb-4 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <BookOpen className="h-4 w-4 text-[var(--color-primary)]" />
                    Progress Upload per Mata Kuliah
                </h3>

                {/* Filter & Search Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-48">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari matkul..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[var(--color-primary)] focus:outline-none transition"
                        />
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-gray-50 py-1.5 pl-3 pr-8 text-xs font-medium text-gray-700 focus:bg-white focus:border-[var(--color-primary)] focus:outline-none transition"
                        >
                            <option value="all">Semua Status</option>
                            <option value="belum_upload">Belum Upload</option>
                            <option value="in_review">In Review</option>
                            <option value="revisi">Revisi</option>
                            <option value="approved">Disetujui</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="pt-4">
                {isLoading ? (
                    <div className="space-y-4 py-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2 animate-pulse">
                                <div className="h-4 w-1/3 rounded bg-gray-100" />
                                <div className="h-2 w-full rounded bg-gray-50" />
                            </div>
                        ))}
                    </div>
                ) : isError ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                        Gagal memuat progress upload mata kuliah.
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Sparkles className="h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-sm font-medium text-gray-500">
                            Tidak ada mata kuliah ditemukan.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredList.map((item: CourseUploadProgress) => (
                            <div
                                key={item.course_id}
                                className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition hover:bg-gray-50 hover:border-gray-200"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-[var(--color-primary)]">
                                            [{item.kode_mk}]
                                        </span>
                                        <h4 className="text-sm font-bold text-gray-900">
                                            {item.course}
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Critical Deadline Badge */}
                                        {item.is_critical_deadline && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs animate-pulse">
                                                <Clock className="h-3 w-3" />
                                                Sisa {item.days_remaining} Hari
                                            </span>
                                        )}

                                        {getStatusBadge(item.status, item.status_label)}
                                    </div>
                                </div>

                                {/* Progress Bar & Percentage */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Progress pengumpulan:</span>
                                        <span className="font-mono font-bold text-gray-700">
                                            {item.progress}%
                                        </span>
                                    </div>

                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className={`h-full transition-all duration-500 ${getProgressBarColor(
                                                item.progress,
                                                item.status,
                                            )}`}
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
