# TECHNICAL SPECIFICATION
## Website Verifikator

**Version**: 1.1
**Status**: Updated — Mencerminkan implementasi aktual Phase 1–4 dan data akademik referensi
**Source**: (A) Audit teknis repository, (B) Notulensi/BR-01–13, (C) Use case diagram,
(D) PRD & User Flow, (E) Data akademik Prodi SI, (F) Legacy code CurriculumImportService

**Cara membaca dokumen ini**: Setiap keputusan ditandai salah satu dari tiga label:
- **`[EXISTING]`** — fakta dari audit atau kode yang sudah ada, dipertahankan.
- **`[IMPLEMENTED]`** — keputusan teknis yang sudah diimplementasikan di repository aktual.
- **`[REKOMENDASI]`** — keputusan/opini teknis yang diusulkan untuk menutup gap.

---

## 1. TECH STACK

### 1.1 Existing — Dipertahankan

| Layer | Teknologi | Status |
|-------|-----------|--------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS 4, React Router 7, React Query, Shadcn UI | `[EXISTING]` |
| Backend | Laravel 12, PHP 8.2, Laravel Sanctum | `[EXISTING]` |
| Database | SQLite (development) | `[IMPLEMENTED]` — dikonfirmasi dari konfigurasi aktual repository |

**Catatan database engine**: Repository greenfield menggunakan SQLite untuk development.
Untuk production deployment, PostgreSQL direkomendasikan (lihat Section 1.2). Jika MySQL
sudah terpasang di lingkungan produksi, **jangan migrasi**, pertahankan yang sudah ada.

### 1.2 Tambahan yang Direkomendasikan

| Kebutuhan | Rekomendasi | Alasan |
|-----------|--------------|--------|
| Database engine production | `[REKOMENDASI]` PostgreSQL | SQLite untuk development; PostgreSQL untuk production karena dukungan constraint dan concurrent access. |
| Job queue untuk generate PDF Berita Acara | `[REKOMENDASI]` Laravel Queue (database driver) | Generate PDF snapshot cenderung memakan waktu; menjalankannya sinkron di request cycle berisiko timeout. Deferred ke Phase 5. |
| Rate limiting | `[REKOMENDASI]` Laravel built-in `throttle` middleware | Sudah direkomendasikan di audit (S-02); tidak perlu tools eksternal. |

---

## 2. ARCHITECTURE

### 2.1 Pola — Dipertahankan dan Diterapkan

```
Route → Middleware → FormRequest → Controller → Service → Repository → Model → Database
```

`[IMPLEMENTED]`. Pola ini diterapkan pada seluruh modul yang sudah dibangun:
- KoordinatorAssignmentController
- PenugasanVerifikatorController
- SoalKategoriController
- SoalController
- CourseCloAssignmentController

### 2.2 Closure-Route — Status Penutupan

`[IMPLEMENTED]` Audit (Finding C-01) mencatat business logic di closure `routes/api.php`.
Status:
- Course-CLO assignment: **Dipindahkan** ke `CourseCloAssignmentController` dengan
  `FormRequest` (`exists:clos,id`) — menutup F-03, FN-01.
- Tidak ada closure business logic yang tersisa di `routes/api.php` pada state repository
  aktual (greenfield).

### 2.3 Frontend State Management — Semester-Aware

`[IMPLEMENTED]` Menggunakan **React Query** untuk data fetching per-semester (`useQuery`
dengan `semester_id` sebagai bagian dari query key). React Context belum diimplementasikan
untuk semester aktif — saat ini semester aktif ditentukan di backend via `SoalService::
getActiveSemesterId()`.

### 2.4 Master Data Management — Import Wizard

`[EXISTING]` dari legacy code (F): `CurriculumImportService` menyediakan:
- Template Excel generation per tipe data
- Parsing upload dengan validasi header fuzzy
- Import transaksional: Curriculum → Courses (dengan kategori) → PLOs → CLOs mapping
- Model: `Curriculum`, `Course`, `Plo`, `Clo`

