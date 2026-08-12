# VISION & SCOPE DOCUMENT
## Website Verifikator (Sistem Verifikasi Soal)

**Version**: 1.0
**Status**: Draft — Baseline dari Audit Teknis + Notulensi + Use Case Diagram Terbaru
**Source**: (A) Audit teknis repository existing, (B) Notulensi perbaikan Website Verifikator (BR-01–BR-13), (C) Use Case Diagram "Dashboard Verifikasi Soal" (terbaru, dibaca literal)

---

## 1. VISION

### 1.1 Problem Statement

Proses verifikasi soal ujian pada Program Studi Sistem Informasi saat ini memerlukan
digitalisasi menyeluruh — mencakup pengelolaan data akademik (Mata Kuliah, PLO, CLO),
penugasan dosen (Koordinator, Verifikator), pengunggahan soal, workflow verifikasi
bertingkat, dan pembuatan Berita Acara.

*Source: Notulensi Section 1, Audit Section 2 (App Overview).*

### 1.2 Vision Statement

`NEEDS CONFIRMATION` — tidak ada pernyataan visi jangka panjang (mis. tujuan strategis
program studi, target adopsi, atau dampak yang diharapkan di luar lingkup operasional)
yang eksplisit di sumber manapun. Vision statement formal (satu-dua kalimat "aplikasi ini
akan menjadi...") tidak tersedia di audit, notulensi, maupun use case diagram — ketiganya
bersifat deskriptif-operasional, bukan aspirational. Jangan mengarang vision statement;
isi bagian ini setelah dikonfirmasi oleh pemilik produk.

### 1.3 Target Users

Berdasarkan use case diagram (C), tiga aktor terkonfirmasi:

| Aktor (istilah diagram) | Istilah setara di notulensi (B) |
|---------------------------|-------------------------------------|
| SuperAdmin | Super Admin |
| Dosen Koordinator MK | Koordinator |
| Dosen Verifikator | Verifikator |

Catatan: diagram menggunakan label penuh ("Dosen Koordinator MK", "Dosen Verifikator"),
notulensi menggunakan label singkat ("Koordinator", "Verifikator"). Diperlakukan sebagai
role yang sama secara substansi kecuali dikonfirmasi sebaliknya — `NEEDS CONFIRMATION`
untuk memastikan ini bukan dua konsep berbeda (mis. apakah "Dosen Koordinator MK" adalah
subset dari role Koordinator yang lebih luas).

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
- BR-01: Relasi many-to-many Mata Kuliah↔CLO/PLO (struktur data, bukan use case aksi)
- BR-02, BR-04: Koordinator dapat berubah/diganti per semester (kemungkinan tercakup di
  dalam extension `dosen` pada "Mengelola master data", belum eksplisit sebagai use case
  bernama "Mengganti Koordinator" di diagram — `NEEDS CONFIRMATION`)
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
  "Mengelola master data" bekerja — lihat catatan di 2.3)

### 2.2 OUT OF SCOPE

- **Fitur Penetapan Nilai PLO** — BR-12 eksplisit menyatakan fitur ini tidak digunakan.
- **Proses penetapan baru untuk Mata Kuliah/PLO/CLO** dari nol — BR-13 menyatakan
  ketiganya dianggap sudah ditetapkan seperti sistem OBE. Ini berarti "Mengelola master
  data" pada use case diagram (yang extend ke `clo`, `plo`, `mata kuliah`) **tidak boleh
  diartikan sebagai "membuat CLO/PLO/Mata Kuliah baru dari nol"** — lihat catatan penting
  di Section 2.3.

### 2.3 CATATAN KRITIS — Potensi Konflik Sumber (bukan keputusan final)

Ditemukan satu titik yang berpotensi menjadi kontradiksi terbuka antara sumber (B) dan
sumber (C), yang **tidak diselesaikan secara sepihak di dokumen ini**:

- Use case diagram (C) menampilkan "Mengelola master data" sebagai use case milik
  SuperAdmin dengan extension point `clo`, `plo`, `mata kuliah`, `dosen` — secara literal,
  "mengelola" pada konvensi use case biasanya mencakup CRUD (create, read, update, delete).
- Notulensi (B), BR-13, eksplisit menyatakan: *"Mata Kuliah, PLO, dan CLO dianggap sudah
  ditetapkan seperti pada sistem OBE"* dan *"Website Verifikator tidak lagi menggunakan
  proses penetapan tersendiri untuk mata kuliah, PLO, dan CLO."*

