# AGENTS.md — Website Verifikator (Sistem Verifikasi Soal)

> README untuk AI coding agent. Setiap aturan di bawah punya penanda sumber di akhir baris:
> `[BR]` = notulensi/business rule, `[AUDIT]` = temuan audit teknis, `[DB]` = laporan agent
> dari baca kode langsung, `[SPEC]` = keputusan Tech Spec yang sudah diterima final,
> `[UC]` = use case diagram. Bagian bertanda `NEEDS CONFIRMATION` belum boleh dianggap fakta
> yang tidak perlu dicek ulang — verifikasi langsung ke kode sebelum eksekusi di area itu.

---

## 1. Project Overview

Website Verifikator mendigitalkan proses verifikasi soal ujian pada Program Studi Sistem
Informasi: pengelolaan data akademik (Mata Kuliah, PLO, CLO), penugasan dosen (Koordinator,
Verifikator), upload soal PDF, workflow verifikasi, dan pembuatan Berita Acara. `[BR]` `[UC]`

---

## 2. Tech Stack

**Frontend**: React 19, TypeScript, Vite, TailwindCSS 4, React Router 7, React Query,
Shadcn UI. `[AUDIT]`

**Backend**: Laravel 12, PHP 8.2, Laravel Sanctum. `[AUDIT]`

**Database**: Relational. Engine pasti (PostgreSQL/MySQL) `NEEDS CONFIRMATION` — jika
belum terpasang di produksi, gunakan PostgreSQL sebagai default baru. Jika sudah terpasang
MySQL, **jangan migrasi engine**. `[AUDIT]` `[SPEC]`

**Tambahan wajib untuk fitur baru**: Laravel Queue (database driver) untuk generate PDF
Berita Acara — jangan generate PDF secara sinkron di request cycle. `[SPEC]`

**Dilarang**: mengganti stack pada layer manapun tanpa requirement eksplisit baru. Tidak
ada requirement dari BR, use case, atau audit yang membutuhkan penggantian stack. `[SPEC]`

---

## 3. Architecture

Pola wajib, berlaku untuk seluruh modul baru maupun hasil refactor closure:

```
Route → Middleware → FormRequest → Controller → Service → Repository → Model → Database
```

`[AUDIT]` `[SPEC]`

Closure business logic di `routes/api.php` (area Course dan CLO assignment) adalah
technical debt yang harus dipindahkan ke pola di atas saat disentuh — bukan pola yang
boleh ditiru untuk kode baru. `[AUDIT]` Finding C-01.

**Dilarang**: membuat pola arsitektur baru (CQRS, event sourcing, dsb.) untuk menutup
technical debt ini. Skala masalahnya tidak sepadan dengan kompleksitas tambahan itu. `[SPEC]`

---

## 4. Project Structure

### 4.1 Backend — struktur wajib untuk modul baru

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── KoordinatorAssignmentController.php
│   │   │   ├── SoalKategoriController.php
│   │   │   └── CourseCloAssignmentController.php
│   │   └── Requests/
│   │       ├── StoreKoordinatorAssignmentRequest.php
│   │       ├── UpdateKoordinatorAssignmentRequest.php
│   │       └── StoreCourseCloAssignmentRequest.php
│   ├── Models/
│   │   ├── KoordinatorAssignment.php
│   │   └── SoalKategori.php
│   ├── Services/
│   │   ├── KoordinatorAssignmentService.php
│   │   └── CourseCloAssignmentService.php
│   └── Repositories/
│       └── KoordinatorAssignmentRepository.php
└── routes/
    └── api.php   (closure Course-CLO dipindahkan keluar; endpoint lain tidak disentuh)