Ini konsisten dengan BR-13 (data MK/PLO/CLO dianggap given dari OBE).

---

## 3. DATABASE DESIGN

### 3.1 Confirmed — Struktur Aktual dari Migrations

`[IMPLEMENTED]` — dikonfirmasi langsung dari migration files:

| Tabel | Kolom Kunci | Status |
|-------|-------------|--------|
| `users` | `id`, `name`, `email`, `password`, `role` (enum: superadmin/koordinator/verifikator) | Implemented |
| `semesters` | `id`, `name`, `start_date`, `end_date`, `is_active` | Implemented |
| `courses` | `id`, `code`, `name`, `semester_id` | Implemented |
| `plos` | `id`, `code`, `description` | Implemented |
| `clos` | `id`, `code`, `description`, `plo_id`, `course_id` | Implemented |
| `koordinator_assignments` | `id`, `course_id`, `user_id`, `semester_id`, `assigned_by` | Implemented |
| `penugasan_verifikator` | `id`, `course_id`, `user_id`, `semester_id` | Implemented |
| `soal_kategori` | `id`, `name` | Implemented |
| `soal` | `id`, `course_id`, `semester_id`, `soal_kategori_id`, `uploader_id`, `file_path`, `status`, `version`, `catatan` | Implemented |

### 3.2 Koordinator Assignment — `CONFIRMED`

~~`NEEDS CONFIRMATION`~~ → **`CONFIRMED`**

Tabel `koordinator_assignments` memiliki kolom `semester_id` dengan **unique constraint
pada `(course_id, semester_id)`**. Mengganti Koordinator (BR-04) dilakukan via `PUT`
endpoint yang meng-update `user_id` pada assignment existing.

### 3.3 Kategori Soal — `CONFIRMED`

~~`NEEDS CONFIRMATION`~~ → **`CONFIRMED`**

Tabel `soal_kategori` sudah ada dengan API CRUD lengkap (`SoalKategoriController`).

### 3.4 Soal — Status & Versioning

`[IMPLEMENTED]` Tabel `soal` memiliki:
- `status` enum: `SUBMITTED`, `APPROVED`, `REVISION`, `REJECTED`
- `version` integer (default 1, increment pada revisi)
- `catatan` text nullable (diisi oleh Verifikator)
- `file_path` — path ke file PDF yang disimpan di storage lokal

Relasi ke PLO **tidak langsung** (via CLO) — tidak ada kolom `plo_id` di tabel `soal`.

### 3.5 Tidak Direkomendasikan

`[REKOMENDASI]` Tidak menambahkan tabel terpisah untuk "status periode" atau "tahun
ajaran" jika representasinya sudah ada di tabel `semesters` (`is_active` flag).

---

## 4. API DESIGN

### 4.1 Endpoint yang Sudah Diimplementasikan

`[IMPLEMENTED]` — Seluruh endpoint di bawah ini sudah ada di `routes/api.php`:

**Authentication & User**
| Endpoint | Method | Middleware |
|----------|--------|------------|
| `/api/user` | GET | `auth:sanctum` |

**Koordinator Assignment (SuperAdmin)**
| Endpoint | Method | Keterangan |
|----------|--------|------------|
| `/api/koordinator-assignments` | GET | Daftar assignment |
| `/api/koordinator-assignments` | POST | Menunjuk Koordinator (BR-03) |
| `/api/koordinator-assignments/{id}` | PUT | Mengganti Koordinator (BR-04) |

**Verifikator Assignment (SuperAdmin)**
| Endpoint | Method | Keterangan |
|----------|--------|------------|
| `/api/penugasan-verifikator` | GET | Daftar penugasan |
| `/api/penugasan-verifikator` | POST | Menunjuk Verifikator (BR-05) |