Kedua pernyataan ini berpotensi bertentangan: apakah "Mengelola master data" untuk
CLO/PLO/Mata Kuliah berarti CRUD penuh (bertentangan dengan BR-13), atau hanya
read/sinkronisasi dari sistem OBE (konsisten dengan BR-13), atau CRUD penuh hanya untuk
`dosen` sementara CLO/PLO/Mata Kuliah di dalam use case yang sama bersifat read-only?

**Status: `NEEDS CONFIRMATION`. Dokumen ini tidak memutuskan salah satu interpretasi.**
Functional Requirements pada PRD (Section 7 dokumen PRD terpisah) akan menandai use case
ini dengan flag yang sama, dan detail behavior-nya harus dikonfirmasi sebelum development
dimulai — bukan diasumsikan berdasarkan konvensi umum kata "mengelola".

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

**Constraints** (dari audit teknis, Section A):
- Arsitektur backend wajib mengikuti pola existing: Route → Middleware → FormRequest →
  Controller → Service → Repository → Model.
- Tech stack existing wajib dipertahankan kecuali ada keputusan eksplisit untuk mengganti
  (lihat dokumen Tech Spec terpisah untuk opsi perubahan).

---
---

# PRODUCT REQUIREMENT DOCUMENT
## Website Verifikator

## 1. Document Information

| Field | Value |
|-------|-------|
| Product Name | Website Verifikator (Sistem Verifikasi Soal) |
| Version | 1.0 |
| Status | Draft |
| Source | Audit teknis repository (A), Notulensi perbaikan (B, BR-01–BR-13), Use Case Diagram terbaru (C) |
| Scope | Lihat Vision & Scope Document, Section 2 |
| Baseline | Existing system per audit teknis + requirement per notulensi dan use case diagram |

---

## 2. Product Overview

Website Verifikator mendigitalkan proses verifikasi soal ujian pada Program Studi Sistem
Informasi. Fungsi utama: pengelolaan data akademik (Mata Kuliah, PLO, CLO — sebagai data
given dari sistem OBE per BR-13), penugasan dosen (Koordinator dan Verifikator oleh Super
Admin), pengunggahan soal PDF beserta revisinya, workflow verifikasi soal, dan pembuatan
Berita Acara berbasis PDF snapshot.

Pengguna: SuperAdmin, Dosen Koordinator MK, Dosen Verifikator (lihat Vision & Scope
Section 1.3 untuk pemetaan istilah).

Konteks penggunaan: lingkungan akademik per-semester, dengan Koordinator yang dapat
berganti setiap semester (BR-02) dan periode soal yang mengikuti periode akademik
berjalan (BR-08).

*Source: (A) Section 2, (B) Section 1, (C) keseluruhan diagram.*

---

## 3. Product Goals

