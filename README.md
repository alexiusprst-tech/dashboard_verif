# Sistem Verifikasi Soal

Website untuk mengelola proses upload, verifikasi, dan dokumentasi (Berita Acara) soal ujian di lingkungan akademik. Sistem mendukung penugasan dosen sebagai verifikator secara dinamis pada setiap periode, sehingga proses verifikasi, monitoring, dan dokumentasi dapat dilakukan secara terstruktur, transparan, dan terdokumentasi dengan baik.
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
- [11. Peraturan Bisnis](#11-peraturan-bisnis)
- [12. Error Handling](#12-error-handling)
- [13. Master Data](#13-master-data)
---

## 1. Ringkasan Sistem

Sistem ini dibangun untuk mendigitalkan proses upload, verifikasi, dan dokumentasi soal ujian di lingkungan akademik. Pada setiap periode akademik (misalnya UTS atau UAS), dosen mengunggah soal sesuai kategori dan template yang telah ditentukan. Selanjutnya, Super Admin menugaskan beberapa dosen sebagai verifikator untuk melakukan proses pemeriksaan terhadap soal dari dosen yang menjadi tanggung jawabnya. Penugasan tersebut bersifat dinamis dan hanya berlaku pada periode yang ditentukan.

Seluruh proses verifikasi terdokumentasi secara otomatis oleh sistem dan menghasilkan Berita Acara (BA) yang dapat diunduh sebagai dokumen resmi.

Sistem ini memiliki beberapa karakteristik utama yang membedakannya dari aplikasi CRUD biasa, yaitu:

Verifikator bukan merupakan role permanen. Setiap dosen dapat ditugaskan sebagai verifikator pada periode tertentu melalui mekanisme penugasan oleh Super Admin. Setelah periode berakhir, status tersebut otomatis tidak berlaku.
Penugasan verifikator bersifat spesifik. Setiap verifikator bertanggung jawab memeriksa soal dari dosen-dosen tertentu yang telah ditetapkan oleh Super Admin, sehingga proses verifikasi menjadi lebih terstruktur dan mudah dipantau.
Berita Acara dihasilkan secara otomatis berdasarkan data hasil verifikasi, tanpa memerlukan pengisian dokumen secara manual, sehingga lebih konsisten, efisien, dan mudah diaudit.
Seluruh proses dapat dimonitor secara real-time, mulai dari progres upload soal, proses verifikasi, hingga penyelesaian dokumentasi pada setiap periode akademik.

Poin penting yang membedakan sistem ini dari sistem CRUD biasa:

Verifikator bukan merupakan role permanen. Setiap dosen dapat ditugaskan sebagai verifikator pada periode tertentu melalui mekanisme penugasan oleh Super Admin. Penugasan tersebut hanya berlaku pada periode yang dipilih dan dapat berubah pada periode berikutnya.
Berita Acara dihasilkan secara otomatis berdasarkan data hasil verifikasi, sehingga tidak memerlukan pengisian dokumen secara manual. Pendekatan ini menjaga konsistensi dokumen, mempercepat proses administrasi, dan memudahkan proses audit.
Penugasan verifikator bersifat spesifik (granular). Setiap dosen yang ditugaskan sebagai verifikator hanya bertanggung jawab memverifikasi soal dari dosen-dosen tertentu yang telah ditetapkan oleh Super Admin berdasarkan kode dosen dan nama lengkap, sehingga proses verifikasi lebih terstruktur dan mudah dipantau.

---

## 2. Role & Hak Akses

| Role            | Sifat                | Deskripsi Singkat
| **Super Admin** | Permanen             | Mengelola keseluruhan sistem, termasuk manajemen pengguna, periode akademik, deadline, penugasan verifikator, kategori dan template soal, broadcast, monitoring, serta laporan.         |
| **Dosen**       | Permanen (Base Role) | Role dasar seluruh pengguna non-admin. Mengelola PLO, CLO, mengunggah soal, memantau status verifikasi, dan **dapat memperoleh tugas sebagai verifikator (PIC)** pada periode tertentu. |
| **Coordinator** | Permanen             | Melakukan monitoring proses upload dan verifikasi soal, melihat statistik, progres, serta laporan tanpa terlibat langsung dalam proses operasional.                                     |



> **Catatan penting:** PIC (Person in Charge) bukan merupakan role permanen, melainkan status penugasan yang diberikan kepada dosen oleh Super Admin pada periode tertentu. Selama penugasan masih aktif, dosen akan memperoleh menu tambahan untuk melakukan verifikasi soal, melihat daftar penugasan, serta menghasilkan Berita Acara. Setelah periode berakhir atau penugasan dicabut, menu tersebut otomatis tidak lagi ditampilkan.

| Fitur                                                         | Super Admin | Dosen |   Coordinator  |
| ------------------------------------------------------------- | :---------: | :---: | :------------: |
| Dashboard                                                     |      ✅      |   ✅   |        ✅       |
| Statistik Sistem                                              |      ✅      |   ❌   |        ✅       |
| Statistik Soal Pribadi                                        |      ❌      |   ✅   |        ❌       |
| Upload Soal                                                   |      ❌      |   ✅   |        ❌       |
| Status Upload                                                 |      ❌      |   ✅   |        ❌       |
| Revisi Soal                                                   |      ❌      |   ✅   |        ❌       |
| Riwayat Upload                                                |      ❌      |   ✅   |        ❌       |
| Verifikasi Soal *(jika sedang ditugaskan sebagai PIC)*        |      ❌      |   ✅   |        ❌       |
| Melihat Assignment PIC *(jika sedang ditugaskan sebagai PIC)* |      ❌      |   ✅   |        ❌       |
| Generate Berita Acara *(jika sedang ditugaskan sebagai PIC)*  |      ✅      |   ✅   |        ❌       |
| Broadcast                                                     |      ✅      |   ✅   |        ✅       |
| Deadline                                                      |      ✅      |   ✅   |        ✅       |
| Assignment PIC                                                |      ✅      |   ❌   | ✅ (monitoring) |
| Monitoring Seluruh Proses                                     |      ✅      |   ❌   |        ✅       |
| Grafik Progress                                               |      ✅      |   ❌   |        ✅       |
| Export Laporan                                                |      ✅      |   ❌   |        ✅       |


---

## 3. Proses Bisnis

Berikut alur end-to-end sistem, mulai dari pembukaan periode hingga proses dokumentasi Berita Acara selesai.

Tahap 1 — Persiapan Periode (Super Admin)
Super Admin membuat Periode baru beserta tenggat waktu (deadline) pengumpulan soal.
Super Admin menentukan Kategori Soal dan Template Soal yang akan digunakan pada periode tersebut.
Super Admin mengirimkan Broadcast kepada seluruh dosen atau program studi tertentu sebagai pemberitahuan dimulainya periode upload soal beserta informasi deadline.
Tahap 2 — Upload Soal (Dosen)
Dosen login ke sistem.
Dosen melengkapi atau memperbarui data PLO (Program Learning Outcome) dan CLO (Course Learning Outcome) apabila belum tersedia.
Dosen mengunduh template soal sesuai kategori yang ditentukan.
Dosen menyusun dan mengunggah soal sebelum batas waktu yang telah ditetapkan.
Setiap soal wajib dikaitkan dengan:
Mata Kuliah
CLO
Periode
Kategori Soal
Setelah berhasil diunggah, status soal otomatis berubah menjadi Submitted.
Tahap 3 — Penugasan PIC (Super Admin)
Setelah masa upload selesai atau mendekati deadline, Super Admin melakukan penugasan PIC (Person in Charge).
PIC dipilih dari akun dosen yang sudah terdaftar pada sistem.
Penugasan PIC bersifat sementara dan hanya berlaku pada periode yang dipilih.
Super Admin menentukan dosen mana saja yang menjadi tanggung jawab setiap PIC berdasarkan:
Kode Dosen
Nama Dosen
Satu PIC dapat menangani verifikasi beberapa dosen.
Dalam satu periode, setiap dosen hanya memiliki satu PIC yang bertanggung jawab melakukan verifikasi.

Catatan: PIC bukan merupakan role permanen, melainkan penugasan yang melekat pada akun dosen selama periode tertentu.

Tahap 4 — Verifikasi Soal
Dosen yang sedang mendapatkan penugasan sebagai PIC akan memperoleh menu tambahan Verifikasi Soal pada dashboardnya.
PIC melihat daftar soal yang menjadi tanggung jawabnya berdasarkan data penugasan.
PIC melakukan proses verifikasi terhadap setiap soal dengan memilih salah satu hasil berikut:
Approve
Revisi
Reject
Setiap proses verifikasi wajib disertai catatan sebagai dokumentasi hasil pemeriksaan.
Setelah dilakukan verifikasi, status soal akan berubah sesuai keputusan PIC.
Tahap 5 — Revisi Soal
Jika hasil verifikasi adalah Revisi, maka status soal berubah menjadi Revisi.
Dosen melakukan perbaikan terhadap soal sesuai catatan dari PIC.
Dosen mengunggah kembali file soal hasil revisi.
Status soal kembali menjadi Submitted dan otomatis masuk kembali ke antrean verifikasi PIC yang sama.
Siklus revisi dapat berlangsung berulang hingga soal dinyatakan Approved atau Rejected.
Tahap 6 — Monitoring (Coordinator)
Coordinator memantau keseluruhan progres proses upload dan verifikasi melalui dashboard monitoring.
Coordinator dapat melihat statistik berdasarkan:
Program Studi
Mata Kuliah
Periode
Status Verifikasi
Coordinator hanya berperan sebagai pengawas (monitoring) dan tidak terlibat langsung dalam proses verifikasi maupun perubahan data soal.
Tahap 7 — Dokumentasi Berita Acara
Setelah seluruh proses verifikasi selesai, sistem secara otomatis menghasilkan Berita Acara (BA) berdasarkan data verifikasi.
Data yang digunakan meliputi:
Periode
Dosen yang ditugaskan sebagai PIC
Daftar dosen yang diverifikasi
Daftar soal
Hasil verifikasi
Catatan verifikasi
Tanggal pelaksanaan
Nomor Berita Acara
Berita Acara dibuat secara otomatis oleh sistem menggunakan template yang telah ditentukan sehingga tidak memerlukan pengisian manual.
Tahap 8 — Cetak Dokumen
Dosen yang sedang bertugas sebagai PIC dapat mencetak dokumen hasil verifikasi melalui sistem.
Sistem menyediakan tiga pilihan dokumen yang dapat diunduh:
Berita Acara (BA)
Soal
Berita Acara + Soal (Gabungan)
Seluruh dokumen dihasilkan dalam format PDF melalui backend menggunakan DomPDF, sehingga format dokumen tetap konsisten dan mudah diaudit.
---

#Super Admin

Fokus: Mengelola seluruh sistem, mengatur periode akademik, melakukan penugasan PIC, serta memonitor keseluruhan proses verifikasi soal.

Fitur
Dashboard ringkasan sistem
Manajemen akun dosen
Manajemen Program Studi
Manajemen Mata Kuliah
Manajemen Periode Akademik
Manajemen Deadline Upload Soal
Manajemen Kategori Soal
Manajemen Template Soal
Penugasan PIC pada setiap periode
Pencarian dosen berdasarkan kode dosen atau nama
Manajemen Broadcast
Monitoring progres upload dan verifikasi
Melihat seluruh aktivitas sistem
Generate seluruh Berita Acara
Export laporan
Melihat Audit Log

Dosen

Fokus: Mengelola data pembelajaran, mengunggah soal, memantau status verifikasi, serta melakukan proses verifikasi apabila sedang mendapatkan penugasan sebagai PIC.

Fitur Dasar
Dashboard pribadi
CRUD Program Learning Outcome (PLO)
CRUD Course Learning Outcome (CLO)
Upload soal
Download template soal
Melihat status soal
Revisi soal
Riwayat upload soal
Melihat broadcast
Melihat deadline upload
Melihat notifikasi
Fitur Tambahan (Saat Ditugaskan sebagai PIC)

Menu berikut muncul secara otomatis apabila dosen sedang mendapatkan penugasan sebagai PIC pada periode aktif.

Dashboard Verifikasi
Melihat daftar soal yang menjadi tanggung jawab
Melakukan verifikasi soal
Memberikan hasil verifikasi:
Approve
Revisi
Reject
Memberikan catatan verifikasi
Melihat riwayat verifikasi
Generate Berita Acara
Print Berita Acara
Print Soal
Print Berita Acara + Soal

Catatan: Fitur verifikasi hanya tersedia selama dosen memiliki penugasan sebagai PIC pada periode yang sedang berlangsung. Setelah penugasan berakhir, menu tersebut otomatis tidak lagi ditampilkan.

Coordinator

Fokus: Melakukan monitoring terhadap proses upload dan verifikasi soal tanpa terlibat langsung dalam proses operasional.

Fitur
Dashboard monitoring
Monitoring progres upload soal
Monitoring progres verifikasi soal
Statistik berdasarkan Program Studi
Statistik berdasarkan Mata Kuliah
Statistik berdasarkan Periode
Monitoring aktivitas verifikasi
Monitoring assignment PIC
Melihat detail status setiap soal
Monitoring deadline
Grafik progres sistem
Export laporan monitoring

Opsional: Coordinator dapat diberikan hak untuk melakukan approval tambahan apabila kebijakan institusi mengharuskannya sebagai lapisan verifikasi kedua.

---

Status soal menggambarkan siklus hidup sebuah soal mulai dari proses penyusunan hingga selesai diverifikasi. Setiap perubahan status dilakukan berdasarkan aksi pengguna sesuai hak akses yang dimiliki.

Draft
   │
   ▼
Submitted
   │
   ▼
In Review
   │
   ├───────────────┬────────────────┐
   ▼               ▼                ▼
Approved        Revisi         Rejected
                    │
                    ▼
              Submitted
                    │
                    ▼
                In Review
Penjelasan Status
Status	Keterangan
Draft	Soal masih disusun oleh dosen dan belum dikirim untuk proses verifikasi.
Submitted	Soal telah berhasil diunggah dan menunggu proses verifikasi oleh dosen yang sedang ditugaskan sebagai PIC.
In Review	Soal sedang diperiksa oleh dosen yang mendapatkan penugasan sebagai PIC pada periode aktif.
Approved	Soal telah memenuhi seluruh ketentuan dan dinyatakan lolos verifikasi.
Revisi	Soal memerlukan perbaikan sesuai catatan hasil verifikasi.
Rejected	Soal ditolak karena tidak memenuhi ketentuan atau tidak layak digunakan.
Alur Revisi

Apabila hasil verifikasi adalah Revisi, maka proses berjalan sebagai berikut:

Revisi
   │
   ▼
Dosen melakukan perbaikan
   │
   ▼
Upload ulang soal
   │
   ▼
Submitted
   │
   ▼
In Review

Siklus revisi dapat terjadi lebih dari satu kali hingga soal memperoleh status Approved atau Rejected.

## 6. Tech Stack

### Frontend
- React + Vite + TypeScript
- React Router — routing & route guard per role
- Tailwind CSS — styling
- Shadcn UI — komponen UI
- Axios Instance — HTTP client dengan interceptor token
- TanStack Query — data fetching, caching, mutation
- Feature-based Folder Structure

### Backend
- Laravel 12
- Sanctum — autentikasi SPA/token
- Pola Controller → Service → Repository → Model
- Form Request Validation
- API Resource untuk format response
- PostgreSQL sebagai database

---

## 7. Struktur Proyek

Struktur ini menggabungkan frontend dan backend dalam satu monorepo agar mudah dipahami sebagai satu kesatuan sistem. Backend dan frontend tetap berjalan sebagai dua service terpisah (backend sebagai REST API, frontend sebagai SPA yang mengonsumsinya).

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
│   │   │   │   ├── PenugasanPicController.php
│   │   │   │   ├── VerifikasiController.php
│   │   │   │   ├── BeritaAcaraController.php
│   │   │   │   ├── BroadcastController.php
│   │   │   │   └── DashboardController.php
│   │   │   │
│   │   │   ├── Requests/
│   │   │   │   ├── Plo/{Store,Update}PloRequest.php
│   │   │   │   ├── Clo/{Store,Update}CloRequest.php
│   │   │   │   ├── Soal/{Store,Update}SoalRequest.php
│   │   │   │   ├── PenugasanPic/StorePenugasanRequest.php
│   │   │   │   ├── Verifikasi/StoreVerifikasiRequest.php
│   │   │   │   └── Broadcast/StoreBroadcastRequest.php
│   │   │   │
│   │   │   ├── Resources/
│   │   │   │   ├── UserResource.php
│   │   │   │   ├── PloResource.php
│   │   │   │   ├── CloResource.php
│   │   │   │   ├── SoalResource.php
│   │   │   │   ├── PenugasanPicResource.php
│   │   │   │   ├── VerifikasiResource.php
│   │   │   │   └── BeritaAcaraResource.php
│   │   │   │
│   │   │   └── Middleware/
│   │   │       ├── EnsureIsSuperAdmin.php
│   │   │       ├── EnsureIsPicForPeriode.php   # cek assignment dinamis
│   │   │       └── EnsureIsCoordinator.php
│   │   │
│   │   ├── Services/
│   │   │   ├── PloService.php
│   │   │   ├── CloService.php
│   │   │   ├── PeriodeService.php
│   │   │   ├── SoalService.php
│   │   │   ├── PenugasanPicService.php
│   │   │   ├── VerifikasiService.php
│   │   │   ├── BeritaAcaraService.php          # logic generate PDF
│   │   │   └── BroadcastService.php
│   │   │
│   │   ├── Repositories/
│   │   │   ├── Contracts/
│   │   │   │   ├── PloRepositoryInterface.php
│   │   │   │   ├── SoalRepositoryInterface.php
│   │   │   │   ├── PenugasanPicRepositoryInterface.php
│   │   │   │   └── VerifikasiRepositoryInterface.php
│   │   │   └── Eloquent/
│   │   │       ├── PloRepository.php
│   │   │       ├── SoalRepository.php
│   │   │       ├── PenugasanPicRepository.php
│   │   │       └── VerifikasiRepository.php
│   │   │
│   │   ├── Models/
│   │   │   ├── User.php
│   │   │   ├── Plo.php
│   │   │   ├── Clo.php
│   │   │   ├── Periode.php
│   │   │   ├── KategoriTemplate.php
│   │   │   ├── Soal.php
│   │   │   ├── PenugasanPic.php
│   │   │   ├── Verifikasi.php
│   │   │   ├── BeritaAcara.php
│   │   │   └── Broadcast.php
│   │   │
│   │   ├── Enums/
│   │   │   ├── SoalStatus.php          # Draft, Submitted, InReview, Revisi, Approved, Rejected
│   │   │   ├── VerifikasiStatus.php
│   │   │   └── PrintType.php           # BA_ONLY, SOAL_ONLY, BOTH
│   │   │
│   │   └── Providers/
│   │       └── RepositoryServiceProvider.php
│   │
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
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
│   │   │   │   ├── ProtectedRoute.tsx          # guard per role + PIC assignment
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
│   │   │   │   └── PicLayout.tsx
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
│   │       │   ├── pages/PloCloPage.tsx
│   │       │   └── types/plo-clo.types.ts
│   │       │
│   │       ├── periode/
│   │       │   ├── api/periodeApi.ts
│   │       │   ├── hooks/usePeriodeList.ts
│   │       │   ├── components/PeriodeFormDialog.tsx
│   │       │   ├── pages/PeriodeManagementPage.tsx
│   │       │   └── types/periode.types.ts
│   │       │
│   │       ├── soal/
│   │       │   ├── api/soalApi.ts
│   │       │   ├── hooks/{useSoalList,useUploadSoal,useSoalStatus}.ts
│   │       │   ├── components/{UploadSoalForm,SoalTemplateDownload,SoalStatusBadge}.tsx
│   │       │   ├── pages/{UploadSoalPage,SoalListPage}.tsx
│   │       │   └── types/soal.types.ts
│   │       │
│   │       ├── penugasan-pic/
│   │       │   ├── api/penugasanPicApi.ts
│   │       │   ├── hooks/{useDosenSearch,useAssignPic}.ts   # search by kode dosen + nama
│   │       │   ├── components/{DosenSearchCombobox,PicAssignmentTable}.tsx
│   │       │   ├── pages/AssignPicPage.tsx
│   │       │   └── types/penugasan.types.ts
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
│   │           ├── components/{SuperAdminDashboard,DosenDashboard,PicDashboard,CoordinatorDashboard}.tsx
│   │           └── pages/DashboardPage.tsx
│   │
│   ├── index.html
│   └── vite.config.ts
│
└── README.md
```

---

## 8. Entitas Data Utama

```
User

id
uuid
kode_dosen
nama_lengkap
email
password
prodi_id (FK)

is_super_admin
is_coordinator

status_aktif

last_login_at

created_at
updated_at
deleted_at

Relasi

User memiliki banyak PLO
User memiliki banyak CLO
User memiliki banyak Soal
User dapat menjadi PIC melalui PenugasanPIC
User memiliki banyak Broadcast (creator)

Program Studi

id
kode_prodi
nama_prodi

created_at
updated_at

Mata Kuliah

id
kode_mk
nama_mk
prodi_id (FK)

created_at
updated_at

PLO

id
kode
deskripsi

prodi_id (FK)

created_by (FK User)

created_at
updated_at

CLO

id
kode
deskripsi

mata_kuliah_id (FK)

plo_id (FK)

created_by (FK User)

created_at
updated_at

Periode

id
nama_periode

semester

tahun_akademik

tanggal_mulai

tanggal_deadline

status

Kategori Soal

id

nama_kategori

deskripsi

created_at
updated_at

Template Soal

id

kategori_id (FK)

nama_file

file_path

versi

created_at
updated_at

Soal

id

uuid

dosen_id (FK)

mata_kuliah_id (FK)

clo_id (FK)

periode_id (FK)

kategori_id (FK)

template_id (FK)

judul_soal

file_soal

versi

status

uploaded_at

created_at
updated_at

Penugasan Dosen

id

periode_id (FK)

pic_dosen_id (FK User)

target_dosen_id (FK User)

assigned_by (FK User)

assigned_at

created_at
updated_at

Verifikasi

id

soal_id (FK)

pic_id (FK User)

status

catatan

verified_at

created_at
updated_at

Berita Acara

id

nomor_ba

periode_id (FK)

pic_id (FK User)

generated_at

file_pdf

created_at
updated_at

Broadcast

id

judul

isi

target

prodi_id (nullable)

periode_id (nullable)

created_by (FK User)

published_at

created_at
updated_at

Notifikasi

id

user_id (FK)

judul

pesan

tipe

is_read

reference_type

reference_id

created_at

Activity Log

id

user_id (FK)

aktivitas

modul

ip_address

user_agent

created_at

Riwayat Revisi

id

soal_id (FK)

versi

file_soal

catatan_pic

uploaded_by

uploaded_at

ProgramStudi
      │
      │
      ▼
User────────────┐
 │              │
 │              │
 ▼              ▼
PLO          PenugasanPIC
 │          ▲          ▲
 ▼          │          │
CLO         │          │
 │          │          │
 ▼          │          │
MataKuliah  │          │
 │          │          │
 ▼          │          │
Soal────────┘          │
 │                     │
 ▼                     │
Verifikasi─────────────┘
 │
 ▼
BeritaAcara

KategoriSoal
      │
      ▼
TemplateSoal
      │
      ▼
Soal

Periode
   │
   ├────────► Soal
   ├────────► Broadcast
   ├────────► PenugasanPIC
   └────────► BeritaAcara

User
 ├────────► Broadcast
 ├────────► ActivityLog
 ├────────► Notifikasi
 └────────► RiwayatRevisi

--- 

## 9. Alur Berita Acara

Berita Acara dirancang sebagai dokumen yang di-generate otomatis (bukan diketik manual), dengan pendekatan template + mail merge:

1. Setelah proses verifikasi soal seorang dosen selesai (oleh PIC tertentu), sistem mengumpulkan data:
   - Nama & kode dosen PIC yang bertugas
   - Daftar dosen & soal yang diverifikasi beserta hasilnya (approve/revisi/reject)
   - Tanggal pelaksanaan verifikasi
   - Nomor BA (auto-increment per periode)
2. Data tersebut dirender ke template dokumen (PDF) melalui backend.
3. PIC dapat memilih opsi cetak:
   - **BA saja**
   - **Soal saja**
   - **BA + Soal (gabungan)**
4. Dokumen di-generate di sisi backend agar konsisten dan dapat diaudit (bukan dirender di frontend), lalu diunduh oleh PIC melalui tombol print/download.

---

## 10. Catatan Pengembangan

Beberapa hal yang perlu disepakati/diputuskan sebelum atau selama development:

1. **Peran Coordinator** — apakah berfungsi sebagai lapisan approval kedua setelah PIC (soal harus melalui Coordinator sebelum benar-benar final), atau murni sebagai pemantau progres tanpa hak approval.
2. **Rangkap peran** — apakah seorang dosen yang sedang menjadi PIC di suatu periode tetap boleh mengunggah soal miliknya sendiri di periode yang sama, dan apakah boleh menjadi PIC untuk lebih dari satu kelompok dosen sekaligus.
3. **Format template soal** — apakah upload berupa file bebas (Word/PDF mengikuti template), atau input terstruktur langsung di form web.
4. **Mekanisme revisi** — apakah ada batas jumlah revisi per soal, atau bisa berulang tanpa batas hingga disetujui.
5. **Mode autentikasi Sanctum** — SPA (cookie-based) atau token-based, tergantung apakah frontend dan backend di-deploy pada domain yang sama atau berbeda. Perlu dipastikan konfigurasi `SANCTUM_STATEFUL_DOMAINS` dan CORS sejak awal.

# 11. Business Rules

## Upload Soal

- Upload hanya dapat dilakukan pada periode aktif.
- Deadline ditentukan oleh Super Admin.
- File maksimal 20 MB.
- Format PDF/DOCX.
- Wajib memilih CLO.
- Draft dapat diubah.
- Submitted tidak dapat diubah kecuali direvisi.

---

## Penugasan Dosen (PIC)

- PIC hanya dapat ditentukan oleh Super Admin.
- PIC tidak boleh memverifikasi soal miliknya sendiri.
- Penugasan hanya berlaku satu periode.
- Penugasan dapat diubah sebelum verifikasi dimulai.

---

## Verifikasi

- Approve
- Revisi
- Reject

Catatan wajib ketika memilih Revisi atau Reject.

---

## Berita Acara

- Nomor otomatis.
- Generate otomatis.
- Tidak dapat diedit manual.

## 12. Error Handling

400

Data tidak valid

401

Belum login

403

Tidak punya akses

404

Data tidak ditemukan

422

Validation Error

500

Server Error

## 13. Master Data

- User
- Fakultas
- Program Studi
- Mata Kuliah
- Semester
- Tahun Akademik
- Periode
- Template Soal
- Kategori Soal
- PLO
- CLO

