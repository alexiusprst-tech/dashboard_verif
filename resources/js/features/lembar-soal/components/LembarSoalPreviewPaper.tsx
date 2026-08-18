import React from 'react';
import type { LembarSoalData } from '../types/lembarSoal.types';

interface LembarSoalPreviewPaperProps {
    data: LembarSoalData;
    zoom?: number; // scale percentage e.g. 100, 85, 75
}

export function LembarSoalPreviewPaper({ data, zoom = 100 }: LembarSoalPreviewPaperProps) {
    let globalSoalCounter = 1;

    return (
        <div
            className="origin-top transition-transform duration-200"
            style={{ transform: `scale(${zoom / 100})` }}
        >
            <div
                className="w-[210mm] min-h-[297mm] bg-white p-[16mm] text-black shadow-2xl rounded-xs mx-auto font-sans leading-tight select-none border border-gray-300"
                style={{ fontFamily: "'Arial', 'Helvetica', sans-serif", fontSize: '9pt' }}
            >
                {/* ── TOP OUTSIDE FORM NO ── */}
                <div className="text-[8.5pt] text-gray-700 font-normal mb-2">
                    Form No : {data.form_no || '100-S1SI-001-R1'}
                </div>

                {/* ── 1. UNIFIED MAIN HEADER TABLE ── */}
                <table className="w-full border-collapse border border-black mb-2.5 text-[8.5pt]">
                    <tbody>
                        <tr>
                            {/* Logo Cell (Spanning 4 rows) */}
                            <td
                                rowSpan={4}
                                className="w-[22%] border border-black p-2.5 text-center align-middle bg-white"
                            >
                                <img
                                    src="/images/logo-telkom.png"
                                    alt="Telkom University"
                                    className="max-h-11 max-w-[130px] mx-auto object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                    }}
                                />
                                <div className="font-bold text-[10pt] text-red-700 leading-none mt-1">
                                    Telkom<span className="text-gray-800 font-normal text-[8pt] block">University</span>
                                </div>
                            </td>
                            {/* Top Title: LEMBAR SOAL */}
                            <td
                                colSpan={4}
                                className="border border-black py-1.5 text-center font-bold text-[12pt] tracking-wider text-black uppercase"
                            >
                                LEMBAR SOAL
                            </td>
                        </tr>
                        {/* Meta Row 1 */}
                        <tr>
                            <td className="w-[16%] border border-black px-2 py-1 text-gray-800">
                                Nama Evaluasi
                            </td>
                            <td className="w-[32%] border border-black px-2 py-1 font-medium text-black">
                                {data.nama_evaluasi || ''}
                            </td>
                            <td className="w-[16%] border border-black px-2 py-1 text-gray-800">
                                Kode dosen
                            </td>
                            <td className="w-[36%] border border-black px-2 py-1 font-medium text-black">
                                {data.kode_dosen || ''}
                            </td>
                        </tr>
                        {/* Meta Row 2 */}
                        <tr>
                            <td className="border border-black px-2 py-1 text-gray-800">
                                Kode/Nama MK
                            </td>
                            <td className="border border-black px-2 py-1 font-medium text-black">
                                {data.kode_nama_mk || '/'}
                            </td>
                            <td className="border border-black px-2 py-1 text-gray-800">
                                Tipe Ujian
                            </td>
                            <td className="border border-black px-2 py-1 font-medium text-black">
                                {data.tipe_ujian || ''}
                            </td>
                        </tr>
                        {/* Meta Row 3 */}
                        <tr>
                            <td className="border border-black px-2 py-1 text-gray-800">
                                Tanggal Evaluasi
                            </td>
                            <td className="border border-black px-2 py-1 font-medium text-black">
                                {data.tanggal_evaluasi || '/ menit'}
                            </td>
                            <td className="border border-black px-2 py-1 text-gray-800">
                                Tipe Soal
                            </td>
                            <td className="border border-black px-2 py-1 font-medium text-black">
                                {data.tipe_soal || 'Closed Book (120 minutes)'}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ── 2. PETUNJUK PENGERJAAN BOX ── */}
                <table className="w-full border-collapse border border-black mb-2.5 text-[8.5pt]">
                    <tbody>
                        <tr>
                            <td className="w-[18%] border border-black p-2 align-top text-black leading-tight">
                                Petunjuk<br />Pengerjaan
                            </td>
                            <td className="w-[82%] border border-black p-2 align-top text-black leading-relaxed">
                                {data.petunjuk_pengerjaan && data.petunjuk_pengerjaan.length > 0 ? (
                                    data.petunjuk_pengerjaan.map((p, idx) => (
                                        <div key={idx}>({idx + 1}) {p}</div>
                                    ))
                                ) : (
                                    <div>(1) ....</div>
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* ── 3. HIERARKI PLO → CLO → AREA SOAL ── */}
                <div className="space-y-2.5">
                    {data.plo && data.plo.length > 0 ? (
                        data.plo.map((plo, ploIdx) => (
                            <div key={plo.id ?? ploIdx} className="space-y-2.5">
                                {/* PLO Box */}
                                <table className="w-full border-collapse border border-black text-[8.5pt]">
                                    <tbody>
                                        <tr>
                                            <td className="w-[18%] border border-black p-2 align-top text-black leading-tight">
                                                Program<br />Learning<br />Outcomes
                                            </td>
                                            <td className="w-[82%] border border-black p-2 align-top text-black leading-relaxed font-medium">
                                                {plo.kode} – {plo.deskripsi}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* List of CLOs in this PLO (1 CLO = 1 Area Soal Terpisah) */}
                                {plo.clo && plo.clo.length > 0 ? (
                                    plo.clo.map((clo, cloIdx) => {
                                        const currentSoalNum = globalSoalCounter++;
                                        return (
                                            <div key={clo.id ?? cloIdx} className="space-y-0">
                                                {/* Tabel CLO Header & Row */}
                                                <table className="w-full border-collapse border border-black text-[8.5pt]">
                                                    <thead>
                                                        <tr>
                                                            <th
                                                                colSpan={2}
                                                                className="w-[88%] border border-black px-2 py-1 text-left font-normal"
                                                            >
                                                                Course Learning outcomes
                                                            </th>
                                                            <th className="w-[12%] border border-black px-2 py-1 text-center font-normal">
                                                                Bobot LO
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td className="w-[10%] border border-black px-2 py-1 text-center font-medium">
                                                                {clo.kode}
                                                            </td>
                                                            <td className="w-[78%] border border-black px-2 py-1 text-left text-black">
                                                                {clo.deskripsi}
                                                            </td>
                                                            <td className="w-[12%] border border-black px-2 py-1 text-center font-medium">
                                                                {clo.bobot_lo || '?? %'}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>

                                                {/* Area Soal Box (Kotak Terpisah Khusus CLO ini) */}
                                                <div className="w-full min-h-[160px] border-x border-b border-black p-4 bg-white text-center">
                                                    {/* Yellow Highlight Badge */}
                                                    <div className="inline-block bg-[#FFFF00] text-black font-bold text-[9pt] px-2.5 py-0.5 mb-2">
                                                        Soal LO{currentSoalNum}
                                                    </div>

                                                    {clo.soal_text && (
                                                        <div className="text-[9pt] text-left text-black mt-2 leading-relaxed whitespace-pre-wrap">
                                                            {clo.soal_text}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : null}
                            </div>
                        ))
                    ) : null}
                </div>
            </div>
        </div>
    );
}