**Soal Management & Verification (Phase 4)**
| Endpoint | Method | Actor | Keterangan |
|----------|--------|-------|------------|
| `/api/soal/template` | GET | Koordinator | Download template PDF |
| `/api/soal` | GET | Koordinator/Verifikator | Daftar soal (filtered by role & assignment) |
| `/api/soal` | POST | Koordinator | Upload soal baru |
| `/api/soal/{id}` | GET | Koordinator/Verifikator | Detail soal (authorized) |
| `/api/soal/{id}/download` | GET | Koordinator/Verifikator | Download file PDF |
| `/api/soal/{id}/verifikasi` | POST | Verifikator | Set status + catatan |
| `/api/soal/{id}/revisi` | POST | Koordinator | Upload revisi (when REVISION) |

**Kategori Soal (SuperAdmin)**
| Endpoint | Method | Keterangan |
|----------|--------|------------|
| `/api/soal-kategori` | GET | Daftar kategori |
| `/api/soal-kategori` | POST | Tambah kategori |
| `/api/soal-kategori/{id}` | PUT | Edit kategori |
| `/api/soal-kategori/{id}` | DELETE | Hapus kategori |

**Course-CLO Assignment (SuperAdmin)**
| Endpoint | Method | Keterangan |
|----------|--------|------------|
| `/api/courses/{courseId}/clo` | POST | Assign CLO ke Course (menutup C-01, F-03) |

### 4.2 Security — Status Remediation

| Finding | Status | Keterangan |
|---------|--------|------------|
| F-01: `/dev/switch-mode` tanpa middleware | `[REKOMENDASI]` Belum ditutup — endpoint ini tidak ada di greenfield repo | N/A untuk greenfield |
| F-02: `/penugasan-dosen` tanpa middleware | `[REKOMENDASI]` Belum ditutup — endpoint ini tidak ada di greenfield repo | N/A untuk greenfield |
| Soal endpoints authorization | `[IMPLEMENTED]` | `SoalPolicy` memastikan akses berdasarkan assignment |

---

## 5. FRONTEND ARCHITECTURE

### 5.1 Existing — Struktur Aktual Repository

`[IMPLEMENTED]` — Dikonfirmasi dari repository:

```
frontend/src/
├── pages/
│   ├── super-admin/
│   │   ├── MasterDataPage.tsx
│   │   ├── TahunAjaranPage.tsx
│   │   ├── KategoriSoalPage.tsx
│   │   └── PenugasanVerifikatorPage.tsx
│   ├── koordinator/
│   │   ├── UploadSoalPage.tsx
│   │   ├── TemplateSoalPage.tsx
│   │   └── StatusVerifikasiPage.tsx
│   └── verifikator/
│       └── VerifikasiSoalPage.tsx
│
├── components/
│   ├── master-data/       (CloForm, PloForm, MataKuliahForm, DosenForm)
│   ├── assignment/        (KoordinatorAssignmentForm, VerifikatorAssignmentForm, MataKuliahPicker)
│   ├── soal/              (SoalUploadForm, SoalRevisiForm)
│   ├── verifikasi/        (CatatanVerifikasiForm, BeritaAcaraPrintButton)
│   └── shared/            (RoleGuard)
│
├── hooks/
│   ├── useKoordinatorAssignment.ts
│   ├── useVerifikatorAssignment.ts
│   ├── useSoal.ts
│   └── useSemesterAktif.ts
│
├── api/
│   ├── koordinatorAssignment.ts
│   ├── verifikatorAssignment.ts
│   ├── soalKategori.ts
│   ├── soal.ts
│   └── axiosInstance.ts
│
├── types/
│   ├── Soal.ts
│   └── ...
│
├── contexts/
│   └── SemesterContext.tsx
│
└── App.tsx               (Route definitions)
```

Struktur menggunakan pembagian **per-role** (`super-admin/`, `koordinator/`, `verifikator/`)
konsisten dengan use case diagram.

### 5.2 Komponen — Status Implementasi

