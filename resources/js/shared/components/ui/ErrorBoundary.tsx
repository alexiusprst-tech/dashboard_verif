import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export function RouteErrorBoundary() {
    const error = useRouteError();

    let errorMessage = 'Terjadi kesalahan yang tidak terduga pada aplikasi.';
    let errorDetail = '';

    if (isRouteErrorResponse(error)) {
        errorMessage = `${error.status} - ${error.statusText}`;
        errorDetail = error.data?.message || '';
    } else if (error instanceof Error) {
        errorMessage = error.message;
        errorDetail = error.stack || '';
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200 mb-5">
                    <AlertTriangle size={32} />
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-2">Terjadi Kesalahan Sistem</h1>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    Halaman mengalami kendala saat memproses data. Silakan muat ulang halaman atau kembali ke Beranda.
                </p>

                {errorMessage && (
                    <div className="mb-6 rounded-xl bg-gray-50 border border-gray-200 p-3 text-left">
                        <p className="text-xs font-mono font-medium text-red-600 break-words line-clamp-3">
                            {errorMessage}
                        </p>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 cursor-pointer"
                    >
                        <RefreshCw size={15} />
                        Muat Ulang Halaman
                    </button>
                    <Link
                        to="/dashboard"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 cursor-pointer"
                    >
                        <Home size={15} />
                        Ke Beranda
                    </Link>
                </div>
            </div>
        </div>
    );
}
