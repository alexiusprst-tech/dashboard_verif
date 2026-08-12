# TECHNICAL SPECIFICATION
## Website Verifikator

**Version**: 1.0
**Status**: Draft — Rekomendasi teknis final per keputusan (bukan daftar opsi)
**Source**: (A) Audit teknis repository, (B) Notulensi/BR-01–13, (C) Use case diagram, (D) PRD & User Flow (dokumen ini)

**Cara membaca dokumen ini**: Setiap keputusan ditandai salah satu dari dua label:
- **`[EXISTING]`** — fakta dari audit, tidak diubah, dipertahankan apa adanya.
- **`[REKOMENDASI]`** — keputusan/opini teknis yang diusulkan untuk menutup gap, disertai
  alasan singkat. Ini bukan fakta dari sumber, dan boleh didiskusikan/diganti sebelum
  development dimulai.

Tidak ada bagian yang mencampur kedua label dalam satu klaim tanpa penanda eksplisit.

---

## 1. TECH STACK

### 1.1 Existing — Dipertahankan

| Layer | Teknologi | Status |
|-------|-----------|--------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS 4, React Router 7, React Query, Shadcn UI | `[EXISTING]` |
| Backend | Laravel 12, PHP 8.2, Laravel Sanctum | `[EXISTING]` |
| Database | Relational (engine pasti — PostgreSQL/MySQL — belum dikonfirmasi di audit) | `[EXISTING]`, engine `NEEDS CONFIRMATION` |

**Rekomendasi soal stack**: `[REKOMENDASI]` Tidak ada rekomendasi untuk mengganti stack di
layer manapun. Alasan: (1) tidak ada requirement dari BR atau use case diagram yang
membutuhkan kapabilitas di luar stack existing, (2) mengganti stack pada proyek yang sudah
"largely complete" secara fungsional (skor Functionality 8/10 di audit) menambah risiko
tanpa manfaat yang bisa ditelusuri ke requirement — bertentangan dengan prinsip yang sudah
ditetapkan di prompt-prompt sebelumnya untuk proyek ini (jangan refactor tanpa alasan).

### 1.2 Tambahan yang Direkomendasikan

| Kebutuhan | Rekomendasi | Alasan |
|-----------|--------------|--------|
| Database engine, jika belum ditentukan | `[REKOMENDASI]` PostgreSQL | Audit menyebut kemungkinan PostgreSQL/MySQL. Jika belum ada keputusan terpasang, PostgreSQL direkomendasikan karena dukungan native untuk constraint dan index parsial yang berguna untuk pola assignment per-semester (lihat Section 3.3) — namun jika MySQL sudah terpasang di produksi, **jangan migrasi**, pertahankan yang sudah ada. |
| Job queue untuk generate PDF Berita Acara | `[REKOMENDASI]` Laravel Queue (database driver, tanpa Redis tambahan di awal) | Audit tidak menyebut mekanisme queue existing untuk generate PDF. Generate PDF snapshot cenderung memakan waktu; menjalankannya sinkron di request cycle berisiko timeout. Database driver dipilih (bukan Redis) supaya tidak menambah dependency infrastruktur baru tanpa bukti kebutuhan skala besar. |
| Rate limiting | `[REKOMENDASI]` Laravel built-in `throttle` middleware | Sudah direkomendasikan di audit (S-02) sebagai HIGH-priority security remediation; tidak perlu tools eksternal, Laravel sudah menyediakan built-in. |

---

## 2. ARCHITECTURE

### 2.1 Pola Existing — Dipertahankan

```
Route → Middleware → FormRequest → Controller → Service → Repository → Model → Database
```

`[EXISTING]`. Pola ini **wajib dipertahankan** untuk seluruh modul baru maupun modul yang
direfaktor dari closure. Tidak ada rekomendasi untuk mengganti pola arsitektur.

### 2.2 Rekomendasi — Penutupan Gap Closure-Route

`[REKOMENDASI]` Audit (Finding C-01) mencatat business logic dan query database berada
langsung di closure `routes/api.php` untuk area Course dan CLO assignment. Rekomendasi:

1. Setiap closure route dipindahkan ke Controller dedicated mengikuti pola existing di
   atas — bukan pola baru.