```

`[SPEC]`. **Sebelum membuat file di atas**: cek dulu apakah `KoordinatorAssignment.php`
model dan tabel terkait sudah ada (lihat Section 7) — jangan duplikasi jika sudah ada.

### 4.2 Frontend — struktur wajib untuk modul baru

```
frontend/src/
├── pages/
│   ├── super-admin/    (MasterDataPage, TahunAjaranPage, KategoriSoalPage, PenugasanVerifikatorPage)
│   ├── koordinator/    (UploadSoalPage, TemplateSoalPage, StatusVerifikasiPage)
│   └── verifikator/    (VerifikasiSoalPage)
├── components/
│   ├── master-data/    (CloForm, PloForm, MataKuliahForm, DosenForm)
│   ├── assignment/     (KoordinatorAssignmentForm, VerifikatorAssignmentForm, MataKuliahPicker)
│   ├── soal/           (SoalUploadForm, SoalRevisiForm)
│   ├── verifikasi/     (CatatanVerifikasiForm, BeritaAcaraPrintButton)
│   └── shared/         (RoleGuard)
├── contexts/
│   └── SemesterContext.tsx
├── hooks/
│   ├── useKoordinatorAssignment.ts
│   ├── useVerifikatorAssignment.ts
│   └── useSemesterAktif.ts
└── api/
    ├── koordinatorAssignment.ts
    ├── verifikatorAssignment.ts
    └── soalKategori.ts
