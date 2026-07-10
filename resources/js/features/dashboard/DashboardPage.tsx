import { LayoutDashboard } from 'lucide-react';

export function DashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold text-[var(--color-secondary)]">
                    Dashboard
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Selamat datang di Sistem Verifikasi Soal.
                </p>
            </div>

            {/* Placeholder stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: 'Total Soal', value: '—', color: 'var(--color-info)' },
                    { label: 'Sudah Diverifikasi', value: '—', color: 'var(--color-success)' },
                    { label: 'Perlu Revisi', value: '—', color: 'var(--color-warning)' },
                    { label: 'Deadline Terdekat', value: '—', color: 'var(--color-primary)' },
                ].map((card) => (
                    <div
                        key={card.label}
                        className="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
                    >
                        <p className="text-sm text-gray-500">{card.label}</p>
                        <p
                            className="mt-1 text-3xl font-bold"
                            style={{ color: card.color }}
                        >
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-gray-400">
                <div className="flex flex-col items-center gap-2 text-center">
                    <LayoutDashboard size={40} strokeWidth={1} />
                    <p className="text-sm font-medium">Konten dashboard akan ditambahkan</p>
                    <p className="text-xs">Statistik dan aktivitas terbaru per role</p>
                </div>
            </div>
        </div>
    );
}
