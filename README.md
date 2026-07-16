# Sistem Verifikasi Soal

Website untuk mengelola proses upload, verifikasi, dan dokumentasi (Berita Acara) soal ujian oleh dosen, dengan alur penugasan PIC (Person in Charge) yang bersifat dinamis per periode. Fokus penggunaan saat ini untuk **Program Studi Sistem Informasi**.

> Dokumen ini adalah versi terbaru yang sudah mencakup seluruh revisi: penyederhanaan role (Coordinator melebur ke PIC), pembedaan Dosen Biasa/LB, pemetaan dosen↔mata kuliah, PLO/CLO per periode, dan format soal wajib PDF.

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

Sistem ini dibangun untuk mendigitalkan proses verifikasi soal ujian di lingkungan akademik, khususnya Program Studi Sistem Informasi. Setiap periode (semester ganjil/genap), dosen mengunggah soal (format PDF) sesuai kategori dan template yang ditentukan, sesuai mata kuliah yang diampunya pada periode tersebut. Sejumlah dosen ditunjuk oleh Super Admin untuk memegang **role PIC**, yang memverifikasi soal dan memantau progres verifikasi. Hasil verifikasi didokumentasikan secara otomatis dalam bentuk **Berita Acara (BA)** yang bisa dicetak.

Poin penting yang membedakan sistem ini dari sistem CRUD biasa:

- **Hanya ada 3 tingkat akses**: Super Admin, Dosen (base), dan Dosen yang diberi **role PIC**. Tidak ada role Coordinator terpisah — seluruh fitur yang sebelumnya dianggap "milik Coordinator" (monitoring/dashboard progres) sudah melebur menjadi bagian dari role PIC.
- **PIC bukan role permanen.** Status PIC adalah *penugasan role* yang berlaku untuk satu periode tertentu saja (disimpan di tabel `user_roles`), bisa berbeda-beda setiap periode. Seorang dosen bisa jadi PIC di periode ini, dan jadi dosen biasa di periode berikutnya.
- **Dosen yang diberi role PIC dapat memverifikasi SEMUA soal** yang diupload dosen dalam periode aktif tempat dia bertugas — tidak dibatasi ke target dosen tertentu, karena scope aplikasi ini memang fokus untuk satu prodi (Sistem Informasi).
- **Ada dua tipe dosen**: Dosen Biasa (aktif di semua periode) dan Dosen LB/Luar Biasa (hanya aktif di satu jenis periode — ganjil atau genap sesuai penugasannya).
- **PLO dan CLO di-scope per periode** — bisa berbeda konten antar semester, tidak dipakai lintas periode secara otomatis.
- **Berita Acara digenerate otomatis** dari data verifikasi (snapshot immutable), bukan diketik manual atau live-query, untuk menjaga konsistensi dokumen resmi walau ada perubahan data setelahnya.
- **Format soal dan template wajib PDF** untuk menjaga konsistensi saat digabung ke dokumen Berita Acara.

---

## 2. Role & Hak Akses

| Role | Sifat | Deskripsi Singkat |
|---|---|---|
| **Super Admin** | Permanen | Mengelola keseluruhan sistem: user, periode, deadline, pemetaan dosen↔matkul, pemberian role PIC, broadcast, dan monitoring semua data |
| **Dosen (Biasa)** | Permanen (base role) | Role dasar, aktif di semua periode. Berhak CRUD PLO/CLO dan upload soal |
| **Dosen (LB / Luar Biasa)** | Permanen (base role, dengan batasan) | Sama seperti Dosen Biasa, tapi **hanya aktif di satu jenis periode** (ganjil **atau** genap) sesuai penugasan |
| **Dosen dengan role PIC** | Dinamis (assignment per periode, melekat pada akun dosen) | Diberikan Super Admin untuk satu periode tertentu. Mendapat **seluruh fitur dosen**, ditambah **verifikasi soal** dan **monitoring/dashboard progres** (fitur yang sebelumnya disebut "Coordinator" sudah melebur ke sini) |

> **Catatan penting:** karena PIC adalah assignment dinamis, secara teknis disimpan di tabel `user_roles` (kombinasi `user_id`, `role_id`, `periode_id`), bukan sebagai kolom `role` tetap di tabel `users`. Tidak ada lagi kolom `is_coordinator` — role Coordinator sudah dihapus sepenuhnya dari desain.