| Komponen | Status | Keterangan |
|----------|--------|------------|
| Role guard (`RoleGuard.tsx`) | `[REKOMENDASI]` Placeholder | Backend middleware sudah enforce; frontend guard belum sepenuhnya wired |
| `MataKuliahPicker.tsx` | `[IMPLEMENTED]` | Komponen reusable untuk include wajib "menentukan MK" |
| `SoalUploadForm.tsx` | `[IMPLEMENTED]` | Form upload dengan pilihan MK + Kategori |
| `CatatanVerifikasiForm.tsx` | `[IMPLEMENTED]` | Form verifikasi dengan status + catatan |
| `SoalRevisiForm.tsx` | `[IMPLEMENTED]` | Form upload revisi |
| `SemesterContext.tsx` | `[REKOMENDASI]` | Perlu diimplementasikan untuk semester-aware UI |

---

## 6. TESTING STRATEGY

### 6.1 Test Suites yang Sudah Ada

`[IMPLEMENTED]`:

| Suite | Test Count | Status |
|-------|-----------|--------|
| `SoalApiTest` | 5 tests, 11 assertions | ✅ Passing |
| `VerificationWorkflowTest` | 2 tests, 8 assertions | ✅ Passing |

Coverage area:
- Upload soal oleh Koordinator (valid + invalid cases)
- Role-based rejection (non-koordinator ditolak)
- Assignment-based rejection (MK yang tidak ditugaskan ditolak)
- File type validation (hanya PDF)
- Private file access verification
- Verification state transitions (SUBMITTED → APPROVED/REVISION/REJECTED)
- Revision workflow (REVISION → re-upload → SUBMITTED v2)

### 6.2 Rekomendasi — Testing Tambahan

| Area | Jenis Test | Prioritas |
|------|------------|-----------|
| Constraint unique `(course_id, semester_id)` pada assignments | Integration | High |
| Middleware role check pada seluruh endpoint | Authorization Test | High |
| Import wizard (CurriculumImportService) | Unit + Integration | Medium |
| Frontend component rendering | Unit (Vitest) | Medium |

---

## 7. DATA AKADEMIK REFERENSI

### 7.1 Skala Data Aktual

Berdasarkan data referensi Prodi S1 Sistem Informasi (E):

| Entitas | Jumlah | Keterangan |
|---------|--------|------------|
| Mata Kuliah | 52 | Semester 1–8, termasuk MK Pilihan dan MBKM |
| PLO | 10 | PLO01–PLO10 |
| CLO | 40+ | Pola kode: PLOxx-CLOyy |
| Dosen Tetap Prodi | 20 | JFA: NJFA/Asisten Ahli/Lektor |
| Dosen LB | 7–13 | Bervariasi per semester |
| Bloom Levels | 5 | Understand, Apply, Analyze, Evaluate, Create |

### 7.2 Implikasi untuk Seeder/Test Data

Data di atas dapat digunakan untuk membuat **seeder yang realistis** (bukan dummy data):
- 52 MK dengan kode dan nama asli
- 10 PLO dengan deskripsi asli
- CLO mapping yang akurat ke MK
- Dosen dengan kode 3-huruf unik

---

## 8. RINGKASAN STATUS IMPLEMENTASI

### Phase 1 — Foundation ✅
- Greenfield scaffold Laravel 12 + React 19

### Phase 2 — Database & Auth ✅
- Migrations, models, seeders
- RBAC (superadmin/koordinator/verifikator)
- Sanctum authentication

### Phase 3 — Assignment & Master Data ✅
- Koordinator Assignment CRUD
- Verifikator Assignment
- Kategori Soal CRUD
- Semester/Course/User APIs
- SuperAdmin frontend pages

### Phase 4 — Soal Management & Verification ✅
- Soal upload/download/template
- Verification workflow (Approve/Revision/Reject)
- Revision upload (version increment)
- Backend tests passing
- Frontend UI: UploadSoalPage, StatusVerifikasiPage, VerifikasiSoalPage, TemplateSoalPage

### Phase 5 — Berita Acara (DEFERRED)
- PDF generation via Laravel Queue
- BeritaAcaraPrintButton (placeholder exists)
- BR-09 enforcement