<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Berita Acara Verifikasi Soal Ujian</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 12px;
            color: #1a1a1a;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .header {
            border-bottom: 3px double #C8102E;
            padding-bottom: 10px;
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 {
            font-size: 16px;
            color: #C8102E;
            margin: 0 0 5px 0;
            text-transform: uppercase;
        }
        .header h2 {
            font-size: 12px;
            color: #555;
            margin: 0;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 4px 0;
            vertical-align: top;
        }
        .meta-table td.label {
            width: 25%;
            font-weight: bold;
            color: #374151;
        }
        .meta-table td.colon {
            width: 2%;
        }
        .content-title {
            font-size: 13px;
            font-weight: bold;
            border-bottom: 1px solid #D1D5DB;
            padding-bottom: 5px;
            margin-bottom: 10px;
            color: #C8102E;
            text-transform: uppercase;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th {
            background-color: #F3F4F6;
            border: 1px solid #D1D5DB;
            padding: 8px;
            font-weight: bold;
            text-align: left;
            color: #374151;
        }
        .items-table td {
            border: 1px solid #D1D5DB;
            padding: 8px;
            vertical-align: top;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-approved {
            background-color: #DCFCE7;
            color: #16A34A;
        }
        .status-revisi {
            background-color: #FEF3C7;
            color: #D97706;
        }
        .status-rejected {
            background-color: #FEE2E2;
            color: #DC2626;
        }
        .signatures {
            width: 100%;
            margin-top: 40px;
        }
        .signatures td {
            width: 50%;
            text-align: center;
        }
        .signature-title {
            margin-bottom: 60px;
        }
        .signature-name {
            font-weight: bold;
            text-decoration: underline;
        }
        .page-break {
            page-break-before: always;
        }
        .soal-detail-container {
            border: 1px solid #D1D5DB;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
            background-color: #F9FAFB;
        }
        .soal-detail-title {
            font-size: 14px;
            font-weight: bold;
            color: #C8102E;
            margin-top: 0;
            margin-bottom: 10px;
            border-bottom: 1px dashed #D1D5DB;
            padding-bottom: 5px;
        }
    </style>
</head>
<body>

    @if ($printType === 'ba' || $printType === 'both')
        <!-- Halaman Berita Acara -->
        <div class="header">
            <h1>Telkom University</h1>
            <h2>Berita Acara Verifikasi Soal Ujian</h2>
        </div>

        <table class="meta-table">
            <tr>
                <td class="label">Nomor Dokumen</td>
                <td class="colon">:</td>
                <td>{{ $ba->nomor_ba }}</td>
            </tr>
            <tr>
                <td class="label">Periode Akademik</td>
                <td class="colon">:</td>
                <td>{{ $ba->periode->nama_periode }} ({{ $ba->periode->semester }} - {{ $ba->periode->tahun_akademik }})</td>
            </tr>
            <tr>
                <td class="label">Tanggal Generate</td>
                <td class="colon">:</td>
                <td>{{ $ba->generated_at->format('d-m-Y H:i:s') }}</td>
            </tr>
            <tr>
                <td class="label">Verifikator / PIC</td>
                <td class="colon">:</td>
                <td>{{ $ba->verifier->nama_lengkap }} ({{ $ba->verifier->kode_dosen }})</td>
            </tr>
        </table>

        <div class="content-title">Daftar Hasil Verifikasi Soal Ujian</div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 5%;">No</th>
                    <th style="width: 35%;">Mata Kuliah</th>
                    <th style="width: 25%;">Dosen Pengampu</th>
                    <th style="width: 15%;">Status</th>
                    <th style="width: 20%;">Catatan</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($ba->items as $index => $item)
                    <tr>
                        <td>{{ $index + 1 }}</td>
                        <td>
                            <strong>{{ $item->soal->mataKuliah->nama_mk }}</strong><br>
                            <span style="color: #6B7280; font-size: 10px;">Kode: {{ $item->soal->mataKuliah->kode_mk }}</span>
                        </td>
                        <td>{{ $item->soal->dosen->nama_lengkap }}</td>
                        <td>
                            <span class="status-badge status-{{ $item->status_snapshot->value }}">
                                {{ $item->status_snapshot->label() }}
                            </span>
                        </td>
                        <td>{{ $item->catatan_snapshot ?? '-' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <table class="signatures">
            <tr>
                <td>
                    <div class="signature-title">Mengetahui,<br>Koordinator Program Studi</div>
                    <div class="signature-name">...................................................</div>
                    <div>NIP/NIDN.</div>
                </td>
                <td>
                    <div class="signature-title">Bandung, {{ now()->format('d F Y') }}<br>Verifikator / PIC</div>
                    <div class="signature-name">{{ $ba->verifier->nama_lengkap }}</div>
                    <div>NIDN. {{ $ba->verifier->kode_dosen }}</div>
                </td>
            </tr>
        </table>
    @endif

    @if ($printType === 'both' && count($ba->items) > 0)
        <div class="page-break"></div>
    @endif

    @if ($printType === 'soal' || $printType === 'both')
        <!-- Detail Soal yang Terkait -->
        <div class="header">
            <h1>Telkom University</h1>
            <h2>Lampiran Soal Ujian</h2>
        </div>

        <table class="meta-table">
            <tr>
                <td class="label">Nomor Dokumen BA</td>
                <td class="colon">:</td>
                <td>{{ $ba->nomor_ba }}</td>
            </tr>
        </table>

        <div class="content-title">Rincian Informasi Soal</div>

        @foreach ($ba->items as $index => $item)
            <div class="soal-detail-container">
                <div class="soal-detail-title">
                    {{ $index + 1 }}. {{ $item->soal->judul_soal }}
                </div>
                <table class="meta-table" style="margin-bottom: 0;">
                    <tr>
                        <td class="label" style="width: 30%;">Mata Kuliah</td>
                        <td class="colon">:</td>
                        <td>{{ $item->soal->mataKuliah->nama_mk }} ({{ $item->soal->mataKuliah->kode_mk }})</td>
                    </tr>
                    <tr>
                        <td class="label">Dosen Pengunggah</td>
                        <td class="colon">:</td>
                        <td>{{ $item->soal->dosen->nama_lengkap }} ({{ $item->soal->dosen->kode_dosen }})</td>
                    </tr>
                    <tr>
                        <td class="label">Versi Dokumen</td>
                        <td class="colon">:</td>
                        <td>Versi {{ $item->soal->versi }} (Diunggah: {{ $item->soal->uploaded_at->format('d-m-Y H:i') }})</td>
                    </tr>
                    <tr>
                        <td class="label">Capaian Pembelajaran (CLO)</td>
                        <td class="colon">:</td>
                        <td>{{ $item->soal->clo->kode }} - {{ $item->soal->clo->deskripsi }}</td>
                    </tr>
                    <tr>
                        <td class="label">File Soal Path</td>
                        <td class="colon">:</td>
                        <td><code>{{ $item->soal->file_soal }}</code></td>
                    </tr>
                    <tr>
                        <td class="label">Status Verifikasi</td>
                        <td class="colon">:</td>
                        <td>{{ $item->status_snapshot->label() }}</td>
                    </tr>
                    @if ($item->catatan_snapshot)
                        <tr>
                            <td class="label">Catatan Revisi</td>
                            <td class="colon">:</td>
                            <td style="color: #DC2626; font-style: italic;">"{{ $item->catatan_snapshot }}"</td>
                        </tr>
                    @endif
                </table>
            </div>
        @endforeach
    @endif

</body>
</html>
