# VISION & SCOPE DOCUMENT
## Website Verifikator (Sistem Verifikasi Soal)

**Version**: 1.1
**Status**: Updated — Diperkaya dengan data akademik aktual dari dokumen referensi Prodi SI
**Source**: (A) Audit teknis repository existing, (B) Notulensi perbaikan Website Verifikator (BR-01–BR-13), (C) Use Case Diagram "Dashboard Verifikasi Soal" (terbaru, dibaca literal), (D) Dokumen referensi akademik Prodi Sistem Informasi (Excel data MK, PLO, CLO, Dosen), (E) Legacy code `CurriculumImportService`

---

## 1. VISION

### 1.1 Problem Statement

Proses verifikasi soal ujian pada Program Studi S1 Sistem Informasi saat ini memerlukan
digitalisasi menyeluruh — mencakup pengelolaan data akademik (**52 mata kuliah** di 8
semester, **10 Program Learning Outcome (PLO)**, **40+ Course Learning Outcome (CLO)**
dengan pemetaan Bloom Taxonomy), penugasan **22+ dosen** (Koordinator dan Verifikator),
pengunggahan soal PDF, workflow verifikasi bertingkat, dan pembuatan Berita Acara.

Data akademik saat ini tersebar di beberapa file Excel terpisah (Mata Kuliah, PLO, CLO
Mapping, Dosen), dan proses pengelolaan menggunakan mekanisme import wizard berbasis
spreadsheet yang sudah ada di codebase legacy (`CurriculumImportService`).

*Source: Notulensi Section 1, Audit Section 2, (D) Excel referensi akademik.*

### 1.2 Vision Statement