### Matriks Hak Akses

| Fitur | Super Admin | Dosen (tanpa role PIC) | Dosen (dengan role PIC) |
|---|:---:|:---:|:---:|
| CRUD PLO & CLO (per periode) | ✅ | ✅ | ✅ |
| Upload Soal (PDF, sesuai matkul yang diampu) | ❌ | ✅ | ✅ |
| Kelola Periode & Deadline | ✅ | ❌ | ❌ |
| Kelola Kategori/Template Soal (PDF) | ✅ | ❌ | ❌ |
| Kelola Pemetaan Dosen ↔ Mata Kuliah | ✅ | ❌ | ❌ |
| Berikan Role PIC ke Dosen | ✅ | ❌ | ❌ |
| Verifikasi Soal (approve/revisi/reject) | ❌ | ❌ | ✅ (semua soal dalam periode tugasnya) |
| Monitoring/Dashboard Progres Verifikasi | ✅ (semua periode) | ❌ | ✅ (periode tempat dia jadi PIC) |
| Generate & Print Berita Acara | ✅ (semua) | ❌ | ✅ (miliknya) |
| Kirim Broadcast | ✅ | ❌ | ❌ |

---

## 3. Proses Bisnis

### Tahap 1 — Persiapan Periode (Super Admin)
1. Super Admin membuat **Periode** baru (tentukan jenis semester: ganjil/genap) beserta **tenggat waktu (deadline)** upload soal.
2. Super Admin menyiapkan/memilih **Kategori & Template** soal (format PDF) yang berlaku untuk periode tersebut.
3. Super Admin membuat **pemetaan dosen ↔ mata kuliah** untuk periode ini (menentukan dosen mana mengampu mata kuliah apa) — pemetaan ini fleksibel dan bisa diedit kapan saja oleh Super Admin.
4. Super Admin mengirim **Broadcast** pemberitahuan ke seluruh dosen terkait pembukaan periode dan deadline.

### Tahap 2 — Upload Soal (Dosen)
5. Dosen login. Jika Dosen LB, sistem otomatis mengecek apakah jenis semester periode aktif sesuai dengan penugasannya — jika tidak sesuai, menu upload tidak tersedia.
6. Dosen melengkapi **PLO** dan **CLO** untuk periode aktif (data ini spesifik per periode, tidak otomatis terbawa dari periode sebelumnya).
7. Dosen mengunduh template (PDF), menyusun soal dalam format PDF, lalu mengunggahnya ke sistem sebelum deadline — hanya bisa memilih mata kuliah yang sesuai dengan pemetaan dosen↔matkul miliknya di periode ini.
8. Status soal otomatis menjadi `submitted`.

### Tahap 3 — Pemberian Role PIC (Super Admin)
9. Menjelang/setelah deadline, Super Admin memberikan **role PIC** kepada 4–5 dosen terpilih untuk periode tersebut — pencarian dosen dilakukan berdasarkan **kode dosen** dan **nama lengkap**.
10. Dosen yang diberi role ini otomatis mendapat akses penuh: verifikasi seluruh soal dalam periode tersebut + dashboard monitoring progres.

### Tahap 4 — Verifikasi (Dosen dengan role PIC)
11. Dosen dengan role PIC login dan melihat **seluruh soal** yang perlu diverifikasi dalam periode tugasnya (tidak dibatasi ke dosen tertentu).
12. PIC memverifikasi tiap soal dengan hasil: **approve**, **minta revisi**, atau **reject**, disertai catatan.
13. Jika soal diminta revisi, dosen pemilik soal mengunggah ulang (tetap PDF), status kembali ke `submitted`, dan masuk antrian verifikasi lagi.

### Tahap 5 — Monitoring Progres (Dosen dengan role PIC)
14. Dosen dengan role PIC dapat memantau progres verifikasi keseluruhan (dashboard rekap per mata kuliah/status) untuk periode tempat dia bertugas — fitur ini yang sebelumnya dianggap terpisah sebagai "Coordinator".

### Tahap 6 — Dokumentasi
15. Setelah proses verifikasi selesai, sistem **secara otomatis men-generate Berita Acara** berdasarkan snapshot data verifikasi (siapa PIC, soal-soal apa saja yang diverifikasi, hasil verifikasi, tanggal pelaksanaan) — data ini **tidak berubah lagi** meskipun ada soal yang direvisi lagi setelahnya.
16. Dosen dengan role PIC dapat **mencetak** dokumen dengan tiga opsi: **BA saja**, **Soal saja**, atau **BA + Soal (gabungan)**.

