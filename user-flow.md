# USER FLOW
## Website Verifikator

**Version**: 1.1
**Source**: Use Case Diagram "Dashboard Verifikasi Soal" (C) — dibaca literal. Notulensi (B)
digunakan sebagai rujukan silang. Data akademik (D) dan legacy code (E) digunakan untuk
mengkonfirmasi detail flow yang sebelumnya `NEEDS CONFIRMATION`.

**Prinsip penyusunan**: setiap langkah pada flow di bawah ini hanya boleh mewakili use case,
extension point, atau relasi include/extend yang benar-benar tergambar di diagram. Jika
sebuah kebutuhan disebut di notulensi tapi tidak punya representasi use case di diagram,
flow tidak dibuat untuk kebutuhan itu — ditandai `FLOW NOT SPECIFIED IN SOURCE` di bagian
akhir dokumen ini.

---

## 1. SUPERADMIN FLOW

### 1.1 Overview — Percabangan dari Aktor SuperAdmin

**Konteks akses**: Hanya ada **1 akun SuperAdmin** (single role access) di dalam seluruh sistem.

Berdasarkan diagram, SuperAdmin punya 5 titik masuk (4 garis solid + 1 implisit dari BR):

```
SuperAdmin
   │
   ├── Mengelola master data
   ├── Mengelola tahun ajaran
   ├── Mengelola kategori soal
   ├── Menentukan dosen verifikator
   └── [Implisit dari BR-03/BR-04] Menunjuk/mengganti Koordinator
```

Tidak ada urutan wajib antar titik-titik ini yang tergambar di diagram — semuanya
independen dari sisi aktor.

### 1.2 Flow — Mengelola Master Data (Import Wizard)

```
Login sebagai SuperAdmin
   ↓
Buka menu "Mengelola master data"
   ↓
Pilih salah satu extension point:
   ├── clo    → Import bulk CLO & pemetaan ke MK dari file Excel
   ├── plo    → Import bulk PLO dari file Excel
   ├── mata kuliah → Import bulk Mata Kuliah dari file Excel
   └── dosen  → CRUD individual data dosen
   ↓
Lakukan pengelolaan pada entitas terpilih
```

**`CONFIRMED` (dari sumber E — CurriculumImportService)**:

"Mengelola master data" untuk CLO/PLO/Mata Kuliah dilakukan melalui **import wizard
berbasis Excel** (bukan CRUD per-item). Wizard terdiri dari 4 langkah:

1. **Import Mata Kuliah**: Upload file Excel dengan kolom Semester, Kode, Nama MK (INA),
   Nama MK (ENG), SKS. Sistem melakukan validasi header fuzzy dan validasi baris.
2. **Import Kategori MK**: Upload file Excel dengan kolom Kategori dan Nama Mata Kuliah
   (mis. MKWU, MKWP, MKPP).
3. **Import PLO**: Upload file Excel dengan kolom Kode PLO dan Deskripsi Program Learning
   Outcome.
4. **Import CLO & Pemetaan**: Upload file Excel dengan kolom PLO, Kode CLO, Deskripsi CLO,
   Bloom Level, dan Mata Kuliah. Satu CLO dapat dipetakan ke banyak MK (many-to-many).

Seluruh import berjalan dalam satu **DB transaction** — jika salah satu langkah gagal,
seluruh import di-rollback.

Interpretasi ini **konsisten dengan BR-13** ("data MK/PLO/CLO dianggap given dari OBE")
— data diimpor dari kurikulum yang sudah ditetapkan, bukan diciptakan dari nol di dalam
sistem verifikator.

Untuk **Dosen**, pengelolaan tetap berupa CRUD individual karena data dosen bukan data
OBE/kurikulum.

### 1.3 Flow — Mengelola Tahun Ajaran

```
Login sebagai SuperAdmin
   ↓
Buka menu "Mengelola tahun ajaran"
   ↓
[Opsional — extension] Ubah status periode
   ↓
   (extension point: Menonaktifkan Periode Verifikasi)
```

Diagram menampilkan satu extension point bernama "Menonaktifkan Periode Verifikasi" pada
use case "Mengelola tahun ajaran", terhubung juga dari use case terpisah "mengubah status
periode" via `<<Extend>>`. Detail lain dari "mengelola tahun ajaran" (mis. membuat tahun
ajaran baru) tidak dirinci di diagram — tidak ditambahkan ke flow ini.