2. Untuk area yang disebutkan di audit spesifik (Course-CLO assignment), buat:
   - `CourseClooAssignmentController` (mengikuti convention penamaan di `AGENTS.md`
     Section 9 yang sudah disepakati)
   - `StoreCourseCloAssignmentRequest` untuk validasi `clo_ids` (menutup F-03 — validasi
     `exists:clos,id`)
   - `CourseCloAssignmentService` untuk logic sync, dibungkus `DB::transaction()`
     (menutup FN-01)
3. **Tidak direkomendasikan** membuat pola arsitektur baru (mis. CQRS, event sourcing)
   untuk area ini — skala masalahnya (satu area closure) tidak sepadan dengan kompleksitas
   tambahan itu.

### 2.3 Rekomendasi — Frontend State Management untuk Data Semester-Aware

`[REKOMENDASI]` BR-02, BR-04, dan use case "Menentukan dosen verifikator" (dengan include
wajib "menentukan MK") memperkenalkan konsep **konteks semester aktif** yang memengaruhi
banyak bagian UI (periode soal, monitoring, assignment Koordinator). Rekomendasi:

- Gunakan **React Context** (bukan state management library tambahan seperti Zustand/
  Redux) untuk menyimpan "semester/periode aktif" sebagai state global ringan, dikombinasi
  dengan React Query untuk data fetching per-semester (`useQuery` dengan `semester_id`
  sebagai bagian dari query key, supaya cache otomatis terpisah per semester).
- Alasan: React Query sudah jadi bagian stack existing; menambah state library terpisah
  untuk satu konteks global (semester aktif) adalah over-engineering untuk kebutuhan
  sebesar ini. Context API sudah cukup untuk data yang jarang berubah dalam satu sesi
  penggunaan (semester aktif tidak berubah di tengah sesi kerja user).

---

## 3. DATABASE DESIGN

### 3.1 Existing — Confirmed dari `AGENTS.md`

`[EXISTING]`, dilaporkan dari pembacaan kode (lihat `AGENTS.md` Section 7):

| Tabel/Kolom | Keterangan |
|--------------|-------------|
| `koordinator_assignments` | Assignment Koordinator, terpisah dari `user_roles` |
| `course_clo` / `mata_kuliah_id` di CLO | Dua kemungkinan struktur mapping — mana yang aktif `NEEDS CONFIRMATION` |
| `penugasan_verifikator` | Assignment Verifikator (legacy: `user_roles`) |
| Tabel `Soal` | Tidak ada kolom `plo_id` langsung — relasi ke PLO implisit lewat CLO |

### 3.2 Gap — Dukungan Semester pada Koordinator Assignment

`[REKOMENDASI]` Ini adalah rekomendasi paling penting di seluruh dokumen ini, karena
menyangkut BR-02 dan BR-04 secara langsung.

Notulensi Section 6 eksplisit menyatakan kondisi awal: *"Super Admin belum dapat mengganti
Koordinator dari satu user ke user lainnya."* Ini mengindikasikan struktur data existing
kemungkinan memperlakukan Koordinator sebagai atribut yang **tidak** terikat ke pasangan
(Course, Semester) — melainkan terikat ke Course saja, atau bahkan tetap sepanjang waktu.

**Rekomendasi struktur** (bukan keputusan final tanpa verifikasi skema aktual):

- Tabel `koordinator_assignments` (jika belum, atau perlu ditambahkan kolomnya) sebaiknya
  punya struktur minimal:
  ```
  koordinator_assignments
  ├── id
  ├── course_id       (FK ke courses)
  ├── user_id         (FK ke users — Koordinator yang ditugaskan)
  ├── semester_id     (FK ke semesters — WAJIB, ini yang memungkinkan BR-02/BR-04)
  ├── assigned_by     (FK ke users — SuperAdmin yang menugaskan, untuk audit trail)
  ├── created_at / updated_at
  ```
  dengan **unique constraint pada kombinasi `(course_id, semester_id)`** — supaya satu
  mata kuliah hanya punya satu Koordinator aktif per semester, dan "mengganti Koordinator"
  (BR-04) berarti update baris pada kombinasi tersebut, bukan insert baris baru yang
  bertabrakan.

