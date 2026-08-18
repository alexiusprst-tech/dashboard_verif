<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Berita Acara Evaluasi Soal - {{ $data['kode_mata_kuliah'] ?? 'CLO' }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: Cambria, Georgia, "Times New Roman", serif;
            font-size: 9.5pt;
            line-height: 1.25;
            color: #000000;
            margin: 0;
            padding: 0;
        }

        /* ── TOP OUTSIDE FORM NO ── */
        .form-no-top {
            font-size: 8.5pt;
            color: #333333;
            margin-bottom: 4px;
            font-weight: normal;
        }

        /* ── UNIFIED MAIN HEADER TABLE ── */
        .table-main-header {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-bottom: 10px;
        }

        .table-main-header td, .table-main-header th {
            border: 1px solid #000;
            padding: 4px 6px;
            vertical-align: middle;
            font-size: 8.5pt;
        }

        .logo-box {
            width: 20%;
            text-align: center;
            vertical-align: middle;
            border: 1px solid #000;
            padding: 4px;
            background-color: #ffffff;
        }

        .logo-img {
            max-height: 44px;
            max-width: 120px;
        }

        .univ-text-box {
            width: 40%;
            line-height: 1.2;
            padding: 4px 8px;
        }

        .meta-field-label {
            font-size: 8pt;
            width: 18%;
            padding: 2px 4px;
        }

        .meta-field-val {
            font-size: 8pt;
            width: 22%;
            padding: 2px 4px;
        }

        .header-sub-row {
            text-align: center;
            font-size: 9.5pt;
            font-weight: bold;
            letter-spacing: 0.3px;
            padding: 5px 4px;
            background-color: #ffffff;
            border: 1px solid #000;
        }

        /* ── DOCUMENT TITLE ── */
        .doc-title-container {
            text-align: center;
            margin: 10px 0 12px 0;
        }

        .doc-title-main {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }

        .doc-title-sub {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 2px;
        }

        /* ── KEY-VALUE TABLES ── */
        .kv-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }

        .kv-table td {
            padding: 2px 0;
            vertical-align: top;
            font-size: 9.5pt;
        }

        .kv-label {
            width: 28%;
        }

        .kv-sep {
            width: 2%;
            text-align: center;
        }

        .kv-val {
            width: 70%;
            font-weight: normal;
        }

        .section-intro-bold {
            font-weight: bold;
            margin-top: 8px;
            margin-bottom: 4px;
            font-size: 9.5pt;
        }

        .section-statement {
            margin-top: 6px;
            margin-bottom: 6px;
            text-align: justify;
            line-height: 1.3;
            font-size: 9.5pt;
        }

        /* ── EVALUATION RESULT TABLE ── */
        .table-evaluasi {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin: 8px 0 10px 0;
        }

        .table-evaluasi th {
            border: 1px solid #000;
            background-color: #f5f5f5;
            padding: 5px 4px;
            font-size: 9pt;
            font-weight: bold;
            text-align: center;
            vertical-align: middle;
        }

        .table-evaluasi td {
            border: 1px solid #000;
            padding: 4px 6px;
            font-size: 9pt;
            vertical-align: top;
        }

        .col-asesmen { width: 16%; text-align: center; }
        .col-clo { width: 12%; text-align: center; font-weight: bold; }
        .col-no { width: 10%; text-align: center; }
        .col-catatan { width: 31%; text-align: left; }
        .col-rekomendasi { width: 31%; text-align: left; }

        /* ── POST EVALUATION STATEMENT ── */
        .post-statement {
            font-size: 9pt;
            margin: 8px 0 14px 0;
            line-height: 1.35;
        }

        /* ── SIGNATURES AREA ── */
        .signature-container {
            width: 100%;
            page-break-inside: avoid;
            margin-top: 14px;
        }

        .date-line {
            text-align: right;
            font-size: 9.5pt;
            margin-bottom: 10px;
        }

        .table-ttd {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }

        .table-ttd td {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            font-size: 9.5pt;
            padding: 0 6px;
        }

        .ttd-role {
            font-weight: normal;
            margin-bottom: 50px;
        }

        .ttd-name {
            font-weight: bold;
            text-decoration: underline;
        }

        .ttd-nip {
            font-size: 8.5pt;
            color: #333333;
            margin-top: 2px;
        }
    </style>