### 1.4 Flow — Mengelola Kategori Soal

```
Login sebagai SuperAdmin
   ↓
Buka menu "Mengelola kategori soal"
   ↓
Lakukan pengelolaan kategori soal (CRUD: tambah/edit/hapus)
```

**`CONFIRMED`**: Tabel `soal_kategori` sudah ada dan API CRUD sudah diimplementasikan
(`GET/POST/PUT/DELETE /api/soal-kategori`).

### 1.5 Flow — Menentukan Dosen Verifikator

```
Login sebagai SuperAdmin
   ↓
Buka menu "Menentukan dosen verifikator"
   ↓
[WAJIB — include] Menentukan MK
   ↓
Pilih dosen yang akan ditugaskan sebagai Verifikator untuk MK terpilih
   ↓
Sistem menyimpan penugasan Verifikator (tabel penugasan_verifikator)
```

Ini satu-satunya relasi `<<Include>>` pada seluruh diagram — artinya "menentukan MK" bukan
langkah opsional, melainkan **bagian wajib** dari proses "menentukan dosen verifikator".
**`CONFIRMED`**: MK harus dipilih terlebih dahulu, baru dosen ditunjuk sebagai Verifikator
untuk MK tersebut.

### 1.6 Flow — Menunjuk/Mengganti Koordinator (dari BR-03/BR-04)

```
Login sebagai SuperAdmin
   ↓
Buka menu penugasan Koordinator
   ↓
Pilih Mata Kuliah dan Semester
   ↓
Pilih Dosen yang akan ditunjuk sebagai Koordinator
   ↓
Sistem menyimpan penugasan (tabel koordinator_assignments)
   ↓
[Opsional] Untuk mengganti: Update user_id pada assignment existing
   (constraint: unique per (course_id, semester_id))
```

**`CONFIRMED`**: Flow ini telah diimplementasikan melalui:
- `POST /api/koordinator-assignments` — menunjuk Koordinator baru
- `PUT /api/koordinator-assignments/{id}` — mengganti Koordinator
- Unique constraint `(course_id, semester_id)` memastikan hanya satu Koordinator per MK
  per semester

### 1.7 Ringkasan Diagram Alur SuperAdmin

```
Login
 ↓
┌─────────────────────────────────────────────────┐
│         (5 titik masuk independen)                │
├─────────────────────────────────────────────────┤
│ Mengelola master data                             │
│   └── extend: clo / plo / mata kuliah / dosen     │
│       (CLO/PLO/MK via import wizard;              │
│        Dosen via CRUD individual)                  │
│                                                    │
│ Mengelola tahun ajaran                             │
│   └── extend: mengubah status periode              │
│                                                    │
│ Mengelola kategori soal (CRUD)                     │
│                                                    │
│ Menentukan dosen verifikator                       │
│   └── include (wajib): menentukan MK               │
│                                                    │
│ Menunjuk/Mengganti Koordinator                     │
│   └── per MK per semester (BR-03/BR-04)            │
└─────────────────────────────────────────────────┘
```

---

## 2. KOORDINATOR FLOW (Dosen Koordinator MK)

### 2.1 Overview — Percabangan dari Aktor Dosen Koordinator MK

```
Dosen Koordinator MK
   │
   ├── Mengunduh Template Soal
   ├── Mengunggah Soal
   └── Melihat Status Verifikasi
```

**Konteks akses**: 
- **Maksimal 1 Koordinator per MK per semester**.
- Koordinator hanya dapat mengakses MK yang ditugaskan kepadanya pada semester aktif (via `koordinator_assignments`).

### 2.2 Flow — Mengunduh Template Soal

```
Login sebagai Dosen Koordinator MK
   ↓
Buka menu "Mengunduh Template Soal"
   ↓
Sistem menyediakan file template PDF untuk diunduh
```

**`CONFIRMED`**: Endpoint `GET /api/soal/template` sudah diimplementasikan. Hanya role
`koordinator` yang dapat mengakses.

### 2.3 Flow — Mengunggah Soal