- **Sebelum struktur ini dieksekusi**: skema `koordinator_assignments` yang sudah ada
  (dilaporkan agent) wajib diverifikasi ulang — apakah kolom `semester_id` sudah ada atau
  belum. Jika sudah ada, rekomendasi ini tidak perlu migrasi tambahan, hanya perlu
  memastikan business logic (Service layer) memanfaatkannya dengan benar. Jika belum ada,
  ini adalah migration baru yang **dapat ditelusuri langsung ke BR-02 dan BR-04** — bukan
  tabel yang dibuat karena "best practice".

`NEEDS CONFIRMATION FROM EXISTING DATABASE` untuk memastikan mana dari dua kondisi di atas
yang berlaku sebelum migration dieksekusi.

### 3.3 Gap — Kategori Soal

`[REKOMENDASI]` Use case "Mengelola kategori soal" (diagram C) tidak punya rujukan tabel
manapun di audit maupun laporan agent. Rekomendasi: tabel `soal_kategori` (atau nama
serupa mengikuti convention di `AGENTS.md`) dengan relasi many-to-one dari `Soal` — namun
karena tidak ada informasi soal apakah tabel ini **sudah ada** di skema existing, ini
ditandai `NEEDS CONFIRMATION FROM EXISTING DATABASE` sebelum diasumsikan sebagai tabel
baru yang perlu dibuat.

### 3.4 Tidak Direkomendasikan

`[REKOMENDASI]` Tidak menambahkan tabel terpisah untuk "status periode" atau "tahun
ajaran" jika keduanya sudah punya representasi di tabel `semesters`/`periode` existing
(nama pasti `NEEDS CONFIRMATION`). Menambah tabel baru untuk konsep yang mungkin sudah
punya representasi adalah duplikasi struktural yang harus dihindari — cek dulu skema
existing sebelum membuat tabel baru untuk BR-08/BR-09.

---

## 4. API DESIGN

### 4.1 Existing — Dipertahankan

`[EXISTING]`. Endpoint existing yang sudah fully implemented (Authentication, Dosen
Management, PLO/CLO CRUD, Soal Upload, Verifikasi, Berita Acara) dipertahankan tanpa
perubahan contract, kecuali disebutkan eksplisit di bawah.

### 4.2 Rekomendasi — Endpoint Baru/Modifikasi

| Endpoint (rekomendasi) | Method | Actor | Keterangan |
|--------------------------|--------|-------|-------------|
| `/api/koordinator-assignments` | `POST` | SuperAdmin | Menunjuk/mengganti Koordinator untuk (course, semester). Menggantikan logic yang saat ini kemungkinan tidak mendukung pergantian (BR-04). |
| `/api/koordinator-assignments/{id}` | `PUT` | SuperAdmin | Update Koordinator pada assignment existing — ini yang menutup kebutuhan "mengganti dari user 1 ke user 2" tanpa insert baris duplikat. |
| `/api/soal-kategori` | `GET, POST, PUT, DELETE` | SuperAdmin | Menutup use case "Mengelola kategori soal" — hanya jika Section 3.3 terkonfirmasi belum ada. |
| `/api/courses/{id}/clo` | `POST` (modifikasi dari closure existing) | SuperAdmin | Dipindahkan dari closure ke Controller, ditambah `FormRequest` dengan `exists:clos,id` — menutup F-03. |

Semua endpoint di atas berlabel `[REKOMENDASI]` — nama path, method, dan payload adalah
usulan, bukan kontrak final. Payload/response detail **tidak** dituliskan di sini karena
akan mengarang shape data tanpa verifikasi terhadap Resource class existing.

### 4.3 Wajib Ditutup — Security (dari audit)

`[REKOMENDASI, prioritas tertinggi]` Dua remediation berikut direkomendasikan untuk masuk
scope pengerjaan berbarengan dengan fitur baru manapun yang menyentuh area yang sama,
karena risikonya sudah CRITICAL/HIGH di audit:

- `/dev/switch-mode` — tambahkan middleware `super_admin` (menutup F-01, dan menutup
  BR-09 sekaligus karena keduanya sama-sama soal Dev Mode).