---

## 4. Fitur per Role

### Super Admin
- Dashboard ringkasan progres upload & verifikasi seluruh periode
- Manajemen akun dosen (kode dosen, nama, tipe dosen Biasa/LB, prodi)
- Manajemen Periode & Deadline (dengan jenis semester ganjil/genap)
- Manajemen Kategori/Template Soal (validasi PDF)
- Manajemen pemetaan Dosen ↔ Mata Kuliah per periode
- Pemberian role PIC ke dosen terpilih (pencarian via kode/nama)
- Kirim & kelola Broadcast pemberitahuan
- Melihat & mengunduh rekap seluruh Berita Acara

### Dosen (Biasa & LB — base role)
- CRUD PLO (Program Learning Outcome) khusus periode aktif
- CRUD CLO (Course Learning Outcome) khusus periode aktif, terhubung ke PLO dan mata kuliah
- Upload soal (PDF) sesuai kategori, template, dan mata kuliah yang diampu, sebelum deadline
- Melihat status soal sendiri (draft/submitted/in review/revisi/approved/rejected)
- Menerima notifikasi broadcast dari Super Admin
- *(Khusus Dosen LB)* akses upload/interaksi soal hanya tersedia saat periode aktif sesuai jenis semester penugasannya

### Dosen dengan Role PIC (Muncul sebagai menu tambahan saat role aktif di periode berjalan)
- Melihat **seluruh** soal yang perlu diverifikasi dalam periode tugasnya
- Melakukan verifikasi (approve/revisi/reject) disertai catatan
- Melihat riwayat verifikasi yang sudah dilakukan
- **Dashboard monitoring progres verifikasi** (per mata kuliah/status) — fitur yang sebelumnya disebut terpisah sebagai "Coordinator"
- Generate & Print Berita Acara (BA saja/Soal saja/Keduanya)

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
│   │   │       ├── EnsureIsSuperAdmin.php
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
│   │   │   │   ├── SuperAdminLayout.tsx
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
│   │           │   ├── SuperAdminDashboard.tsx
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

## 8. Entitas Data Utama

```
User
- id, uuid, kode_dosen, nama_lengkap, email, password
- prodi_id (FK)
- tipe_dosen: enum('biasa','lb')
- semester_lb: enum('ganjil','genap') nullable   // hanya untuk Dosen LB
- is_super_admin (bool)
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

## 10. Catatan Pengembangan

Hal-hal yang sudah difinalisasi melalui diskusi sebelumnya:

- ✅ Role Coordinator dihapus, seluruh fiturnya melebur ke role PIC
- ✅ Dosen LB dibatasi aktif hanya di satu jenis semester (ganjil/genap)
- ✅ Format kode dosen & kode mata kuliah menggunakan huruf, pemetaan per periode dan editable oleh Super Admin
- ✅ Soal dan template wajib PDF
- ✅ Sistem role menggunakan pendekatan hybrid: boolean (`is_super_admin`) untuk role permanen, tabel `user_roles` untuk role dinamis (`pic`)
- ✅ Scope verifikasi PIC: seluruh soal dalam periode aktif (tanpa filter prodi, karena aplikasi memang fokus untuk Prodi Sistem Informasi)
- ✅ PLO dan CLO di-scope per periode

Hal yang masih bisa didiskusikan lebih lanjut ke depannya (opsional, bukan blocker):

1. Apakah perlu fitur **duplikasi PLO/CLO dari periode sebelumnya** supaya dosen tidak input dari nol tiap semester?
2. Format pasti `kode_dosen` dan `kode_mk` (pola huruf seperti apa) — saat ini kolom dibuat fleksibel (`varchar`, tanpa regex ketat) sampai format resmi dari institusi tersedia.
3. Validasi jumlah PIC per periode (4–5 dosen) — apakah perlu hard-block di sistem, atau cukup warning ke Super Admin jika belum terpenuhi?
4. Mode autentikasi Sanctum — SPA (cookie-based) atau token-based, tergantung apakah frontend dan backend di-deploy pada domain yang sama atau berbeda. Perlu dipastikan konfigurasi `SANCTUM_STATEFUL_DOMAINS` dan CORS sejak awal.
