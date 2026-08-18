<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Lembar Soal - {{ $data['kode_nama_mk'] ?? 'Ujian' }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9.5pt;
            line-height: 1.25;
            color: #000000;
            margin: 0;
            padding: 0;
        }

        /* ── TOP OUTSIDE FORM NO ── */
        .form-no-top {
            font-size: 8.5pt;
            color: #555555;
            margin-bottom: 6px;
            font-weight: normal;
        }

        /* ── UNIFIED MAIN HEADER TABLE ── */
        .table-main-header {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000;
            margin-bottom: 8px;
        }

        .table-main-header td, .table-main-header th {
            border: 1px solid #000;
            padding: 4px 6px;
            vertical-align: middle;
            font-size: 9pt;
        }

        .logo-box {
            width: 22%;
            text-align: center;
            vertical-align: middle;
            border: 1.5px solid #000;
            padding: 8px;
            background-color: #ffffff;
        }

        .logo-img {
            max-height: 48px;
            max-width: 140px;
        }

        .title-header-cell {
            text-align: center;
            font-size: 13pt;
            font-weight: bold;
            letter-spacing: 0.5px;
            padding: 6px 0;
            border: 1px solid #000;
        }

        .meta-field-label {
            font-size: 8.5pt;
            width: 16%;
        }

        .meta-field-val {
            font-size: 8.5pt;
            width: 32%;
        }

        /* ── 2-COLUMN SECTION (PETUNJUK & PLO) ── */
        .table-section-box {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000;
            margin-bottom: 8px;
            font-size: 9pt;
        }

        .table-section-box td {
            border: 1px solid #000;
            padding: 5px 8px;
            vertical-align: top;
        }

        .section-label-col {
            width: 18%;
            font-size: 8.5pt;
            font-weight: normal;
            line-height: 1.2;
        }

        .section-content-col {
            width: 82%;
            font-size: 9pt;
            line-height: 1.3;
        }

        /* ── CLO TABLE ── */
        .table-clo-header {
            width: 100%;
            border-collapse: collapse;
            border: 1.5px solid #000;
            font-size: 8.5pt;
            margin-bottom: 0px;
        }

        .table-clo-header th, .table-clo-header td {
            border: 1px solid #000;
            padding: 4px 6px;
            vertical-align: middle;
        }

        .clo-code-col {
            width: 10%;
            text-align: center;
            font-weight: normal;
        }

        .clo-desc-col {
            width: 78%;
            text-align: left;
        }

        .clo-weight-col {
            width: 12%;
            text-align: center;
        }

        /* ── AREA SOAL BOX ── */
        .clo-unit-container {
            page-break-inside: avoid;
            margin-bottom: 10px;
        }

        .soal-box-container {
            width: 100%;
            border-left: 1.5px solid #000;
            border-right: 1.5px solid #000;
            border-bottom: 1.5px solid #000;
            border-top: none;
            min-height: 180px;
            padding: 12px;
            background-color: #ffffff;
            text-align: center;
        }

        .soal-lo-badge {
            display: inline-block;
            background-color: #ffff00;
            color: #000000;
            font-weight: bold;
            font-size: 9.5pt;
            padding: 2px 10px;
            margin-bottom: 12px;
        }

        .soal-content-text {
            text-align: left;
            font-size: 9.5pt;
            line-height: 1.4;
            color: #000000;
        }
    </style>
</head>
<body>

    <!-- TOP OUTSIDE FORM NO -->
    <div class="form-no-top">
        Form No : {{ $data['form_no'] ?? '100-S1SI-001-R1' }}
    </div>

    <!-- 1. UNIFIED MAIN HEADER TABLE -->
    <table class="table-main-header">
        <tr>
            <!-- Logo Cell spanning all 4 rows -->
            <td rowspan="4" class="logo-box">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" class="logo-img" alt="Telkom University" />
                @else
                    <div style="font-weight: bold; font-size: 11pt; color: #b91c1c;">
                        Telkom<br><span style="color:#333; font-size: 8.5pt;">University</span>
                    </div>
                @endif
            </td>
            <!-- Top Title spanning 4 meta columns -->
            <td colspan="4" class="title-header-cell">
                LEMBAR SOAL
            </td>
        </tr>
        <tr>
            <td class="meta-field-label">Nama Evaluasi</td>
            <td class="meta-field-val">{{ $data['nama_evaluasi'] }}</td>
            <td class="meta-field-label">Kode dosen</td>
            <td class="meta-field-val">{{ $data['kode_dosen'] }}</td>
        </tr>
        <tr>
            <td class="meta-field-label">Kode/Nama MK</td>
            <td class="meta-field-val">{{ $data['kode_nama_mk'] }}</td>
            <td class="meta-field-label">Tipe Ujian</td>
            <td class="meta-field-val">{{ $data['tipe_ujian'] }}</td>
        </tr>
        <tr>
            <td class="meta-field-label">Tanggal Evaluasi</td>
            <td class="meta-field-val">{{ $data['tanggal_evaluasi'] }}</td>
            <td class="meta-field-label">Tipe Soal</td>
            <td class="meta-field-val">{{ $data['tipe_soal'] }}</td>
        </tr>
    </table>

    <!-- 2. PETUNJUK PENGERJAAN -->
    <table class="table-section-box">
        <tr>
            <td class="section-label-col">
                Petunjuk<br>Pengerjaan
            </td>
            <td class="section-content-col">
                @foreach($data['petunjuk_pengerjaan'] as $idx => $petunjuk)
                    <div>({{ $idx + 1 }}) {{ $petunjuk }}</div>
                @endforeach
            </td>
        </tr>
    </table>

    <!-- 3. HIERARKI PLO → CLO → AREA SOAL -->
    @php
        $globalSoalNumber = 1;
    @endphp

    @foreach($data['plo'] as $plo)
        <!-- PLO Box -->
        <table class="table-section-box">
            <tr>
                <td class="section-label-col">
                    Program<br>Learning<br>Outcomes
                </td>
                <td class="section-content-col">
                    {{ $plo['kode'] }} – {{ $plo['deskripsi'] }}
                </td>
            </tr>
        </table>

        <!-- Loop CLO di dalam PLO ini (Setiap CLO = 1 Area Soal Terpisah) -->
        @if(!empty($plo['clo']) && is_array($plo['clo']))
            @foreach($plo['clo'] as $clo)
                <div class="clo-unit-container">
                    <!-- Table CLO Header & Row -->
                    <table class="table-clo-header">
                        <thead>
                            <tr>
                                <th colspan="2" style="text-align: left; font-weight: normal; width: 88%;">
                                    Course Learning outcomes
                                </th>
                                <th class="clo-weight-col" style="font-weight: normal;">
                                    Bobot LO
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="clo-code-col">
                                    {{ $clo['kode'] }}
                                </td>
                                <td class="clo-desc-col">
                                    {{ $clo['deskripsi'] }}
                                </td>
                                <td class="clo-weight-col">
                                    {{ $clo['bobot_lo'] ?? '?? %' }}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Area Soal Box (Kotak Terpisah Khusus CLO ini) -->
                    <div class="soal-box-container">
                        <!-- Yellow Highlight Badge -->
                        <div>
                            <span class="soal-lo-badge">Soal LO{{ $globalSoalNumber }}</span>
                        </div>

                        @if(!empty($clo['soal_text']))
                            <div class="soal-content-text">
                                {!! nl2br(e($clo['soal_text'])) !!}
                            </div>
                        @endif
                    </div>
                </div>

                @php
                    $globalSoalNumber++;
                @endphp
            @endforeach
        @endif
    @endforeach

</body>
</html>