```
Login sebagai Dosen Koordinator MK
   ↓
Buka menu "Mengunggah Soal"
   ↓
Pilih Mata Kuliah (dari daftar MK yang ditugaskan)
   ↓
Pilih Kategori Soal
   ↓
Upload file soal (PDF)
   ↓
Sistem menyimpan soal dengan status = SUBMITTED, version = 1
   ↓
[Opsional — extension] Mengunggah Revisi Soal
   (Trigger: status soal = REVISION setelah diverifikasi oleh Verifikator)
   ↓
   Upload file revisi → status kembali ke SUBMITTED, version + 1
```

**`CONFIRMED`**: Trigger untuk extension "Mengunggah Revisi Soal" adalah **status
verifikasi `REVISION`** dari Verifikator. Ketika Koordinator mengunggah revisi:
- `POST /api/soal/{id}/revisi` membuat record baru dengan `version` yang di-increment
- Status kembali ke `SUBMITTED` untuk diverifikasi ulang

### 2.4 Flow — Melihat Status Verifikasi

```
Login sebagai Dosen Koordinator MK
   ↓
Buka menu "Melihat Status Verifikasi"
   ↓
Sistem menampilkan daftar soal yang telah diunggah oleh Koordinator tersebut
   ↓
Untuk setiap soal: status (SUBMITTED/APPROVED/REVISION/REJECTED),
   versi, catatan verifikator, dan waktu terakhir update
```

**`CONFIRMED`**: Scope tampilan adalah **soal milik Koordinator tersebut pada semester
aktif** — difilter berdasarkan `uploader_id` dan semester aktif melalui
`GET /api/soal` dengan role-based filtering di backend.

### 2.5 Ringkasan Diagram Alur Koordinator

```
Login
 ↓
┌─────────────────────────────────────────────────┐
│ Mengunduh Template Soal                           │
│   → Download PDF template                         │
│                                                    │
│ Mengunggah Soal                                   │
│   → Pilih MK + Kategori + Upload PDF              │
│   └── extend: Mengunggah Revisi Soal              │
│       (trigger: status = REVISION)                 │
│                                                    │
│ Melihat Status Verifikasi                          │
│   → Tabel soal + status + catatan                  │
└─────────────────────────────────────────────────┘
```

---

## 3. VERIFIKATOR FLOW (Dosen Verifikator)

### 3.1 Overview — Percabangan dari Aktor Dosen Verifikator

Diagram menampilkan satu titik masuk tunggal dari aktor Dosen Verifikator:

```
Dosen Verifikator
   │
   └── Memverifikasi Soal
```

**Konteks akses**: 
- **Saat ini dibatasi hanya 1 orang Verifikator** untuk seluruh sistem (akan diupdate di masa depan).
- Verifikator hanya dapat mengakses soal untuk MK yang ditugaskan kepadanya (via `penugasan_verifikator`).

### 3.2 Flow — Memverifikasi Soal

```
Login sebagai Dosen Verifikator
   ↓
Buka menu "Memverifikasi Soal"
   ↓
Sistem menampilkan daftar soal yang perlu diverifikasi
   (soal dengan status SUBMITTED pada MK yang ditugaskan)
   ↓
Pilih soal untuk ditinjau
   ↓
Unduh/lihat dokumen soal PDF
   ↓
Tentukan status verifikasi:
   ├── APPROVED  — soal disetujui
   ├── REVISION  — soal perlu direvisi (trigger: Koordinator mengunggah ulang)
   └── REJECTED  — soal ditolak
   ↓
[Opsional — extension] Memberikan Catatan Verifikasi
   (catatan teks bebas, biasanya menyertai REVISION atau REJECTED)
   ↓
[Opsional — extension] mencetak berita acara
   (tersedia setelah status APPROVED — Deferred Phase 5)
```

**`CONFIRMED`** — status Approve/Revision/Reject adalah **tiga pilihan output** di dalam
use case "Memverifikasi Soal", bukan use case terpisah. Implementasi:
- `POST /api/soal/{id}/verifikasi` dengan body `{ status, catatan }`
- Status disimpan di field `status` tabel `soal`
- Catatan disimpan di field `catatan` tabel `soal`

### 3.3 Ringkasan Diagram Alur Verifikator

