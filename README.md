# Sistem Verifikasi Soal

Website untuk mengelola proses upload, verifikasi, dan dokumentasi (Berita Acara) soal ujian oleh dosen, dengan alur penugasan PIC (Person in Charge) yang bersifat dinamis per periode. Fokus penggunaan saat ini untuk **Program Studi Sistem Informasi**.

---

## Daftar Isi

- [1. Ringkasan Sistem](#1-ringkasan-sistem)
- [2. Role & Hak Akses](#2-role--hak-akses)
- [3. Proses Bisnis](#3-proses-bisnis)
- [4. Fitur per Role](#4-fitur-per-role)
- [5. State Machine Soal](#5-state-machine-soal)
- [6. Tech Stack](#6-tech-stack)
- [7. Struktur Proyek](#7-struktur-proyek)
- [8. Entitas Data Utama](#8-entitas-data-utama)
- [9. Alur Berita Acara](#9-alur-berita-acara)
- [10. Catatan Pengembangan](#10-catatan-pengembangan)

---

## 1. Ringkasan Sistem

Sistem ini dibangun untuk mendigitalkan proses verifikasi soal ujian di lingkungan akademik, khususnya Program Studi Sistem Informasi. Setiap periode (semester ganjil/genap), dosen mengunggah soal (format PDF) sesuai kategori dan template yang ditentukan serta mata kuliah yang diampunya pada periode tersebut. Dosen Verifikator yang ditugaskan per mata kuliah memverifikasi soal dan memantau progres verifikasi. Hasil verifikasi didokumentasikan secara otomatis dalam bentuk **Berita Acara (BA)** yang dapat dicetak.

Terdapat 3 peran utama dalam sistem:
- **Super Admin**: Mengelola seluruh konfigurasi sistem, akun pengguna (dosen), periode akademik, kategori & template soal/berita acara, penugasan verifikator per mata kuliah, broadcast pemberitahuan, serta memantau seluruh data sistem.
- **Dosen Koordinator Mata Kuliah**: Mengampu mata kuliah, mengelola data dosen, mengunggah soal (PDF) mata kuliah koordinasinya, serta memantau progres verifikasi.
- **Dosen Verifikator**: Memverifikasi soal ujian (approve, revisi, reject) untuk mata kuliah yang ditugaskan kepadanya pada periode berjalan, memantau progres verifikasi tugasnya, serta meng-generate Berita Acara.

Poin penting sistem:
- **Tiga Peran Utama (Role)**: Super Admin, Dosen Koordinator Mata Kuliah, dan Dosen Verifikator.
- **Penugasan Verifikator per Mata Kuliah**: Penugasan disimpan pada tabel `penugasan_verifikator` (`course_id`, `dosen_id`, `periode_id`). Seorang dosen ditugaskan sebagai verifikator spesifik untuk mata kuliah tertentu pada periode aktif.
- **Dua tipe dosen**: Dosen Biasa (aktif di semua periode) dan Dosen LB / Luar Biasa (aktif pada periode ganjil atau genap sesuai penugasan).
- **Scope PLO dan CLO per periode**: Terikat pada periode akademik aktif.
- **Berita Acara Otomatis & Immutable**: Generated dari snapshot data verifikasi.
- **Format berkas wajib PDF**: Berlaku untuk berkas soal dan template.

---

## 2. Role & Hak Akses

| Role | Sifat | Deskripsi Singkat |
|---|---|---|
| **Super Admin** | Permanen | Mengelola keseluruhan sistem: user/dosen, periode & deadline, kategori & template soal/BA, penugasan verifikator, broadcast, monitoring prodi, dan berita acara. |
| **Dosen Koordinator Mata Kuliah** | Permanen | Mengelola data dosen prodi, mengunggah soal ujian (PDF) untuk mata kuliah yang dikoordinasikannya, dan memantau progres verifikasi. |
| **Dosen Verifikator** | Dinamis (penugasan per mata kuliah per periode) | Dosen yang ditugaskan memverifikasi soal (approve/revisi/reject) untuk mata kuliah tertentu, memantau progres verifikasi tugasnya, dan meng-generate Berita Acara. |

### Matriks Hak Akses

| Fitur | Super Admin | Dosen Koordinator MK | Dosen Verifikator |
|---|:---:|:---:|:---:|
| CRUD User & Manajemen Dosen | ✅ | ✅ (Read Only / View) | ❌ |
| Kelola Periode & Deadline | ✅ | ❌ | ❌ |
| Kelola Kategori & Template Soal / BA | ✅ | ❌ | ❌ |
| Penugasan Verifikator per Mata Kuliah | ✅ | ❌ | ❌ |
| Kirim Broadcast | ✅ | ❌ | ❌ |
| CRUD PLO & CLO (per periode) | ✅ | ✅ | ✅ |
| Upload Soal (PDF, sesuai matkul) | ✅ | ✅ | ✅ |
| Verifikasi Soal (Approve/Revisi/Reject) | ✅ | ❌ | ✅ (Matkul Ditugaskan) |
| Monitoring Dashboard Progres | ✅ | ✅ | ✅ (Tugas Sendiri) |
| Generate & Print Berita Acara | ✅ | ✅ | ✅ |

---

## 3. Proses Bisnis

### Tahap 1 — Persiapan Periode & Penugasan (Super Admin)
1. **Super Admin** membuat Periode baru (semester ganjil/genap) beserta tenggat waktu (deadline) upload soal.
2. **Super Admin** menyiapkan Kategori & Template soal serta Template Berita Acara (format PDF/DOCX).
3. **Super Admin** menetapkan penugasan Dosen Verifikator per Mata Kuliah untuk periode berjalan dan mengirimkan Broadcast ke seluruh dosen.

### Tahap 2 — Pengisian PLO/CLO & Upload Soal (Dosen Koordinator MK)
4. **Dosen** login ke sistem. Jika Dosen LB, sistem memvalidasi keaktifan berdasarkan semester penugasannya.
5. **Dosen** melengkapi PLO dan CLO untuk periode aktif.
6. **Dosen Koordinator MK** mengunggah berkas soal (format PDF) sesuai mata kuliah yang diampu sebelum deadline. Status soal menjadi `submitted`.

### Tahap 3 — Verifikasi Soal (Dosen Verifikator)
7. **Dosen Verifikator** menerima antrean soal yang perlu diverifikasi sesuai mata kuliah yang ditugaskan kepadanya.
8. **Dosen Verifikator** memeriksa soal dan menentukan hasil verifikasi: **Approve**, **Revisi**, atau **Reject** beserta catatan verifikator.
9. Jika diminta **Revisi**, Dosen Koordinator MK mengunggah ulang berkas soal dan status kembali menjadi `submitted` untuk diverifikasi ulang oleh Verifikator.

### Tahap 4 — Monitoring & Berita Acara (Super Admin & Koordinator MK)
10. **Super Admin** dan **Dosen Koordinator MK** memantau progres verifikasi soal melalui Dashboard.
11. Setelah verifikasi selesai, **Dosen Verifikator** meng-generate Berita Acara (BA).
12. **Super Admin** dan **Dosen Koordinator MK** dapat meninjau, mengunduh, dan mencetak Berita Acara.

---

## 4. Fitur per Role

### Super Admin
- Manajemen Akun Dosen (Super Admin, Dosen Koordinator MK, Dosen Verifikator, Dosen Biasa/LB)
- Manajemen Periode Akademik & Deadline
- Kelola Kategori & Template Soal (PDF) serta Template Berita Acara
- Dashboard Monitoring Progres Verifikasi Prodi
- Manajemen Data Dosen Prodi
- Melihat, mengunduh, dan mencetak Berita Acara seluruh PIC
- CRUD PLO & CLO serta Upload Soal (sebagai Dosen Pengampu)

### PIC (Person in Charge)
- Dihubungkan secara dinamis per periode akademik
- Mengakses antrean verifikasi soal ujian pada periode tugasnya
- Memberikan keputusan verifikasi (Approve / Perlu Revisi / Reject) dan catatan verifikator
- Dashboard Monitoring Progres Verifikasi PIC
- Generate, preview, dan cetak Berita Acara (opsi: BA saja, Soal saja, atau BA + Soal)

### Dosen (Biasa & LB)
- Role dasar untuk seluruh dosen pengampu
- CRUD PLO & CLO khusus periode aktif
- Upload berkas soal (PDF) sesuai mata kuliah yang diampu sebelum deadline
- Memantau status soal (Submitted, In Review, Revisi, Approved, Rejected) dan riwayat revisi
- Menerima notifikasi & broadcast dari sistem/admin

---

## 5. State Machine Soal

```
Draft → Submitted → In Review (oleh dosen dengan role PIC)
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Approved       Revisi       Rejected
                        │
                        ▼
                   Submitted (ulang, masuk antrian verifikasi lagi)
```

---

## 6. Tech Stack

### Frontend
- React + Vite + TypeScript
- React Router — routing & route guard per role (termasuk guard dinamis untuk role PIC)
- Tailwind CSS — styling
- Shadcn UI — komponen UI
- Axios Instance — HTTP client dengan interceptor token
- TanStack Query — data fetching, caching, mutation
- Feature-based Folder Structure

### Backend
- Laravel 12
- Sanctum — autentikasi SPA/token
- Pola Controller → Service → Repository → Model
- Form Request Validation (termasuk validasi wajib PDF untuk file soal/template)
- API Resource untuk format response
- PostgreSQL sebagai database

---

## 7. Struktur Proyek

```
verifikasi-soal/
│
├── backend/                                  # Laravel 12 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── Auth/AuthController.php
│   │   │   │   ├── PloController.php
│   │   │   │   ├── CloController.php
│   │   │   │   ├── PeriodeController.php
│   │   │   │   ├── KategoriTemplateController.php
│   │   │   │   ├── SoalController.php
│   │   │   │   ├── DosenMataKuliahController.php
│   │   │   │   ├── UserRoleController.php        # pemberian role PIC
│   │   │   │   ├── VerifikasiController.php
│   │   │   │   ├── BeritaAcaraController.php
│   │   │   │   ├── BroadcastController.php
│   │   │   │   └── DashboardController.php
│   │   │   │
│   │   │   ├── Requests/
│   │   │   │   ├── Plo/{Store,Update}PloRequest.php
│   │   │   │   ├── Clo/{Store,Update}CloRequest.php
│   │   │   │   ├── Soal/{Store,Update}SoalRequest.php     # validasi mimes:pdf
│   │   │   │   ├── DosenMataKuliah/StoreMappingRequest.php
│   │   │   │   ├── UserRole/AssignPicRequest.php
│   │   │   │   ├── Verifikasi/StoreVerifikasiRequest.php
│   │   │   │   └── Broadcast/StoreBroadcastRequest.php
│   │   │   │
│   │   │   ├── Resources/
│   │   │   │   ├── UserResource.php
│   │   │   │   ├── PloResource.php
│   │   │   │   ├── CloResource.php
│   │   │   │   ├── SoalResource.php
│   │   │   │   ├── UserRoleResource.php
│   │   │   │   ├── VerifikasiResource.php
│   │   │   │   └── BeritaAcaraResource.php
│   │   │   │
│   │   │   └── Middleware/
│   │   │       ├── EnsureIsCoordinator.php
│   │   │       └── EnsureIsPicForPeriode.php   # cek dinamis ke tabel user_roles
│   │   │
│   │   ├── Services/
│   │   │   ├── PloService.php
│   │   │   ├── CloService.php
│   │   │   ├── PeriodeService.php
│   │   │   ├── SoalService.php                  # termasuk validateUploadEligibility()
│   │   │   ├── DosenMataKuliahService.php
│   │   │   ├── UserRoleService.php               # pemberian role PIC
│   │   │   ├── VerifikasiService.php
│   │   │   ├── BeritaAcaraService.php            # logic generate PDF + snapshot
│   │   │   └── BroadcastService.php
│   │   │
│   │   ├── Repositories/
│   │   │   ├── Contracts/
│   │   │   │   ├── PloRepositoryInterface.php
│   │   │   │   ├── SoalRepositoryInterface.php
│   │   │   │   ├── UserRoleRepositoryInterface.php
│   │   │   │   └── VerifikasiRepositoryInterface.php
│   │   │   └── Eloquent/
│   │   │       ├── PloRepository.php
│   │   │       ├── SoalRepository.php
│   │   │       ├── UserRoleRepository.php
│   │   │       └── VerifikasiRepository.php
│   │   │
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Plo.php
│   │   │   ├── Clo.php
│   │   │   ├── Periode.php
│   │   │   ├── KategoriTemplate.php
│   │   │   ├── DosenMataKuliah.php
│   │   │   ├── Role.php
│   │   │   ├── UserRole.php
│   │   │   ├── Soal.php
│   │   │   ├── Verifikasi.php
│   │   │   ├── BeritaAcara.php
│   │   │   └── Broadcast.php
│   │   │
│   │   ├── Enums/
│   │   │   ├── SoalStatus.php          # Draft, Submitted, InReview, Revisi, Approved, Rejected
│   │   │   ├── VerifikasiStatus.php
│   │   │   ├── TipeDosen.php           # Biasa, LB
│   │   │   ├── SemesterType.php        # Ganjil, Genap
│   │   │   └── PrintType.php           # BA_ONLY, SOAL_ONLY, BOTH
│   │   │
│   │   └── Providers/
│   │       └── RepositoryServiceProvider.php
│   │
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   │       └── RoleSeeder.php          # seed role "pic"
│   │
│   └── routes/
│       └── api.php
│
├── frontend/                                  # React + Vite + TS SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── router/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── ProtectedRoute.tsx          # guard role + PIC assignment dinamis
│   │   │   │   └── routePaths.ts
│   │   │   └── providers/
│   │   │       ├── QueryProvider.tsx
│   │   │       └── AuthProvider.tsx
│   │   │
│   │   ├── shared/
│   │   │   ├── api/axiosInstance.ts
│   │   │   ├── components/ui/                  # komponen shadcn
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── useDebounce.ts
│   │   │   ├── layouts/
│   │   │   │   ├── CoordinatorLayout.tsx
│   │   │   │   ├── DosenLayout.tsx
│   │   │   │   └── PicLayout.tsx               # dipakai juga untuk fitur monitoring
│   │   │   ├── types/common.types.ts
│   │   │   └── utils/
│   │   │       ├── cn.ts
│   │   │       └── formatDate.ts
│   │   │
│   │   └── features/
│   │       ├── auth/
│   │       │   ├── api/authApi.ts
│   │       │   ├── hooks/useLogin.ts
│   │       │   ├── components/LoginForm.tsx
│   │       │   ├── pages/LoginPage.tsx
│   │       │   └── types/auth.types.ts
│   │       │
│   │       ├── plo-clo/
│   │       │   ├── api/{ploApi,cloApi}.ts
│   │       │   ├── hooks/{usePloList,useCreatePlo,useCloByPlo}.ts
│   │       │   ├── components/{PloTable,PloFormDialog,CloFormDialog}.tsx
│   │       │   ├── pages/PloCloPage.tsx         # ter-filter otomatis by periode aktif
│   │       │   └── types/plo-clo.types.ts
│   │       │
│   │       ├── periode/
│   │       │   ├── api/periodeApi.ts
│   │       │   ├── hooks/usePeriodeList.ts
│   │       │   ├── components/PeriodeFormDialog.tsx
│   │       │   ├── pages/PeriodeManagementPage.tsx
│   │       │   └── types/periode.types.ts
│   │       │
│   │       ├── dosen-mata-kuliah/
│   │       │   ├── api/dosenMataKuliahApi.ts
│   │       │   ├── hooks/{useMappingList,useCreateMapping}.ts
│   │       │   ├── components/MappingFormDialog.tsx
│   │       │   ├── pages/DosenMataKuliahPage.tsx
│   │       │   └── types/mapping.types.ts
│   │       │
│   │       ├── soal/
│   │       │   ├── api/soalApi.ts
│   │       │   ├── hooks/{useSoalList,useUploadSoal,useSoalStatus}.ts
│   │       │   ├── components/{UploadSoalForm,SoalTemplateDownload,SoalStatusBadge}.tsx
│   │       │   ├── pages/{UploadSoalPage,SoalListPage}.tsx
│   │       │   └── types/soal.types.ts
│   │       │
│   │       ├── user-role/
│   │       │   ├── api/userRoleApi.ts
│   │       │   ├── hooks/{useDosenSearch,useAssignPicRole}.ts   # search by kode dosen + nama
│   │       │   ├── components/{DosenSearchCombobox,PicRoleTable}.tsx
│   │       │   ├── pages/AssignPicRolePage.tsx
│   │       │   └── types/user-role.types.ts
│   │       │
│   │       ├── verifikasi/
│   │       │   ├── api/verifikasiApi.ts
│   │       │   ├── hooks/{useSoalToVerify,useSubmitVerifikasi}.ts
│   │       │   ├── components/{VerifikasiForm,VerifikasiHistoryList}.tsx
│   │       │   ├── pages/PicVerifikasiPage.tsx
│   │       │   └── types/verifikasi.types.ts
│   │       │
│   │       ├── berita-acara/
│   │       │   ├── api/beritaAcaraApi.ts
│   │       │   ├── hooks/usePrintBeritaAcara.ts
│   │       │   ├── components/PrintOptionDialog.tsx       # BA / Soal / Keduanya
│   │       │   ├── pages/BeritaAcaraPage.tsx
│   │       │   └── types/berita-acara.types.ts
│   │       │
│   │       ├── broadcast/
│   │       │   ├── api/broadcastApi.ts
│   │       │   ├── hooks/useBroadcastList.ts
│   │       │   ├── components/{BroadcastFormDialog,BroadcastFeed}.tsx
│   │       │   ├── pages/BroadcastPage.tsx
│   │       │   └── types/broadcast.types.ts
│   │       │
│   │       └── dashboard/
│   │           ├── api/dashboardApi.ts
│   │           ├── components/
│   │           │   ├── CoordinatorDashboard.tsx
│   │           │   ├── DosenDashboard.tsx
│   │           │   └── PicDashboard.tsx        # gabungan verifikasi + monitoring progres
│   │           └── pages/DashboardPage.tsx
│   │
│   ├── index.html
│   └── vite.config.ts
│
└── README.md
```

> Catatan: folder/komponen terkait "Coordinator" (`CoordinatorLayout`, `CoordinatorDashboard`, dsb.) yang sempat muncul di draf sebelumnya **dihapus** — seluruh fungsinya sudah tergabung ke dalam `PicLayout`/`PicDashboard`.

---

## 7.1 Endpoint API Enhancement Dosen

- `GET /api/soal/{id}/timeline` — Mengambil timeline riwayat perjalanan dokumen soal dari unggah hingga disetujui/berita acara
- `GET /api/soal/{id}/revision-history` & `GET /api/questions/{id}/revision-history` — Mengambil seluruh riwayat catatan revisi dari verifikator
- `GET /api/dashboard/upload-progress` — Mengambil progress pengumpulan soal per mata kuliah yang diampu dosen pada periode aktif (lengkap dengan indikator deadline kritis < 3 hari)

---

## 8. Entitas Data Utama

```
User
- id, uuid, kode_dosen, nama_lengkap, email, password
- prodi_id (FK)
- tipe_dosen: enum('biasa','lb')
- semester_lb: enum('ganjil','genap') nullable   // hanya untuk Dosen LB
- is_coordinator (bool)
- status_aktif (bool)
- deleted_at (soft delete)

ProgramStudi
- id, kode_prodi, nama_prodi

Course (Mata Kuliah)
- id, kode_mk, nama_mk, prodi_id

DosenMataKuliah (pemetaan fleksibel)
- id, dosen_id, mata_kuliah_id, periode_id, created_by

Role
- id, nama_role   // saat ini hanya "pic"

UserRole (penugasan role dinamis)
- id, user_id, role_id, periode_id, assigned_by, assigned_at
  → dosen dengan entry role "pic" di sini dapat akses verifikasi + monitoring

Periode
- id, nama_periode, semester (ganjil/genap), tahun_akademik
- tanggal_mulai, tanggal_deadline, status

PLO (per periode)
- id, kode, deskripsi, prodi_id, periode_id, created_by

CLO (per periode)
- id, kode, deskripsi, mata_kuliah_id, plo_id, periode_id, created_by

KategoriTemplate
- id, nama_kategori, deskripsi

Template (wajib PDF)
- id, kategori_id, nama_file, file_path, versi, is_active

Soal (wajib PDF)
- id, uuid, dosen_id, mata_kuliah_id, clo_id, periode_id, template_id
- judul_soal, file_soal, versi, status, uploaded_at, deleted_at (soft delete)

RevisiHistory
- id, soal_id, versi, file_soal, catatan_verifikator, uploaded_by

Verifikasi (satu jenis verifikator: dosen dengan role PIC)
- id, soal_id, verifier_id, status, catatan, verified_at, deleted_at

BeritaAcara (auto-generated)
- id, nomor_ba, periode_id, verifier_id, generated_at, file_pdf

BeritaAcaraItem (snapshot immutable)
- id, berita_acara_id, soal_id, verification_id, status_snapshot, catatan_snapshot

Broadcast
- id, judul, isi, target, prodi_id, periode_id, created_by, published_at

Notifikasi
- id, user_id, judul, pesan, tipe, is_read, reference_type, reference_id
```

---

## 9. Alur Berita Acara

Berita Acara dirancang sebagai dokumen yang di-generate otomatis (bukan diketik manual), dengan pendekatan snapshot immutable:

1. Setelah proses verifikasi soal selesai untuk suatu periode, dosen dengan role PIC memicu generate BA.
2. Sistem mengambil data dari tabel `verifications` **pada saat itu juga** dan menyalinnya ke `berita_acara_items` (snapshot) — nomor BA, daftar soal & hasilnya, catatan, tanggal.
3. Dokumen dirender ke PDF di sisi backend (bukan di frontend) agar konsisten dan dapat diaudit, hasilnya di-cache (`file_pdf`).
4. Dosen dengan role PIC dapat memilih opsi cetak:
   - **BA saja**
   - **Soal saja**
   - **BA + Soal (gabungan)**
5. Karena datanya snapshot, **BA yang sudah dicetak tidak akan berubah** meskipun ada soal yang direvisi lagi setelahnya.

---

## 10. Catatan Pengembangan & Pembaruan Terkini

Hal-hal yang sudah difinalisasi dan diimplementasikan:

- ✅ **Empat Peran Pengguna (Role & Akses)**: Super Admin, Coordinator, PIC (dinamis per periode via `user_roles`), dan Dosen (Biasa/LB).
- ✅ **Berita Acara per Role**:
  - Dosen dengan role **PIC** dapat meng-generate Berita Acara untuk tugas verifikasinya sendiri secara mandiri.
  - **Super Admin** dapat memfilter daftar Berita Acara dengan opsi **"— Semua PIC —"** (menampilkan Berita Acara seluruh PIC secara bersamaan) atau memilih PIC spesifik.
- ✅ **Riwayat Verifikasi Lengkap (Full Verification Audit Trail)**:
  - Mengembalikan seluruh rekam jejak keputusan verifikasi (`Disetujui`, `Perlu Revisi`, dan `Ditolak`) beserta nama verifikator, timestamp, dan catatan lengkap.
  - Komponen Accordion & Timeline menampilkan badge indikator warna dinamis (🟢 Disetujui, 🟡 Perlu Revisi, 🔴 Ditolak).
  - Halaman Verifikasi Soal dilengkapi **Filter Status** (*Semua Status*, *Submitted*, *Dalam Review*, *Perlu Revisi*, *Disetujui*, *Ditolak*) serta tombol **Riwayat** untuk peninjauan mendalam.
- ✅ **Aturan Upload & Eligibilitas Soal**:
  - Super Admin dibebaskan dari pembatasan pemetaan mata kuliah.
  - Mode Setup Awal: Jika pemetaan `dosen_mata_kuliah` belum diisi pada periode aktif, validasi dilewati sementara agar pengujian/upload awal tetap berjalan lancar.
- ✅ **Kualitas Antarmuka (UX/UI)**:
  - Overlay backdrop modal disesuaikan tanpa efek blur berlebihan (`backdrop-blur`) agar latar belakang tetap jernih dan nyaman dibaca.
  - Navigasi sidebar menggunakan pencocokan rute presisi (`end={item.href === '/soal'}`) untuk mencegah sorotan menu ganda.
- ✅ **Format Berkas**: Soal dan template wajib berformat PDF.
- ✅ **Scope PLO & CLO**: Di-scope khusus per periode akademik.

Hal yang dapat dikembangkan lebih lanjut di masa depan (opsional):

1. Fitur **duplikasi PLO/CLO dari periode sebelumnya** untuk efisiensi input dosen.
2. Validasi kuota jumlah PIC per periode (misal: 4–5 dosen) jika disyaratkan oleh kebijakan akademik.
3. Konfigurasi `SANCTUM_STATEFUL_DOMAINS` dan CORS untuk deployment produksi lintas domain.