`NEEDS CONFIRMATION` — tidak ada product goals terukur (mis. "mengurangi waktu verifikasi
sebesar X%") di sumber manapun. Goals yang **dapat** diturunkan langsung dari requirement
(bukan diarang, murni parafrase dari BR dan use case):

- Mengganti proses manual penetapan Koordinator dengan mekanisme yang dapat diubah oleh
  Super Admin per semester (BR-02, BR-03, BR-04).
- Menghilangkan istilah PIC dari sistem, digantikan Verifikator (BR-06).
- Menyediakan jalur digital untuk unggah soal, revisi soal, dan verifikasi bertingkat
  (Approve/Revisi/Reject sesuai audit, atau "Memverifikasi Soal" dengan extension
  "Memberikan Catatan Verifikasi" sesuai diagram — lihat catatan konsistensi di Section 7).
- Menghasilkan Berita Acara secara otomatis dari hasil verifikasi, tanpa bergantung pada
  Dev Mode (BR-09).

---

## 4. Existing System

Lihat dokumen Audit Teknis dan `AGENTS.md` (Section 1–3, 7, 9, 10) untuk kondisi existing
lengkap. Ringkasan: Laravel 12 + React 19, pola MVC-Service-Repository, fully implemented
untuk Auth/Dosen Management/PLO-CLO CRUD/Soal Upload/Verifikasi/Berita Acara, partially
implemented untuk Course-CLO assignment (closure route, technical debt terdokumentasi).

---

## 5. Business Requirements

Lihat `AGENTS.md` Section 8 untuk tabel BR-01 s/d BR-13 lengkap (tidak diduplikasi di
sini untuk menghindari drift antar dokumen — `AGENTS.md` adalah rujukan tunggal untuk BR).

---

## 6. User Roles

| Role | Responsibility (dari sumber) | Akses (dari sumber) | Batasan Akses |
|------|-------------------------------|------------------------|------------------|
| **SuperAdmin** | Mengelola master data (CLO, PLO, mata kuliah, dosen — lihat catatan Section 2.3 Vision doc); mengelola tahun ajaran/periode; mengelola kategori soal; menentukan dosen verifikator (termasuk menentukan MK) | Akses ke seluruh use case bercabang dari aktor SuperAdmin pada diagram (C); kewenangan menunjuk/mengganti Koordinator dan menunjuk Verifikator (B, BR-03–05) | `NEEDS CONFIRMATION` — tidak ada pembatasan eksplisit yang disebutkan (mis. apakah SuperAdmin bisa langsung memverifikasi soal juga) |
| **Koordinator (Dosen Koordinator MK)** | Mengunduh template soal; mengunggah soal dan revisinya; melihat status verifikasi | Use case bercabang dari aktor "Dosen Koordinator MK" pada diagram (C); terikat mata kuliah yang menjadi tanggung jawabnya pada semester berjalan (B, Section 6) | Tidak disebutkan bisa melakukan verifikasi soal sendiri (soal tersebut ada di ranah Verifikator) — `NEEDS CONFIRMATION` untuk memastikan tidak ada overlap akses |
| **Verifikator (Dosen Verifikator)** | Memverifikasi soal; memberikan catatan verifikasi; mencetak berita acara | Use case bercabang dari aktor "Dosen Verifikator" pada diagram (C) | Tidak disebutkan bisa mengunggah soal sendiri — `NEEDS CONFIRMATION` |

Jangan mengarang permission yang tidak didukung sumber di atas.

---

## 7. Functional Requirements

| ID | Feature | Requirement | Actor | Priority | Source |
|----|---------|-------------|-------|----------|--------|
| FR-01 | Mengelola Master Data — CLO | Sistem menyediakan pengelolaan CLO sebagai extension dari "Mengelola master data" | SuperAdmin | TBD | (C); lihat flag konsistensi vs BR-13 di Vision Doc Section 2.3 |
| FR-02 | Mengelola Master Data — PLO | Sistem menyediakan pengelolaan PLO sebagai extension dari "Mengelola master data" | SuperAdmin | TBD | (C); lihat flag konsistensi vs BR-13 |
| FR-03 | Mengelola Master Data — Mata Kuliah | Sistem menyediakan pengelolaan Mata Kuliah sebagai extension dari "Mengelola master data" | SuperAdmin | TBD | (C); lihat flag konsistensi vs BR-13 |
| FR-04 | Mengelola Master Data — Dosen | Sistem menyediakan pengelolaan data Dosen sebagai extension dari "Mengelola master data" | SuperAdmin | TBD | (C) |
| FR-05 | Mengelola Tahun Ajaran | Sistem menyediakan pengelolaan tahun ajaran, dengan extension "mengubah status periode" (menonaktifkan Periode Verifikasi) | SuperAdmin | TBD | (C) |
| FR-06 | Periode Soal Mengikuti Periode Berjalan | Opsi periode soal (mis. UTS/UAS) hanya menampilkan periode yang sedang berlangsung, tidak menampilkan periode lain | SuperAdmin (pengelola), sistem (enforcement) | Must | (B) BR-08 — dinyatakan sebagai kebutuhan eksplisit, bukan opsional |
| FR-07 | Mengelola Kategori Soal | Sistem menyediakan pengelolaan kategori soal | SuperAdmin | TBD | (C) — tidak ada rujukan silang ke (A) atau (B) |
| FR-08 | Menentukan Dosen Verifikator | Super Admin dapat menentukan dosen sebagai Verifikator; proses ini secara wajib menyertakan (include) penentuan Mata Kuliah terkait | SuperAdmin | TBD | (C); konsisten dengan (B) BR-05 |
| FR-09 | Penetapan Koordinator | Super Admin dapat menunjuk Koordinator untuk suatu mata kuliah | SuperAdmin | Must | (B) BR-03 — dinyatakan eksplisit sebagai kebutuhan; representasi use case tersendiri di (C) `NEEDS CONFIRMATION` (lihat Vision Doc 2.1) |
| FR-10 | Pergantian Koordinator | Super Admin dapat mengganti Koordinator dari satu user ke user lain, dengan konteks semester berjalan | SuperAdmin | Must | (B) BR-02, BR-04 |
| FR-11 | Mengunduh Template Soal | Koordinator dapat mengunduh template soal | Koordinator | TBD | (C) |
| FR-12 | Mengunggah Soal | Koordinator dapat mengunggah soal PDF | Koordinator | Must | (A) — fully implemented existing; (C) — dikonfirmasi ulang sebagai use case aktif |
| FR-13 | Mengunggah Revisi Soal | Koordinator dapat mengunggah revisi soal, sebagai extension dari Mengunggah Soal | Koordinator | TBD | (C) |
| FR-14 | Melihat Status Verifikasi | Koordinator dapat melihat status verifikasi soal yang diunggahnya | Koordinator | TBD | (C) |
| FR-15 | Memverifikasi Soal | Verifikator dapat memverifikasi soal yang diunggah | Verifikator | Must | (A) — fully implemented existing (Approve/Revisi/Reject); (C) — direpresentasikan sebagai satu use case payung; lihat catatan Section 7.1 di bawah untuk potensi gap istilah |
| FR-16 | Memberikan Catatan Verifikasi | Verifikator dapat memberikan catatan sebagai extension dari Memverifikasi Soal | Verifikator | TBD | (C) |
| FR-17 | Mencetak Berita Acara | Verifikator dapat mencetak Berita Acara sebagai extension dari Memverifikasi Soal | Verifikator | TBD | (A), (C) |
| FR-18 | Berita Acara Tidak Bergantung Dev Mode | Akses terhadap Berita Acara tidak dipengaruhi status Dev Mode | Sistem (constraint) | Must | (B) BR-09 — dinyatakan eksplisit |
| FR-19 | Monitoring Semester Berjalan | Monitoring status upload kelas menggunakan konteks semester yang sedang berjalan | Sistem/SuperAdmin | Must | (B) BR-11 — dinyatakan eksplisit; tidak eksplisit di (C) |
| FR-20 | Penghapusan Info Chart | Kursor/info pada deskripsi chart dihapus dari tampilan dashboard | Sistem (UI) | Must | (B) BR-10 — dinyatakan eksplisit |

**Priority note**: Item bertanda `TBD` adalah use case yang tercantum eksplisit di diagram
(C) namun tidak punya pernyataan urgensi/prioritas di sumber manapun. Item bertanda `Must`
adalah requirement yang dinyatakan secara imperatif eksplisit di notulensi (B) atau
tergolong fitur yang sudah "fully implemented" dan dikonfirmasi ulang keberadaannya di (A).
Priority tidak ditentukan sembarangan sesuai instruksi sebelumnya.

### 7.1 Catatan Konsistensi — Approve/Revisi/Reject vs "Memverifikasi Soal"

Audit teknis (A) menyatakan workflow verifikasi memiliki tiga status eksplisit: Approve,
Revisi, Reject — masing-masing kemungkinan adalah aksi/state terpisah. Use case diagram
(C) merepresentasikan ini sebagai satu use case tunggal "Memverifikasi Soal" dengan dua
extension (Memberikan Catatan Verifikasi, mencetak berita acara) — tidak ada use case
terpisah bernama "Approve", "Revisi", atau "Reject".

**Ini bukan otomatis kontradiksi** — kemungkinan besar Approve/Revisi/Reject adalah pilihan
output/state di dalam satu use case "Memverifikasi Soal" (use case diagram tidak selalu
merinci sampai level pilihan status), dan "Memberikan Catatan Verifikasi" berkaitan erat
dengan alur Revisi/Reject. Namun karena tidak ada pernyataan eksplisit yang menyambungkan
keduanya, hubungan pastinya `NEEDS CONFIRMATION` — jangan diasumsikan otomatis identik.

---

## 8. Open Questions / Needs Confirmation (Ringkasan)

- Konsistensi "Mengelola master data" (CRUD penuh untuk CLO/PLO/Mata Kuliah) vs BR-13
  (data dianggap given dari OBE) — lihat Vision Doc Section 2.3. **Ini adalah item paling
  kritis untuk dikonfirmasi sebelum Functional Requirements FR-01–FR-03 difinalkan.**
- Apakah "Dosen Koordinator MK"/"Dosen Verifikator" (istilah diagram) identik dengan
  "Koordinator"/"Verifikator" (istilah notulensi), atau ada perbedaan cakupan.
- Apakah BR-03 (Penetapan Koordinator) dan BR-04 (Pergantian Koordinator) punya use case
  tersendiri yang belum tergambar eksplisit di diagram, atau tercakup di extension `dosen`
  pada "Mengelola master data".
  - Apakah BR-08 (periode soal) dan BR-11 (monitoring semester) punya use case tersendiri
  yang belum tergambar di diagram, atau tercakup di use case lain yang sudah ada.
- Hubungan pasti antara Approve/Revisi/Reject (audit) dan "Memverifikasi Soal" +
  extension-nya (diagram) — lihat Section 7.1.
- Vision statement formal, success criteria terukur, dan struktur stakeholder di luar
  tiga role pengguna — semuanya belum tersedia di sumber manapun (lihat Vision Doc Section
  1.2, 3, 4).