`NEEDS CONFIRMATION` — tidak ada pernyataan visi jangka panjang (mis. tujuan strategis
program studi, target adopsi, atau dampak yang diharapkan di luar lingkup operasional)
yang eksplisit di sumber manapun. Vision statement formal (satu-dua kalimat "aplikasi ini
akan menjadi...") tidak tersedia di audit, notulensi, maupun use case diagram — ketiganya
bersifat deskriptif-operasional, bukan aspirational. Jangan mengarang vision statement;
isi bagian ini setelah dikonfirmasi oleh pemilik produk.

### 1.3 Target Users

Berdasarkan use case diagram (C), tiga aktor terkonfirmasi:

| Aktor (istilah diagram) | Istilah setara di notulensi (B) | Jumlah Potensial (D) |
|---------------------------|-------------------------------------|------------------------|
| SuperAdmin | Super Admin | 1–2 (admin prodi) |
| Dosen Koordinator MK | Koordinator | Sebagian dari 22+ dosen tetap prodi |
| Dosen Verifikator | Verifikator | Sebagian dari 22+ dosen tetap prodi |

**Data Dosen Aktual (D)**: Prodi S1 Sistem Informasi memiliki:
- **20 Dosen Tetap Prodi** dengan JFA: NJFA (11), Asisten Ahli (6), Lektor (3)
- **2 Dosen Tetap Pegawai** (non-prodi, mengajar MK umum)
- **7–13 Dosen Luar Biasa** (bervariasi per semester)
- Setiap dosen memiliki **Kode Dosen** unik (3 huruf, mis. QLB, SHC, DET)

Catatan: diagram menggunakan label penuh ("Dosen Koordinator MK", "Dosen Verifikator"),
notulensi menggunakan label singkat ("Koordinator", "Verifikator"). `CONFIRMED` —
keduanya merujuk pada role yang sama; "Dosen Koordinator MK" = dosen yang ditugaskan
sebagai Koordinator untuk mata kuliah tertentu.

---

## 2. SCOPE

### 2.1 IN SCOPE

Ditentukan sebagai gabungan dari: use case yang tercantum eksplisit di diagram (C), dan
business requirement yang tercantum eksplisit di notulensi (B). Sebuah item masuk IN SCOPE
jika muncul di salah satu atau kedua sumber tersebut.

**Dari Use Case Diagram (C):**

*SuperAdmin:*
- Mengelola master data (extension: CLO, PLO, mata kuliah, dosen)
- Mengelola tahun ajaran (extension: mengubah status periode / Menonaktifkan Periode Verifikasi)
- Mengelola kategori soal
- Menentukan dosen verifikator (include: menentukan MK)

*Dosen Koordinator MK:*
- Mengunduh Template Soal
- Mengunggah Soal (extension: Mengunggah Revisi Soal)
- Melihat Status Verifikasi

*Dosen Verifikator:*
- Memverifikasi Soal (extension: Memberikan Catatan Verifikasi, mencetak berita acara)

**Dari Notulensi (B) — BR yang belum eksplisit tercermin sebagai use case terpisah di
diagram, namun statusnya tetap requirement aktif:**
- BR-01: Relasi many-to-many Mata Kuliah↔CLO/PLO (struktur data, bukan use case aksi).
  `CONFIRMED` oleh data (D): satu CLO dapat memetakan ke banyak MK, dan satu MK memiliki
  banyak CLO dari PLO berbeda.
- BR-02, BR-04: Koordinator dapat berubah/diganti per semester. `CONFIRMED` — telah
  diimplementasikan melalui tabel `koordinator_assignments` dengan `semester_id` dan
  unique constraint `(course_id, semester_id)`.
- BR-06, BR-07: Terminologi dan struktur role (bukan use case aksi, tapi constraint sistem)
- BR-08: Periode soal mengikuti periode berjalan (kemungkinan bagian dari "Mengelola tahun
  ajaran" / "mengubah status periode" — `NEEDS CONFIRMATION`)
- BR-09: Dev Mode tidak memengaruhi akses Berita Acara (constraint, bukan use case)
- BR-10: Penghapusan kursor/info pada deskripsi chart (UI adjustment, tidak relevan ke
  use case diagram karena bukan use case aksi user)
- BR-11: Monitoring status upload kelas pakai semester berjalan (tidak muncul sebagai use
  case tersendiri di diagram — `NEEDS CONFIRMATION` apakah ini bagian dari "Melihat Status
  Verifikasi" atau use case terpisah yang belum tergambar)
- BR-12: Fitur penetapan nilai PLO tidak digunakan (exclusion — lihat 2.2)
- BR-13: Mata Kuliah/PLO/CLO dianggap given seperti OBE (constraint pada bagaimana
  "Mengelola master data" bekerja — lihat resolusi di 2.3)

### 2.2 OUT OF SCOPE

- **Fitur Penetapan Nilai PLO** — BR-12 eksplisit menyatakan fitur ini tidak digunakan.
- **Pembuatan Mata Kuliah/PLO/CLO secara individual dari nol** — BR-13 menyatakan
  ketiganya dianggap sudah ditetapkan seperti sistem OBE. `CONFIRMED` oleh legacy code
  (E): data master dikelola melalui **bulk Excel import wizard** (`CurriculumImportService`)
  yang mengimpor MK, Kategori, PLO, dan CLO mapping sekaligus dari file spreadsheet —
  bukan CRUD per-item.

### 2.3 RESOLUSI — Konflik "Mengelola Master Data" vs BR-13

**Status: `CONFIRMED`** — konflik ini telah diselesaikan berdasarkan bukti dari legacy
code (`CurriculumImportService` di sumber E):

- Use case diagram (C) menampilkan "Mengelola master data" dengan extension CLO, PLO,
  mata kuliah, dosen.
- BR-13 menyatakan data MK/PLO/CLO "dianggap given dari sistem OBE".
- Legacy code (E) membuktikan bahwa **mekanisme pengelolaan master data adalah bulk import
  via Excel wizard** — 4 langkah: (1) Import Mata Kuliah, (2) Import Kategori MK,
  (3) Import PLO, (4) Import CLO & Pemetaan ke MK.

**Interpretasi yang dikonfirmasi**: "Mengelola master data" pada use case diagram berarti:
- Untuk **CLO/PLO/Mata Kuliah**: Import bulk dari file Excel (bukan CRUD individual).
  Data dianggap given dari kurikulum OBE dan diimpor ke sistem.
- Untuk **Dosen**: CRUD individual tetap berlaku (dosen bukan data OBE).

Ini menghilangkan kontradiksi — BR-13 dan use case diagram konsisten jika "mengelola"
diartikan sebagai "mengimpor dan meninjau", bukan "membuat satu per satu".

### 2.4 RELATED BUT SEPARATE

Audit finding yang relevan dengan sistem tapi bukan requirement perubahan bisnis dari (B)
atau (C):

- F-01, F-02, F-03 (authorization & validation gaps)
- S-01, S-02, S-03 (security findings)
- C-01, C-02 (code quality — closure di routes)
- FN-01, FN-02 (transaction handling, pagination)
- P-01 (N+1 query)

Item-item ini adalah remediation teknis pada kode existing, bukan requirement fitur dari
notulensi atau use case diagram. Statusnya tetap seperti diklasifikasikan di dokumen
sebelumnya — tidak otomatis masuk IN SCOPE hanya karena disebut di audit.

*Source: Audit teknis Section 5–12.*

---

## 3. SUCCESS CRITERIA

`NEEDS CONFIRMATION` — tidak ada metrik keberhasilan (jumlah pengguna, waktu proses
verifikasi, target adopsi, dsb.) yang disebutkan di sumber manapun. Jangan mengarang
angka atau target; isi setelah dikonfirmasi pemilik produk.

---

## 4. STAKEHOLDERS

`NEEDS CONFIRMATION` — sumber tidak menyebutkan struktur stakeholder di luar tiga role
pengguna (SuperAdmin, Koordinator, Verifikator) yang sudah tercatat sebagai Target Users
di Section 1.3. Tidak ada informasi soal product owner, sponsor, atau pihak akademik lain
yang terlibat dalam pengambilan keputusan produk.

---

## 5. ASSUMPTIONS & CONSTRAINTS

**Assumptions** (tidak dinyatakan eksplisit di sumber, tapi diperlukan sebagai baseline
kerja — ditandai jelas sebagai asumsi, bukan fakta):
- Diasumsikan use case diagram (C) merepresentasikan kondisi target/requirement terbaru,
  menggantikan bagian manapun dari notulensi (B) yang mungkin sudah berubah — namun karena
  tidak ada pernyataan eksplisit soal ini, potensi konflik tetap dicatat di Section 2.3,
  bukan diselesaikan dengan asumsi "yang terbaru selalu menang".
- Diasumsikan data dari file Excel referensi (D) merepresentasikan kurikulum aktif yang
  akan digunakan pada sistem — 52 MK, 10 PLO, 40+ CLO.

**Constraints** (dari audit teknis, Section A):
- Arsitektur backend wajib mengikuti pola existing: Route → Middleware → FormRequest →
  Controller → Service → Repository → Model.
- Tech stack existing wajib dipertahankan kecuali ada keputusan eksplisit untuk mengganti
  (lihat dokumen Tech Spec terpisah untuk opsi perubahan).
- Data master MK/PLO/CLO dikelola melalui bulk import (bukan CRUD individual) — konsisten
  dengan BR-13 dan `CurriculumImportService` existing.

---
---

# PRODUCT REQUIREMENT DOCUMENT
## Website Verifikator

## 1. Document Information

| Field | Value |
|-------|-------|
| Product Name | Website Verifikator (Sistem Verifikasi Soal) |
| Version | 1.1 |
| Status | Updated |
| Source | Audit teknis repository (A), Notulensi perbaikan (B, BR-01–BR-13), Use Case Diagram terbaru (C), Data akademik Prodi SI (D), Legacy code CurriculumImportService (E) |
| Scope | Lihat Vision & Scope Document, Section 2 |
| Baseline | Existing system per audit teknis + requirement per notulensi dan use case diagram + data akademik aktual |

---

## 2. Product Overview

Website Verifikator mendigitalkan proses verifikasi soal ujian pada Program Studi S1
Sistem Informasi. Fungsi utama:

- **Pengelolaan data akademik**: 52 Mata Kuliah (semester 1–8), 10 PLO, 40+ CLO — diimpor
  secara bulk dari file Excel melalui import wizard (konsisten dengan BR-13, data given
  dari kurikulum OBE).
- **Pengelolaan data dosen**: 22+ dosen tetap prodi dengan kode unik, ditambah dosen LB
  per semester.
- **Penugasan dosen**: Koordinator (per MK per semester, dapat diganti — BR-02/BR-04) dan
  Verifikator (ditunjuk SuperAdmin — BR-05).
- **Workflow soal**: Upload soal PDF → Verifikasi (Approve/Revision/Reject) → Revisi →
  Berita Acara.

Pengguna: SuperAdmin, Dosen Koordinator MK, Dosen Verifikator (lihat Vision & Scope
Section 1.3 untuk pemetaan istilah).

Konteks penggunaan: lingkungan akademik per-semester, dengan Koordinator yang dapat
berganti setiap semester (BR-02) dan periode soal yang mengikuti periode akademik
berjalan (BR-08).

*Source: (A) Section 2, (B) Section 1, (C) keseluruhan diagram, (D) data Excel.*

---

## 3. Product Goals

`NEEDS CONFIRMATION` — tidak ada product goals terukur (mis. "mengurangi waktu verifikasi
sebesar X%") di sumber manapun. Goals yang **dapat** diturunkan langsung dari requirement
(bukan diarang, murni parafrase dari BR dan use case):

- Mengganti proses manual penetapan Koordinator dengan mekanisme yang dapat diubah oleh
  Super Admin per semester (BR-02, BR-03, BR-04).
- Menghilangkan istilah PIC dari sistem, digantikan Verifikator (BR-06).
- Menyediakan jalur digital untuk unggah soal, revisi soal, dan verifikasi bertingkat
  (Approve/Revisi/Reject — `CONFIRMED` sebagai tiga status output di dalam use case
  "Memverifikasi Soal").
- Menghasilkan Berita Acara secara otomatis dari hasil verifikasi, tanpa bergantung pada
  Dev Mode (BR-09).
- Mengelola data akademik (MK, PLO, CLO) secara bulk import dari spreadsheet kurikulum
  OBE, bukan entry manual per-item (BR-13).

---

## 4. Existing System

Lihat dokumen Audit Teknis dan `AGENTS.md` (Section 1–3, 7, 9, 10) untuk kondisi existing
lengkap. Ringkasan: Laravel 12 + React 19, pola MVC-Service-Repository, fully implemented
untuk Auth/Dosen Management/PLO-CLO CRUD/Soal Upload/Verifikasi/Berita Acara, partially
implemented untuk Course-CLO assignment (closure route, technical debt terdokumentasi).

**Legacy Import Mechanism (E)**: `CurriculumImportService` sudah ada di codebase dengan
kemampuan:
- Generate template Excel per tipe data (courses, categories, PLOs, CLOs mapping)
- Parse upload Excel dengan validasi header fuzzy dan validasi baris
- Import transaksional: Curriculum → Courses → PLOs → CLOs dengan mapping ke MK
- Model terkait: `Curriculum`, `Course`, `Plo`, `Clo`

---

## 5. Business Requirements

Lihat `AGENTS.md` Section 8 untuk tabel BR-01 s/d BR-13 lengkap (tidak diduplikasi di
sini untuk menghindari drift antar dokumen — `AGENTS.md` adalah rujukan tunggal untuk BR).

---

## 6. User Roles

| Role | Responsibility (dari sumber) | Akses (dari sumber) | Batasan Akses |
|------|-------------------------------|------------------------|------------------|
| **SuperAdmin** | Mengelola master data (CLO, PLO, mata kuliah via import wizard — lihat resolusi Section 2.3 Vision doc; dosen via CRUD); mengelola tahun ajaran/periode; mengelola kategori soal; menentukan dosen verifikator (termasuk menentukan MK); menunjuk/mengganti Koordinator per semester | Akses ke seluruh use case bercabang dari aktor SuperAdmin pada diagram (C); kewenangan menunjuk/mengganti Koordinator dan menunjuk Verifikator (B, BR-03–05) | `NEEDS CONFIRMATION` — tidak ada pembatasan eksplisit yang disebutkan (mis. apakah SuperAdmin bisa langsung memverifikasi soal juga) |
| **Koordinator (Dosen Koordinator MK)** | Mengunduh template soal; mengunggah soal dan revisinya; melihat status verifikasi | Use case bercabang dari aktor "Dosen Koordinator MK" pada diagram (C); terikat mata kuliah yang menjadi tanggung jawabnya pada semester berjalan (B, Section 6) | Hanya dapat mengakses soal untuk MK yang ditugaskan padanya di semester aktif — `CONFIRMED` dari implementasi `SoalPolicy` |
| **Verifikator (Dosen Verifikator)** | Memverifikasi soal (Approve/Revision/Reject); memberikan catatan verifikasi; mencetak berita acara | Use case bercabang dari aktor "Dosen Verifikator" pada diagram (C); terikat ke MK yang ditugaskan via `penugasan_verifikator` | Hanya dapat memverifikasi soal untuk MK yang ditugaskan — `CONFIRMED` dari implementasi `SoalPolicy` |

Jangan mengarang permission yang tidak didukung sumber di atas.

---

## 7. Functional Requirements

| ID | Feature | Requirement | Actor | Priority | Source | Status |
|----|---------|-------------|-------|----------|--------|--------|
| FR-01 | Mengelola Master Data — CLO | Sistem menyediakan import bulk CLO dari file Excel sebagai bagian dari import wizard kurikulum | SuperAdmin | Must | (C), (E) CurriculumImportService; `CONFIRMED` bukan CRUD individual per BR-13 | Implemented (legacy) |
| FR-02 | Mengelola Master Data — PLO | Sistem menyediakan import bulk PLO dari file Excel sebagai bagian dari import wizard kurikulum | SuperAdmin | Must | (C), (E); `CONFIRMED` bukan CRUD individual per BR-13 | Implemented (legacy) |
| FR-03 | Mengelola Master Data — Mata Kuliah | Sistem menyediakan import bulk Mata Kuliah dari file Excel, termasuk mapping kategori | SuperAdmin | Must | (C), (E); `CONFIRMED` bukan CRUD individual per BR-13 | Implemented (legacy) |
| FR-04 | Mengelola Master Data — Dosen | Sistem menyediakan pengelolaan data Dosen (CRUD individual) | SuperAdmin | TBD | (C) | Implemented |
| FR-05 | Mengelola Tahun Ajaran | Sistem menyediakan pengelolaan tahun ajaran, dengan extension "mengubah status periode" (menonaktifkan Periode Verifikasi) | SuperAdmin | TBD | (C) | Partial |
| FR-06 | Periode Soal Mengikuti Periode Berjalan | Opsi periode soal hanya menampilkan periode yang sedang berlangsung | SuperAdmin, Sistem | Must | (B) BR-08 | Partial |
| FR-07 | Mengelola Kategori Soal | Sistem menyediakan pengelolaan kategori soal (CRUD) | SuperAdmin | Must | (C) | `CONFIRMED` — tabel `soal_kategori` dan API sudah ada |
| FR-08 | Menentukan Dosen Verifikator | Super Admin dapat menentukan dosen sebagai Verifikator; include wajib: menentukan MK terkait | SuperAdmin | Must | (C); BR-05 | Implemented |
| FR-09 | Penetapan Koordinator | Super Admin dapat menunjuk Koordinator untuk suatu mata kuliah pada semester tertentu | SuperAdmin | Must | (B) BR-03 | `CONFIRMED` — implemented via `koordinator_assignments` |
| FR-10 | Pergantian Koordinator | Super Admin dapat mengganti Koordinator dari satu user ke user lain, dengan konteks semester berjalan | SuperAdmin | Must | (B) BR-02, BR-04 | `CONFIRMED` — implemented via PUT endpoint |
| FR-11 | Mengunduh Template Soal | Koordinator dapat mengunduh template soal | Koordinator | Must | (C) | Implemented |
| FR-12 | Mengunggah Soal | Koordinator dapat mengunggah soal PDF | Koordinator | Must | (A), (C) | Implemented |
| FR-13 | Mengunggah Revisi Soal | Koordinator dapat mengunggah revisi soal ketika status verifikasi = REVISION | Koordinator | Must | (C); trigger `CONFIRMED` dari implementasi | Implemented |
| FR-14 | Melihat Status Verifikasi | Koordinator dapat melihat status verifikasi soal yang diunggahnya pada semester aktif | Koordinator | Must | (C) | Implemented |
| FR-15 | Memverifikasi Soal | Verifikator dapat memverifikasi soal dengan output: APPROVED, REVISION, atau REJECTED | Verifikator | Must | (A), (C); status `CONFIRMED` | Implemented |
| FR-16 | Memberikan Catatan Verifikasi | Verifikator dapat memberikan catatan sebagai extension dari Memverifikasi Soal | Verifikator | Must | (C) | Implemented |
| FR-17 | Mencetak Berita Acara | Verifikator dapat mencetak Berita Acara sebagai extension dari Memverifikasi Soal | Verifikator | TBD | (A), (C) | Deferred Phase 5 |
| FR-18 | Berita Acara Tidak Bergantung Dev Mode | Akses terhadap Berita Acara tidak dipengaruhi status Dev Mode | Sistem | Must | (B) BR-09 | Deferred Phase 5 |
| FR-19 | Monitoring Semester Berjalan | Monitoring status upload kelas menggunakan konteks semester yang sedang berjalan | Sistem/SuperAdmin | Must | (B) BR-11 | Partial |
| FR-20 | Penghapusan Info Chart | Kursor/info pada deskripsi chart dihapus dari tampilan dashboard | Sistem (UI) | Must | (B) BR-10 | TBD |
| FR-21 | Import Kurikulum via Wizard | SuperAdmin dapat mengimpor data kurikulum (MK, Kategori, PLO, CLO mapping) secara bulk dari file Excel | SuperAdmin | Must | (E) CurriculumImportService; konsisten BR-13 | Implemented (legacy) |

### 7.1 Catatan Konsistensi — Approve/Revisi/Reject vs "Memverifikasi Soal"

**Status: `CONFIRMED`** — berdasarkan implementasi backend yang sudah ada:

Approve, Revision, dan Reject adalah **tiga status output** di dalam use case tunggal
"Memverifikasi Soal". "Memberikan Catatan Verifikasi" adalah extension opsional yang
dapat diberikan bersama dengan status apapun (terutama Revision dan Reject).

Implementasi backend menggunakan field `status` pada tabel `soal` dengan enum:
`SUBMITTED`, `APPROVED`, `REVISION`, `REJECTED`. Verifikator mengirimkan status beserta
catatan opsional melalui endpoint `POST /api/soal/{id}/verifikasi`.

---

## 8. Data Akademik Referensi (dari Sumber D)

### 8.1 Mata Kuliah — 52 MK, Semester 1–8

| Semester | Jumlah MK | Contoh |
|----------|-----------|--------|
| 1 | 7 | Algoritma dan Pemrograman, Matematika Diskrit, Pengantar SI |
| 2 | 7 | Design Thinking, Jaringan Komputer, PBO, Sistem Basis Data |
| 3 | 7 | APSI, Pemodelan Proses Bisnis, Pengembangan Aplikasi Website |
| 4 | 7 | Integrasi Aplikasi Enterprise, Keamanan SI, Manajemen Proyek SI |
| 5 | 7 | Arsitektur Enterprise, DW & BI, Komputasi Awan, Proyek PL |
| 6 | 7 | Kecerdasan Artifisial, Tata Kelola TI, Kerja Praktek |
| 7 | 6 | Capstone Project, Metode Penelitian, 3 MK Pilihan |
| 8 | 4 | Tugas Akhir, Pelatihan dan Sertifikasi |

Kode MK menggunakan pola: `BBKxyyyz` (contoh: BBK1AAB4 = Algoritma dan Pemrograman, 4 SKS).
Kolom "Basis Evaluasi" pada beberapa MK: AP (Assessment Project), HP (Hands-on Project).

### 8.2 PLO — 10 Program Learning Outcomes

PLO01–PLO10 mencakup: pemikiran logis/kritis, pengembangan solusi SI, kolaborasi tim,
etika profesi, komunikasi, tanggung jawab sosial, profesionalisme, manajemen SI,
enterprise architecture, dan technopreneurship.

### 8.3 CLO Mapping

- Pola kode: `PLOxx-CLOyy` (contoh: PLO02-CLO02)
- Bloom levels: 2-Understand, 3-Apply, 4-Analyze, 5-Evaluate, 6-Create
- Relasi many-to-many: satu CLO dapat dipetakan ke banyak MK

### 8.4 Dosen

- 20 Dosen Tetap Prodi SI
- Distribusi JFA: NJFA (11), Asisten Ahli (6), Lektor (3)
- Kelompok Keahlian utama: Digital Enterprise System And Technology (DIGEST)
- 7–13 Dosen Luar Biasa per semester (bervariasi)

---

## 9. Open Questions / Needs Confirmation (Ringkasan)

- ~~Konsistensi "Mengelola master data" vs BR-13~~ → **`CONFIRMED`** (lihat Section 2.3):
  master data dikelola via bulk import wizard, bukan CRUD individual.
- ~~Apakah "Dosen Koordinator MK"/"Dosen Verifikator" identik dengan "Koordinator"/
  "Verifikator"~~ → **`CONFIRMED`**: istilah identik.
- ~~Apakah BR-03/BR-04 punya use case tersendiri~~ → **`CONFIRMED`**: diimplementasikan
  sebagai `koordinator_assignments` dengan `semester_id`.
- ~~Hubungan Approve/Revisi/Reject vs "Memverifikasi Soal"~~ → **`CONFIRMED`** (lihat
  Section 7.1): tiga status output dalam satu use case.
- Apakah BR-08 (periode soal) dan BR-11 (monitoring semester) punya use case tersendiri
  yang belum tergambar di diagram, atau tercakup di use case lain yang sudah ada —
  **masih `NEEDS CONFIRMATION`**.
- Vision statement formal, success criteria terukur, dan struktur stakeholder di luar
  tiga role pengguna — semuanya belum tersedia di sumber manapun (lihat Vision Doc Section
  1.2, 3, 4) — **masih `NEEDS CONFIRMATION`**.