```

`[SPEC]`. **Wajib verifikasi dulu**: struktur folder `src/` aktual belum dikonfirmasi
langsung dari repository — struktur di atas adalah struktur target, bukan struktur yang
sudah confirmed ada. Cek `src/` sungguhan sebelum membuat folder baru; jika repository
existing sudah pakai pola feature-based (`features/soal/`, dst), sesuaikan penempatan ke
pola itu — **jangan** paksakan struktur role-based di atas menimpa pola existing yang
berbeda.

---

## 5. User Roles

Tiga role aktif: **SuperAdmin**, **Koordinator** (label diagram: "Dosen Koordinator MK"),
**Verifikator** (label diagram: "Dosen Verifikator"). `[BR]` `[UC]`

| Role | Use case yang jadi tanggung jawabnya |
|------|------------------------------------------|
| SuperAdmin | Mengelola master data (CLO/PLO/Mata Kuliah/Dosen); mengelola tahun ajaran; mengelola kategori soal; menentukan dosen verifikator (include wajib: menentukan MK); menunjuk/mengganti Koordinator |
| Koordinator | Mengunduh template soal; mengunggah soal dan revisinya; melihat status verifikasi |
| Verifikator | Memverifikasi soal; memberikan catatan verifikasi; mencetak berita acara |

`[UC]` `[BR]`

---

## 6. Role Terminology Rules

**Wajib**: gunakan `Koordinator` dan `Verifikator` sebagai istilah role aktif di kode,
komentar, variabel, dan UI baru. **Jangan** gunakan `PIC` sebagai role aktif — boleh muncul
hanya sebagai referensi historis pada endpoint legacy yang belum di-deprecate (Section 11).
`[BR]` BR-06.

Larangan istilah `Coordinator` (Bahasa Inggris) sebagai alternatif `Koordinator`:
dilaporkan dari baca kode agent, **belum diverifikasi ulang** terhadap BR/audit asli
(keduanya tidak menyebut ini). Perlakukan sebagai aturan aktif, namun **jangan rename
massal** tanpa cross-check dulu — mungkin ada kolom/variabel di kode yang memang secara
struktural bernama `coordinator` (Bahasa Inggris) tanpa itu jadi masalah, berbeda dengan
istilah yang ditampilkan ke user. `[DB]`, confidence lebih rendah dari BR-06.

---

## 7. Database — Confirmed Existing Structure

| Area | Struktur | Catatan |
|------|----------|---------|
| Assignment Koordinator | Tabel `koordinator_assignments` | Bukan di `user_roles`. |
| Mapping Mata Kuliah↔CLO | Tabel `course_clo`, atau kolom `mata_kuliah_id` di CLO | Dua kemungkinan disebutkan — mana yang aktif `NEEDS CONFIRMATION`. |
| Assignment Verifikator | Tabel `penugasan_verifikator` | Legacy: sebelumnya via `user_roles`. |
| Soal↔PLO | Tidak ada kolom `plo_id` di tabel Soal | Relasi ke PLO implisit lewat CLO. **Jangan tambahkan** kolom `plo_id` ke Soal. |

`[DB]`, dilaporkan dari baca kode langsung, belum di-cross-check ulang di percakapan ini.

---

## 8. Database — Wajib Diverifikasi Sebelum Migration Baru

**Constraint semester pada Koordinator Assignment** (`[SPEC]`, prioritas tertinggi):

Tabel `koordinator_assignments` harus mendukung struktur berikut agar BR-02/BR-04
terpenuhi:

```
koordinator_assignments
├── course_id       (FK ke courses)
├── user_id         (FK ke users)
├── semester_id     (FK ke semesters — WAJIB)
├── assigned_by     (FK ke users, audit trail)
```

dengan **unique constraint pada `(course_id, semester_id)`** — satu mata kuliah hanya
punya satu Koordinator aktif per semester; mengganti Koordinator (BR-04) berarti update
baris pada kombinasi tersebut, bukan insert baris baru yang bertabrakan.

**Wajib dilakukan sebelum membuat migration apapun untuk ini**: cek apakah kolom
`semester_id` sudah ada di tabel existing. Jika sudah ada, tidak perlu migration
tambahan — hanya pastikan Service layer memanfaatkannya benar. Jika belum ada, migration
baru ini **dapat ditelusuri langsung ke BR-02 dan BR-04**, jadi sah dibuat.
`NEEDS CONFIRMATION FROM EXISTING DATABASE` sampai dicek langsung.

**Tabel kategori soal** (`[SPEC]`): use case "Mengelola kategori soal" `[UC]` tidak
punya rujukan tabel di audit maupun laporan agent. Cek dulu apakah tabel `soal_kategori`
atau serupa sudah ada sebelum membuat migration baru.
`NEEDS CONFIRMATION FROM EXISTING DATABASE`.

**Dilarang**: membuat tabel terpisah untuk "status periode"/"tahun ajaran" tanpa cek dulu
apakah representasinya sudah ada di tabel `semesters`/`periode` existing. `[SPEC]`

---

## 9. API — Endpoint yang Ditambahkan/Dimodifikasi

| Endpoint | Method | Actor | Keterangan |
|----------|--------|-------|-------------|
| `/api/koordinator-assignments` | `POST` | SuperAdmin | Menunjuk Koordinator (course, semester). |
| `/api/koordinator-assignments/{id}` | `PUT` | SuperAdmin | Mengganti Koordinator pada assignment existing — menutup BR-04 tanpa insert baris duplikat. |
| `/api/soal-kategori` | `GET, POST, PUT, DELETE` | SuperAdmin | Hanya jika Section 8 terkonfirmasi belum ada tabelnya. |
| `/api/courses/{id}/clo` | `POST` (dipindahkan dari closure) | SuperAdmin | Wajib pakai FormRequest dengan `exists:clos,id`. |

`[SPEC]`. Payload/response detail tidak ditentukan di sini — verifikasi dulu ke Resource
class existing yang relevan sebelum menentukan shape data, jangan mengarang.

**Wajib ditutup lebih dulu, sebelum endpoint baru manapun di atas dibuat**:
- `/dev/switch-mode` — tambahkan middleware `super_admin`. `[AUDIT]` F-01, CRITICAL.
- `/penugasan-dosen` (store/destroy) — tambahkan middleware `super_admin`. `[AUDIT]` F-02, HIGH.

Endpoint assignment baru akan mewarisi risiko yang sama jika dua item di atas belum
ditutup. `[SPEC]`

**Jangan mengubah endpoint URL** hanya karena file dipindahkan dari closure ke Controller.

---

## 10. Business Rules (wajib dipatuhi, jangan diubah maknanya)

| ID | Rule |
|----|------|
| BR-01 | Satu mata kuliah dapat memiliki lebih dari satu CLO dan PLO. |
| BR-02 | Koordinator dapat berubah setiap semester. |
| BR-03 | Super Admin dapat menunjuk Koordinator. |
| BR-04 | Super Admin dapat mengganti Koordinator dari user 1 ke user 2. |
| BR-05 | Super Admin dapat menunjuk Verifikator. |
| BR-06 | Role PIC diganti menjadi Verifikator. |
| BR-07 | Role sistem terdiri dari Super Admin, Koordinator, dan Verifikator. |
| BR-08 | Pilihan periode soal mengikuti periode waktu yang sedang berjalan. |
| BR-09 | Dev Mode tidak memengaruhi akses Berita Acara. |
| BR-10 | Kursor/info pada deskripsi chart dihapus. |
| BR-11 | Monitoring status upload kelas menggunakan semester berjalan. |
| BR-12 | Fitur penetapan nilai PLO tidak digunakan. |
| BR-13 | Mata Kuliah, PLO, dan CLO dianggap telah ditetapkan seperti sistem OBE. |

`[BR]`. Untuk BR-13 spesifik: use case diagram menampilkan "Mengelola master data" dengan
extension CLO/PLO/Mata Kuliah yang secara literal terbaca sebagai CRUD penuh — ini
berpotensi bertentangan dengan BR-13. **Belum diselesaikan** — lihat Section 13. Jangan
mengimplementasikan CRUD penuh untuk CLO/PLO/Mata Kuliah tanpa konfirmasi ulang.

---

## 11. Legacy / Backward Compatibility

Endpoint `/penugasan` (lama) kemungkinan masih berdampingan dengan `/penugasan-verifikator`
(baru). **Jangan hapus** sampai terkonfirmasi frontend sudah sepenuhnya migrasi.
`[AUDIT]` Section 14.

---

## 12. Forbidden Changes

Jangan lakukan, kecuali ada requirement eksplisit baru yang secara spesifik memintanya:

- Mengubah business rule (Section 10) atau maknanya.
- Menghapus fitur existing yang statusnya "fully implemented" di audit.
- Menambah role baru di luar SuperAdmin/Koordinator/Verifikator.
- Menggunakan `PIC` sebagai role aktif di kode baru.
- Menambah kolom `plo_id` langsung ke tabel Soal.
- Menghapus endpoint legacy `/penugasan` sebelum migrasi frontend terkonfirmasi selesai.
- Refactor besar arsitektur di luar yang sudah ditentukan di Section 3 dan 4.
- Migrasi stack (frontend/backend/database engine) tanpa requirement eksplisit baru.
- Mengganti pola state management frontend dari React Context + React Query (Section 2, 5)
  ke library lain tanpa requirement eksplisit baru.
- Membuat migration baru di Section 8 tanpa verifikasi skema existing lebih dulu.
- Implementasi CRUD penuh untuk CLO/PLO/Mata Kuliah tanpa resolusi konflik Section 10.
- **DILARANG MUTLAK** melakukan commit, push, pull, atau merge secara langsung ke branch `main`. Semua penggabungan dari branch fitur wajib dilakukan ke branch `main-new` terlebih dahulu sebelum diproses lebih lanjut.

`[SPEC]` `[BR]` `[AUDIT]`

---

## 13. Open Items — Needs Confirmation (wajib diselesaikan sebelum area terkait disentuh)

- **Prioritas tertinggi**: konsistensi "Mengelola master data" (use case, tersirat CRUD
  penuh) vs BR-13 (data dianggap given dari OBE). Jangan implementasi CRUD CLO/PLO/Mata
  Kuliah sampai ini diselesaikan oleh pemilik produk.
- Struktur folder frontend aktual — belum diverifikasi langsung dari repository.
- Engine database pasti (PostgreSQL vs MySQL).
- Struktur mapping Mata Kuliah↔CLO yang aktif: `course_clo` atau `mata_kuliah_id`.
- Kolom `semester_id` di `koordinator_assignments` — sudah ada atau perlu migration baru.
- Tabel kategori soal — sudah ada atau perlu dibuat baru.
- Status resmi larangan istilah `Coordinator` (Bahasa Inggris) — cross-check ke kode.
- Hubungan Approve/Revisi/Reject (audit, tiga status eksplisit) vs "Memverifikasi Soal"
  (use case diagram, satu use case payung tanpa percabangan status eksplisit).
- Apakah BR-03/BR-04 punya use case tersendiri di luar extension `dosen` pada "Mengelola
  master data" — diagram tidak merinci ini secara eksplisit.
- Detail hak akses Koordinator dan Verifikator di luar yang sudah tercantum di Section 5.

---

## 14. Definition of Done (untuk perubahan yang menyentuh area di file ini)

- Perubahan tidak melanggar Business Rules (Section 10).
- Perubahan tidak masuk daftar Forbidden Changes (Section 12).
- Jika menyentuh tabel di Section 7 atau 8, struktur sudah diverifikasi ulang langsung
  dari migration/model — bukan hanya mengandalkan tabel di file ini.
- Middleware `super_admin` pada `/dev/switch-mode` dan `/penugasan-dosen` sudah ditutup
  sebelum endpoint assignment baru manapun (Section 9) di-deploy.
- Jika ada item di Section 13 yang tersentuh oleh perubahan, item itu diisi dengan fakta
  terverifikasi dan ditandai sumbernya — bukan dibiarkan atau ditebak.