</head>
<body>

    <!-- Form No Kiri Atas -->
    <div class="form-no-top">Form No : {{ $data['form_no'] ?? '100-S1SI-001-R1' }}</div>

    <!-- Table Header Utama (Format Telkom University) -->
    <table class="table-main-header">
        <tr>
            <!-- Logo Box -->
            <td rowspan="4" class="logo-box">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" class="logo-img" alt="Telkom University Logo">
                @else
                    <div style="font-weight: bold; font-size: 11pt; color: #b91c1c;">Telkom University</div>
                @endif
            </td>
            <!-- Univ & Alamat Box -->
            <td rowspan="4" class="univ-text-box">
                <strong style="font-size: 9.5pt;">UNIVERSITAS TELKOM</strong><br>
                <span style="font-size: 8pt; color: #222;">
                    Jl. Telekomunikasi No. 1, Terusan Buahbatu - Bojongsoang, Sukapura, Kec. Dayeuhkolot, Kabupaten Bandung, Jawa Barat 40257
                </span>
            </td>
            <!-- Metadata Right -->
            <td class="meta-field-label">No. Dokumen</td>
            <td class="meta-field-val">{{ $data['no_dokumen'] ?? '100-S1SI-001-R1' }}</td>
        </tr>
        <tr>
            <td class="meta-field-label">No. Revisi</td>
            <td class="meta-field-val">{{ $data['no_revisi'] ?? '00' }}</td>
        </tr>
        <tr>
            <td class="meta-field-label">Berlaku</td>
            <td class="meta-field-val">{{ $data['berlaku'] ?? now()->format('d/m/Y') }}</td>
        </tr>
        <tr>
            <td class="meta-field-label">Halaman</td>
            <td class="meta-field-val">1 dari 1</td>
        </tr>
        <tr>
            <td colspan="4" class="header-sub-row">
                BERITA ACARA VERIFIKASI SOAL ASESMEN<br>
                OBE SEMESTER {{ strtoupper($data['semester_tahun_akademik'] ?? 'GANJIL/GENAP 20../20..') }}
            </td>
        </tr>
    </table>

    <!-- Judul Dokumen -->
    <div class="doc-title-container">
        <h1 class="doc-title-main">BERITA ACARA EVALUASI KESESUAIAN SOAL ASESMEN</h1>
        <h2 class="doc-title-sub">DENGAN CLO MATA KULIAH</h2>
    </div>

    <!-- Informasi Akademik -->
    <table class="kv-table">
        <tr>
            <td class="kv-label">Semester/Tahun Akademik</td>
            <td class="kv-sep">:</td>
            <td class="kv-val">{{ $data['semester_tahun_akademik'] ?? '-' }}</td>
        </tr>
        <tr>
            <td class="kv-label">Fakultas</td>
            <td class="kv-sep">:</td>
            <td class="kv-val">{{ $data['fakultas'] ?? 'Rekayasa Industri' }}</td>
        </tr>
    </table>

    <!-- Data Evaluator -->
    <div class="section-intro-bold">Saya sebagai evaluator</div>
    <table class="kv-table">
        <tr>
            <td class="kv-label">Nama Evaluator</td>
            <td class="kv-sep">:</td>
            <td class="kv-val">{{ $data['nama_evaluator'] ?? '-' }}</td>
        </tr>
        <tr>
            <td class="kv-label">Kode Dosen</td>
            <td class="kv-sep">:</td>
            <td class="kv-val">{{ $data['kode_dosen'] ?? '-' }}</td>
        </tr>
        <tr>
            <td class="kv-label">Program Studi</td>
            <td class="kv-sep">:</td>
            <td class="kv-val">{{ $data['program_studi'] ?? 'S1 Sistem Informasi' }}</td>
        </tr>
    </table>

    <!-- Pernyataan Evaluasi -->
    <div class="section-statement">
        Menyatakan bahwa telah dilakukan evaluasi kesesuaian antara soal ujian dengan CLO yang diajukan untuk mata kuliah sebagai berikut.
    </div>

    <!-- Data Mata Kuliah -->
    <table class="kv-table">
        <tr>
            <td class="kv-label">Kode Mata Kuliah</td>
            <td class="kv-sep">:</td>
            <td class="kv-val">{{ $data['kode_mata_kuliah'] ?? '-' }}</td>
        </tr>
        <tr>
            <td class="kv-label">Nama Mata Kuliah</td>
            <td class="kv-sep">:</td>
            <td class="kv-val">{{ $data['nama_mata_kuliah'] ?? '-' }}</td>
        </tr>
        <tr>
            <td class="kv-label">Program Studi</td>
            <td class="kv-sep">:</td>
            <td class="kv-val">{{ $data['program_studi_mk'] ?? $data['program_studi'] ?? 'S1 Sistem Informasi' }}</td>
        </tr>
        <tr>
            <td class="kv-label">Dosen Koordinator</td>
            <td class="kv-sep">:</td>
            <td class="kv-val">{{ $data['dosen_koordinator'] ?? '-' }}</td>
        </tr>
    </table>

    <!-- Tabel Hasil Evaluasi -->
    <div class="section-intro-bold" style="margin-top: 8px;">Dengan hasil evaluasi sebagai berikut:</div>
    <table class="table-evaluasi">
        <thead>
            <tr>
                <th class="col-asesmen">Bentuk Asesmen</th>
                <th class="col-clo">CLO</th>
                <th class="col-no">No. Soal</th>
                <th class="col-catatan">Catatan Evaluasi</th>
                <th class="col-rekomendasi">Rekomendasi Soal Terhadap CLO (Jika ada)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data['evaluasi'] ?? [] as $row)
                <tr>
                    <td class="col-asesmen">{{ $row['bentuk_asesmen'] ?? '-' }}</td>
                    <td class="col-clo">{{ $row['clo'] ?? '-' }}</td>
                    <td class="col-no">{{ $row['no_soal'] ?? '-' }}</td>
                    <td class="col-catatan">{{ $row['catatan_evaluasi'] ?? '-' }}</td>
                    <td class="col-rekomendasi">{{ $row['rekomendasi'] ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align: center; color: #777; padding: 10px;">
                        Tidak ada butir evaluasi.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- Pernyataan Hasil Evaluasi -->
    <div class="post-statement">
        Berdasarkan hasil evaluasi tersebut, maka soal asesmen <u>perlu diperbaiki sesuai/sudah sesuai</u>* dengan catatan di atas.<br>
        <span style="font-size: 8pt; color: #444;">*) Coret yang tidak perlu</span>
    </div>

    <!-- Area Tanda Tangan (3 Pihak) -->
    <div class="signature-container">
        <div class="date-line">
            {{ $data['kota'] ?? 'Bandung' }}, {{ $data['tanggal'] ?? now()->translatedFormat('d F Y') }}
        </div>
        <table class="table-ttd">
            <tr>
                <td>
                    <div class="ttd-role">Evaluator Soal,</div>
                    <div class="ttd-name">{{ $data['ttd']['evaluator_soal'] ?? $data['nama_evaluator'] ?? '(...................................)' }}</div>
                </td>
                <td>
                    <div class="ttd-role">Dosen Koordinator,</div>
                    <div class="ttd-name">{{ $data['ttd']['dosen_koordinator'] ?? $data['dosen_koordinator'] ?? '(...................................)' }}</div>
                </td>
                <td>
                    <div class="ttd-role">Ka. Prodi,</div>
                    <div class="ttd-name">{{ $data['ttd']['ka_prodi'] ?? '(...................................)' }}</div>
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