- `/penugasan-dosen` (store/destroy) — tambahkan middleware `super_admin` (menutup F-02).

Ini bukan "nice to have" — endpoint assignment Koordinator/Verifikator yang baru
direkomendasikan di atas (Section 4.2) akan langsung mewarisi risiko yang sama jika
middleware ini tidak ditutup lebih dulu.

---

## 5. FRONTEND ARCHITECTURE

### 5.1 Existing — Dipertahankan

`[EXISTING]` Struktur folder React existing dipertahankan (lihat `AGENTS.md` Section 4 —
struktur aktual `NEEDS CONFIRMATION`, belum diverifikasi langsung dari repository).

### 5.2 Rekomendasi

- **Role guard**: `[REKOMENDASI]` Setiap route yang terikat ke satu role spesifik
  (SuperAdmin/Koordinator/Verifikator) menggunakan wrapper component role-guard yang
  membaca role dari token Sanctum, dikombinasi dengan pengecekan ulang di backend
  (middleware) — bukan mengandalkan frontend saja. Ini menutup titik lemah yang disebut
  di audit (UX-01, dan prinsip umum "authorization tidak boleh hanya bergantung frontend"
  yang sudah ditetapkan di `AGENTS.md` Section 15).
- **Form untuk assignment Koordinator/Verifikator**: `[REKOMENDASI]` gunakan React Query
  `useMutation` dengan optimistic update untuk perubahan Koordinator (BR-04), supaya UI
  terasa responsif saat SuperAdmin mengganti Koordinator, dengan rollback otomatis jika
  API menolak (mis. constraint unique per semester tertabrak).
- **Komponen "Menentukan MK"**: `[REKOMENDASI]` karena include wajib dari "menentukan
  dosen verifikator" (Section 1.5 di User Flow), buat komponen picker MK yang **reusable**
  dan dipanggil sebagai sub-step di dalam form penunjukan Verifikator — bukan halaman
  terpisah yang butuh navigasi keluar-masuk, supaya include-nya terasa sebagai satu alur,
  konsisten dengan bagaimana relasi include digambarkan di use case diagram.

---

## 6. FOLDER STRUCTURE

### 6.1 Backend — Rekomendasi Penempatan Modul Baru

`[REKOMENDASI]` Laravel sudah punya convention folder baku di level framework (bukan
usulan bebas) — rekomendasi di sini murni soal **di mana modul baru/hasil refactor
closure ditempatkan** di dalam convention yang sudah ada, bukan mengubah convention itu
sendiri.

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── KoordinatorAssignmentController.php   [BARU — Section 4.2]
│   │   │   ├── SoalKategoriController.php            [BARU — Section 3.3, jika terkonfirmasi belum ada]
│   │   │   ├── CourseCloAssignmentController.php     [BARU — pindahan dari closure, Section 2.2]
│   │   │   └── ...                                    [EXISTING — dipertahankan]
│   │   ├── Requests/
│   │   │   ├── StoreKoordinatorAssignmentRequest.php  [BARU]
│   │   │   ├── UpdateKoordinatorAssignmentRequest.php [BARU]
│   │   │   ├── StoreCourseCloAssignmentRequest.php    [BARU — validasi exists:clos,id, menutup F-03]
│   │   │   └── ...                                    [EXISTING]
│   │   └── Middleware/
│   │       └── ...                                    [EXISTING — pastikan super_admin ditambahkan
│   │                                                    ke route existing sesuai Section 4.3,
│   │                                                    bukan middleware baru]
│   ├── Models/
│   │   ├── KoordinatorAssignment.php                  [BARU, atau EXISTING jika sudah ada —
│   │                                                    verifikasi dulu terhadap AGENTS.md Section 7]
│   │   ├── SoalKategori.php                           [BARU, jika terkonfirmasi belum ada]
│   │   └── ...                                        [EXISTING]
│   ├── Services/
│   │   ├── KoordinatorAssignmentService.php           [BARU — logic ganti Koordinator + constraint semester]
│   │   ├── CourseCloAssignmentService.php             [BARU — bungkus DB::transaction(), menutup FN-01]
│   │   └── ...                                        [EXISTING]
│   ├── Repositories/
│   │   ├── KoordinatorAssignmentRepository.php        [BARU]
│   │   └── ...                                        [EXISTING]
│   └── Policies/
│       └── KoordinatorAssignmentPolicy.php            [BARU — opsional, jika otorisasi kompleks
│                                                         cukup untuk butuh Policy terpisah,
│                                                         bukan middleware role check sederhana]
├── database/
│   └── migrations/
│       └── xxxx_add_semester_id_to_koordinator_assignments.php
│           [BARU — HANYA jika Section 3.2 terkonfirmasi kolom semester_id belum ada;
│            jangan dibuat sebelum verifikasi skema aktual]
└── routes/
    └── api.php   [MODIFIKASI — closure Course-CLO dipindahkan keluar dari file ini
                    ke Controller di atas; endpoint lain di file ini tidak disentuh]
