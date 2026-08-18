import React, { useState } from 'react';
import { FileDown, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { LembarSoalPreviewPaper } from './LembarSoalPreviewPaper';
import { downloadDocx, downloadPdf, triggerFileDownload } from '../api/lembarSoalApi';
import { useToast } from '@/shared/hooks/useToast';
import type { LembarSoalData } from '../types/lembarSoal.types';

interface LembarSoalModalProps {
    open: boolean;
    onClose: () => void;
    data: LembarSoalData;
}

export function LembarSoalModal({ open, onClose, data }: LembarSoalModalProps) {
    const { toast } = useToast();
    const [zoom, setZoom] = useState<number>(75);
    const [downloadingDocx, setDownloadingDocx] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const handleDownloadDocx = async () => {
        setDownloadingDocx(true);
        try {
            const blob = await downloadDocx(data);
            const fileName = `Lembar_Soal_${data.tipe_ujian}_${data.kode_nama_mk.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
            triggerFileDownload(blob, fileName);
            toast.success('Template Lembar Soal (.docx) berhasil diunduh!');
        } catch (e) {
            toast.error('Gagal mengunduh template Lembar Soal.');
        } finally {
            setDownloadingDocx(false);
        }
    };

    const handleDownloadPdf = async () => {
        setDownloadingPdf(true);
        try {
            const blob = await downloadPdf(data);
            const fileName = `Lembar_Soal_${data.tipe_ujian}_${data.kode_nama_mk.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            triggerFileDownload(blob, fileName);
            toast.success('Dokumen Lembar Soal (.pdf) berhasil diunduh!');
        } catch (e) {
            toast.error('Gagal mengunduh dokumen Lembar Soal.');
        } finally {
            setDownloadingPdf(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Preview Template Lembar Soal"
            size="xl"
            footer={
                <div className="flex items-center justify-between w-full">
                    {/* Zoom control */}
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setZoom((z) => Math.max(z - 10, 50))}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                            title="Zoom Out"
                        >
                            <ZoomOut size={14} />
                        </button>
                        <span className="text-xs font-mono font-bold text-gray-700 w-10 text-center">
                            {zoom}%
                        </span>
                        <button
                            type="button"
                            onClick={() => setZoom((z) => Math.min(z + 10, 110))}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                            title="Zoom In"
                        >
                            <ZoomIn size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setZoom(75)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                            title="Reset Zoom"
                        >
                            <RotateCcw size={13} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                        >
                            Tutup
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={downloadingPdf}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
                        >
                            {downloadingPdf ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" />
                            ) : (
                                <Download size={14} />
                            )}
                            Unduh PDF
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadDocx}
                            disabled={downloadingDocx}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-50 cursor-pointer"
                        >
                            {downloadingDocx ? (
                                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <FileDown size={14} />
                            )}
                            Unduh Word (.docx)
                        </button>
                    </div>
                </div>
            }
        >
            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] p-4 bg-gray-100 rounded-xl border border-gray-200 flex justify-center shadow-inner">
                <LembarSoalPreviewPaper data={data} zoom={zoom} />
            </div>
        </Modal>
    );
}
