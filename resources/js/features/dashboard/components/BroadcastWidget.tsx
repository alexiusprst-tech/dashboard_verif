import { Link } from 'react-router-dom';
import { Megaphone, Calendar, ArrowRight, UserCheck } from 'lucide-react';
import { useBroadcastFeed } from '@/features/broadcast/hooks/useBroadcast';
import { formatDate } from '@/shared/lib/utils';

export function BroadcastWidget() {
    const { data: broadcastResponse, isLoading } = useBroadcastFeed({ per_page: 5 });

    const broadcasts = broadcastResponse?.data ?? [];

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <Megaphone size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Pengumuman & Broadcast</h3>
                        <p className="text-xs text-gray-500">Pengumuman resmi dari Koordinator / Admin Utama</p>
                    </div>
                </div>
                <Link
                    to="/broadcast"
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                >
                    Lihat Semua
                    <ArrowRight size={13} />
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                    <div className="h-16 animate-pulse rounded-xl bg-gray-100" />
                </div>
            ) : broadcasts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                    <Megaphone size={32} className="mb-2 text-gray-300" strokeWidth={1.5} />
                    <p className="text-xs font-medium">Belum ada broadcast / pengumuman diterbitkan</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {broadcasts.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col gap-2 rounded-xl border border-purple-100 bg-purple-50/40 p-4 transition hover:bg-purple-50/80"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                        {item.target_label || 'Semua Dosen'}
                                    </span>
                                    <h4 className="text-sm font-bold text-gray-900 leading-snug">{item.judul}</h4>
                                </div>
                                {item.published_at && (
                                    <span className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0">
                                        <Calendar size={12} />
                                        {formatDate(item.published_at)}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{item.isi}</p>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400 border-t border-purple-100/60 pt-2">
                                <span className="flex items-center gap-1 font-medium text-purple-900">
                                    <UserCheck size={12} className="text-purple-600" />
                                    Penerbit: {item.creator_name || 'Administrator Utama'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