```

Penamaan file di atas mengikuti convention yang sudah disepakati di `AGENTS.md` Section 9
(PascalCase + suffix per jenis: Controller/Request/Service/Repository). Tidak ada folder
baru yang diusulkan di level teratas `app/` — seluruhnya masuk ke folder convention Laravel
yang sudah ada.

### 6.2 Frontend — Rekomendasi Struktur Baru

`[REKOMENDASI, confidence lebih rendah dari 6.1]` Berbeda dari backend, React/Vite tidak
punya convention folder baku dari framework. Struktur di bawah adalah **usulan dari nol**,
bukan pemetaan ke struktur yang sudah confirmed ada — karena struktur folder frontend
aktual masih `NEEDS CONFIRMATION` (lihat `AGENTS.md` Section 4). Sebelum dipakai, cocokkan
dulu terhadap struktur folder `src/` yang sungguhan ada di repository; kemungkinan besar
sebagian folder ini sudah ada dengan nama yang mirip tapi tidak identik.

```
frontend/
├── src/
│   ├── pages/
│   │   ├── super-admin/
│   │   │   ├── MasterDataPage.tsx              [use case: Mengelola master data]
│   │   │   ├── TahunAjaranPage.tsx             [use case: Mengelola tahun ajaran]
│   │   │   ├── KategoriSoalPage.tsx            [use case: Mengelola kategori soal]
│   │   │   └── PenugasanVerifikatorPage.tsx    [use case: Menentukan dosen verifikator
│   │   │                                         + include wajib "menentukan MK"]
│   │   ├── koordinator/
│   │   │   ├── UploadSoalPage.tsx              [use case: Mengunggah Soal + extend Revisi]
│   │   │   ├── TemplateSoalPage.tsx            [use case: Mengunduh Template Soal]
│   │   │   └── StatusVerifikasiPage.tsx        [use case: Melihat Status Verifikasi]
│   │   └── verifikator/
│   │       └── VerifikasiSoalPage.tsx          [use case: Memverifikasi Soal + 2 extension]
│   │
│   ├── components/
│   │   ├── master-data/
│   │   │   ├── CloForm.tsx
│   │   │   ├── PloForm.tsx
│   │   │   ├── MataKuliahForm.tsx
│   │   │   └── DosenForm.tsx
│   │   ├── assignment/
│   │   │   ├── KoordinatorAssignmentForm.tsx   [rekomendasi Section 5.2 — optimistic update]
│   │   │   ├── VerifikatorAssignmentForm.tsx
│   │   │   └── MataKuliahPicker.tsx            [rekomendasi Section 5.2 — komponen reusable
│   │   │                                         untuk include wajib "menentukan MK"]
│   │   ├── soal/
│   │   │   ├── SoalUploadForm.tsx
│   │   │   └── SoalRevisiForm.tsx
│   │   ├── verifikasi/
│   │   │   ├── CatatanVerifikasiForm.tsx
│   │   │   └── BeritaAcaraPrintButton.tsx
│   │   └── shared/
│   │       └── RoleGuard.tsx                    [rekomendasi Section 5.2 — role guard wrapper]
│   │
│   ├── contexts/
│   │   └── SemesterContext.tsx                  [rekomendasi Section 2.3 — konteks
│   │                                              semester/periode aktif]
│   │
│   ├── hooks/
│   │   ├── useKoordinatorAssignment.ts          [React Query wrapper, mutation + query]
│   │   ├── useVerifikatorAssignment.ts
│   │   ├── useSemesterAktif.ts
│   │   └── ...                                  [EXISTING — dipertahankan]
│   │
│   ├── api/
│   │   ├── koordinatorAssignment.ts             [API client baru]
│   │   ├── verifikatorAssignment.ts
│   │   ├── soalKategori.ts
│   │   └── ...                                  [EXISTING]
│   │
│   ├── types/
│   │   ├── KoordinatorAssignment.ts
│   │   ├── VerifikatorAssignment.ts
│   │   └── ...                                  [EXISTING]
│   │
│   └── routes/
│       └── ...                                  [MODIFIKASI — route guard per role
│                                                   ditambahkan ke route existing yang relevan,
│                                                   struktur routing tidak diubah]
```

**Catatan pembagian folder `pages/` per-role** (`super-admin/`, `koordinator/`,
`verifikator/`): ini pilihan struktural yang mengikuti pembagian aktor pada use case
diagram (C) satu-persatu, supaya penelusuran requirement→file (traceability) tetap mudah
diikuti. Alternatif yang sama validnya adalah struktur feature-based (`features/soal/`,
`features/verifikasi/`, dst) — **tidak direkomendasikan** di sini kecuali repository
existing sudah condong ke pola feature-based (lihat prinsip di `master-prompt` Phase 11:
"Jangan otomatis mengubah layer-based menjadi feature-based"). Jika struktur existing
ternyata sudah feature-based, folder di atas perlu disesuaikan ke pola itu, bukan
dipaksakan jadi role-based.

---

## 7. TESTING STRATEGY

`[REKOMENDASI]` Audit mencatat testing gap di area otorisasi kompleks (`SoalController::
show`) dan closure routes. Rekomendasi prioritas testing untuk fitur yang derivatif dari
BR/use case baru:

| Area | Jenis Test | Alasan Prioritas |
|------|------------|---------------------|
| Constraint unique `(course_id, semester_id)` pada `koordinator_assignments` | Unit + Integration | Ini jantung dari BR-02/BR-04; kalau constraint salah, dua Koordinator bisa aktif bersamaan di satu MK pada satu semester. |
| Middleware `super_admin` pada endpoint assignment baru | Authorization Test | Menutup risiko yang sama seperti F-01/F-02 terulang pada endpoint baru. |
| `exists:clos,id` pada FormRequest baru | API Test (invalid ID case) | Langsung menutup F-03. |
| Include wajib "menentukan MK" saat "menentukan dosen verifikator" | E2E | Memastikan UI tidak bisa submit assignment Verifikator tanpa MK terisi — ini constraint yang sifatnya UX sekaligus data-integrity. |

Test detail (assertion spesifik, mock data) tidak dituliskan di sini — itu levelnya
implementasi, di luar scope dokumen tech spec ini.

---

## 8. RINGKASAN KEPUTUSAN PALING DIREKOMENDASIKAN

Kalau harus dipilih titik-titik yang paling berdampak untuk proyek ini secara keseluruhan,
urutan prioritas rekomendasi:

1. **Tutup middleware `super_admin` di `/dev/switch-mode` dan `/penugasan-dosen` dulu**
   (Section 4.3) — sebelum menambah endpoint assignment baru manapun, karena pola yang
   sama akan terwarisi kalau tidak ditutup lebih dulu.
2. **Verifikasi skema `koordinator_assignments` terhadap kebutuhan semester** (Section
   3.2) — ini penentu terbesar apakah BR-02/BR-04 butuh migration besar atau cuma
   penyesuaian Service layer.
3. **Pindahkan closure route Course-CLO ke Controller+Service+Repository** (Section 2.2)
   — menutup tiga finding audit sekaligus (C-01, F-03, FN-01) dengan satu pekerjaan
   terstruktur, bukan tiga fix terpisah.
4. Sisanya (kategori soal, role guard, testing) mengikuti setelah tiga hal di atas stabil.

Urutan ini murni rekomendasi berdasarkan dampak-vs-effort yang bisa ditelusuri ke
requirement — bukan urutan wajib yang harus diikuti persis.