```
Login
 ↓
Memverifikasi Soal
   → Lihat daftar soal (MK yang ditugaskan)
   → Unduh/tinjau PDF
   → Pilih status: APPROVED / REVISION / REJECTED
   ├── extend: Memberikan Catatan Verifikasi
   └── extend: mencetak berita acara (Phase 5)
```

---

## 4. RELASI ANTAR-FLOW — STATUS KONFIRMASI

Keterkaitan logis antar flow (Koordinator ↔ Verifikator) yang sebelumnya tidak tergambar
eksplisit di diagram, kini **terkonfirmasi** dari implementasi backend:

- **`CONFIRMED`**: Hubungan antara hasil "Memverifikasi Soal" (Verifikator) dengan
  trigger "Mengunggah Revisi Soal" (Koordinator) — ketika Verifikator memberikan status
  `REVISION`, Koordinator dapat melihat status tersebut di "Melihat Status Verifikasi"
  dan mengunggah revisi melalui `POST /api/soal/{id}/revisi`.

- **`CONFIRMED`**: Hubungan antara "Melihat Status Verifikasi" (Koordinator) dengan
  output dari "Memverifikasi Soal" (Verifikator) — status yang dilihat Koordinator
  (`SUBMITTED`, `APPROVED`, `REVISION`, `REJECTED`) berasal dari keputusan Verifikator.

```
┌──────────────────────┐          ┌──────────────────────┐
│    KOORDINATOR       │          │    VERIFIKATOR       │
├──────────────────────┤          ├──────────────────────┤
│ Mengunggah Soal      │──────────│ Memverifikasi Soal   │
│   status: SUBMITTED  │  soal    │   output: APPROVED   │
│                      │──────▶   │           REVISION   │
│ Mengunggah Revisi    │◀─────── │           REJECTED   │
│   (jika REVISION)    │ status   │                      │
│                      │          │ Catatan Verifikasi   │
│ Melihat Status       │◀─────── │   (opsional)         │
│   Verifikasi         │ status   │                      │
└──────────────────────┘          └──────────────────────┘
```

---

## 5. FLOW NOT SPECIFIED IN SOURCE — STATUS UPDATE

Kebutuhan dari notulensi yang sebelumnya tidak punya representasi use case:

- ~~**BR-03/BR-04 (Penetapan/Pergantian Koordinator)**~~ → **`CONFIRMED & IMPLEMENTED`**:
  Diimplementasikan sebagai flow terpisah (Section 1.6) melalui
  `koordinator_assignments` dengan `semester_id`. Meskipun tidak ada use case bernama
  eksplisit di diagram, flow ini diperlukan oleh BR dan telah dibangun.

- **BR-08 (Periode soal mengikuti periode berjalan)** — kemungkinan bagian dari
  "Mengelola tahun ajaran" / "mengubah status periode". Detail mekanisme masih
  `NEEDS CONFIRMATION`.

- **BR-11 (Monitoring status upload kelas)** — tidak ada use case bernama "Monitoring"
  di diagram. Kemungkinan tercakup dalam "Melihat Status Verifikasi" (Koordinator).
  Masih `NEEDS CONFIRMATION`.

- **BR-10 (Penghapusan kursor/info pada deskripsi chart)** — UI adjustment, bukan user
  flow. Tidak relevan untuk direpresentasikan sebagai flow.

---

## 6. CATATAN PENUTUP

Seluruh flow pada dokumen ini adalah representasi langsung dari use case diagram (C),
diperkaya dengan konfirmasi dari implementasi backend yang sudah ada dan data akademik
referensi. Titik-titik yang masih ditandai `NEEDS CONFIRMATION` adalah area yang belum
dapat dikonfirmasi dari sumber yang tersedia saat ini.

Perubahan dari versi 1.0:
- Resolved: mekanisme "Mengelola master data" (import wizard, bukan CRUD individual)
- Resolved: trigger "Mengunggah Revisi Soal" (status = REVISION)
- Resolved: status output "Memverifikasi Soal" (APPROVED/REVISION/REJECTED)
- Resolved: relasi antar-flow Koordinator ↔ Verifikator
- Resolved: flow Penetapan/Pergantian Koordinator (BR-03/BR-04)
- Added: detail scope akses per role (semester + assignment)