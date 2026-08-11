# AGENTS.md — Website Verifikator (Sistem Verifikasi Soal)

> README untuk AI coding agent. File ini bukan spesifikasi lengkap — bagian yang ditandai
> `NEEDS CONFIRMATION` harus diisi dari pembacaan langsung terhadap kode/config sebelum
> dipercaya sebagai instruksi eksekusi. Jangan mengasumsikan isi bagian tersebut.

---

## 1. Project Overview

Website Verifikator adalah aplikasi untuk mendigitalkan proses verifikasi soal ujian pada
Program Studi Sistem Informasi. Mencakup: pengelolaan data akademik (Mata Kuliah, PLO, CLO),
penugasan dosen (Koordinator, Verifikator), upload soal PDF, workflow verifikasi
(Approve/Revisi/Reject), dan pembuatan Berita Acara (BA) berbasis PDF snapshot.

Source: Audit teknis repository + notulensi perbaikan Website Verifikator.

---

## 2. Tech Stack

**Frontend**: React 19, TypeScript, Vite, TailwindCSS 4, React Router 7, React Query, Shadcn UI.

**Backend**: Laravel 12, PHP 8.2, Laravel Sanctum (autentikasi).

**Database**: Relational (PostgreSQL/MySQL — engine spesifik `NEEDS CONFIRMATION`, audit hanya
menyebut "assumed via Eloquent").

Source: Audit teknis, Section "Application Overview".

---

## 3. Architecture

Pola existing yang **wajib dipertahankan**, jangan diubah tanpa requirement eksplisit:

```
Route → Middleware → FormRequest → Controller → Service → Repository → Model → Database
```

Catatan dari audit: sebagian route (area Course dan CLO assignment) saat ini masih berupa
closure langsung di `routes/api.php`, belum mengikuti pola di atas. Ini **legacy/technical
debt**, bukan pola yang harus ditiru untuk kode baru.

Source: Audit teknis, Section "Architecture Map" dan Finding C-01.

---

## 4. Project Structure

`NEEDS CONFIRMATION` — struktur folder aktual (frontend `src/`, backend `app/`) belum
diverifikasi langsung dari repository dalam percakapan ini. Jangan asumsikan struktur folder
generik Laravel/React default sebagai struktur aktual proyek ini. Verifikasi langsung
terhadap repository sebelum membuat/memindahkan file.

---

## 5. User Roles

Tiga role aktif: **Super Admin**, **Koordinator**, **Verifikator**.

| Role | Kewenangan yang dikonfirmasi sumber |
|------|----------------------------------------|
| Super Admin | Menunjuk Koordinator; mengganti Koordinator dari satu user ke user lain; menunjuk Verifikator; mengelola penugasan Koordinator dan Verifikator. |
| Koordinator | Berkaitan dengan mata kuliah yang menjadi tanggung jawabnya pada semester/periode berjalan. Detail hak akses lain: `NEEDS CONFIRMATION`. |
| Verifikator | Melaksanakan proses verifikasi soal (Approve/Revisi/Reject). Detail hak akses lain: `NEEDS CONFIRMATION`. |

Source: Notulensi Section 4, 6, 7; BR-03, BR-04, BR-05.

---

## 6. Role Terminology Rules

**Wajib**:
- Gunakan **`Koordinator`** dan **`Verifikator`** sebagai istilah role aktif.
- **Jangan** gunakan `PIC` sebagai role aktif di kode, komentar, nama variabel, atau UI baru.
  `PIC` boleh muncul hanya sebagai referensi historis pada endpoint legacy yang memang belum
  di-deprecate (lihat Section 9).

Status istilah `Coordinator` (Bahasa Inggris) sebagai alternatif terlarang dari `Koordinator`:
dilaporkan oleh agent hasil baca kode, belum terverifikasi ulang di percakapan ini terhadap
sumber audit/notulensi asli. Diperlakukan sebagai aturan aktif berdasarkan laporan agent,
namun ditandai untuk **cross-check** jika ditemukan pola penamaan campuran `Coordinator`/
`Koordinator` di kode — jangan langsung rename massal tanpa konfirmasi mana yang dipakai
konsisten di skema aktual.

Source: Notulensi BR-06 (penggantian PIC → Verifikator, terkonfirmasi kuat); larangan istilah
`Coordinator` (laporan agent, lihat catatan di atas).

---

## 7. Database — Confirmed Existing Structure

Tabel/kolom berikut dilaporkan oleh agent berdasarkan pembacaan langsung kode/migration.
**Belum diverifikasi ulang secara independen dalam percakapan ini** — perlakukan sebagai
titik awal yang kuat, bukan fakta yang tidak perlu dicek ulang saat menyentuh area terkait.

| Area | Struktur yang dilaporkan | Catatan |
|------|---------------------------|---------|
| Assignment Koordinator | Tabel `koordinator_assignments` | Bukan di `user_roles`. |
| Mapping Mata Kuliah ↔ CLO | Tabel `course_clo`, atau kolom `mata_kuliah_id` di tabel CLO | Dua kemungkinan struktur disebutkan agent — belum jelas mana yang aktif dipakai. `NEEDS CONFIRMATION` untuk memastikan struktur mana yang benar sebelum menulis query baru. |
| Assignment Verifikator | Tabel `penugasan_verifikator` | Legacy: sebelumnya di-mapping lewat `user_roles`. |
| Soal ↔ PLO | Tidak ada kolom `plo_id` langsung di tabel Soal | Relasi ke PLO hanya implisit lewat CLO. Dosen tidak melakukan mapping Soal→PLO langsung dari UI. |

**Aturan turunan**: jangan membuat kolom `plo_id` baru di tabel Soal kecuali ada requirement
eksplisit yang mengubah BR ini. Relasi Soal→PLO tetap harus lewat CLO sebagai perantara.

Source: Laporan agent dari pembacaan kode langsung (dikonfirmasi user sebagai sumber kode,
belum di-cross-check ulang terhadap audit/notulensi karena kedua dokumen itu tidak menyebut
nama tabel sama sekali).

---

## 8. Business Rules (dari notulensi — wajib dipatuhi, jangan diubah maknanya)

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
| BR-13 | Mata Kuliah, PLO, dan CLO dianggap telah ditetapkan seperti sistem OBE (bukan dibuat baru dari UI ini). |

Source: Notulensi Section 18.

---

## 9. Legacy / Backward Compatibility

Endpoint `/penugasan` (lama) kemungkinan masih ada berdampingan dengan `/penugasan-verifikator`
(baru). **Jangan hapus** endpoint legacy sampai terkonfirmasi frontend sudah sepenuhnya
migrasi ke endpoint baru.

Source: Audit teknis, Section 14 (Dead Code), eksplisit ditandai "Determine if frontend has
fully migrated... If so, remove".

---

## 10. Known Technical Debt (bukan otomatis jadi task — lihat Section 12)

Dari audit teknis, area berikut punya masalah terdokumentasi. **Ini bukan instruksi untuk
langsung diperbaiki** — hanya konteks supaya agent tidak salah kira kode di area ini sebagai
pola yang harus ditiru:

- `/dev/switch-mode` tidak punya middleware `super_admin` (F-01, CRITICAL).
- Route `/penugasan-dosen` (store/destroy) tidak punya authorization yang sesuai (F-02, HIGH).
- Bulk CLO assignment (`/courses/{id}/clo`) tidak validasi `clo_ids` terhadap database (F-03, HIGH).
- Business logic dan query database ditaruh langsung di closure `routes/api.php`, bukan di
  Controller (C-01, MEDIUM).
- Tidak ada `DB::transaction()` pada `$course->clo()->sync()` (FN-01, MEDIUM).
- Tidak ada pagination di beberapa endpoint list (FN-02, P-01).
- Tidak ada rate limiting global (S-02, MEDIUM).

Source: Audit teknis, Section 5–12.

---

## 11. Forbidden Changes

Jangan lakukan, kecuali ada requirement eksplisit yang secara spesifik memintanya:

- Mengubah business rule (Section 8) atau maknanya.
- Menghapus fitur existing yang statusnya "fully implemented" di audit.
- Menambah role baru di luar Super Admin/Koordinator/Verifikator.
- Menggunakan `PIC` sebagai role aktif di kode baru.
- Menambah kolom `plo_id` langsung ke tabel Soal.
- Menghapus endpoint legacy `/penugasan` sebelum migrasi frontend terkonfirmasi selesai.
- Refactor besar-besaran arsitektur (mengganti pola Route→Controller→Service→Repository)
  tanpa requirement eksplisit — termasuk untuk closure legacy di Section 10; perbaikannya
  adalah memindahkan logic ke Controller sesuai pola yang sudah ada, bukan mengganti pola itu
  sendiri.

---

## 12. Scope Discipline

Audit finding (Section 10) **tidak otomatis menjadi task**. Sebelum memperbaiki temuan audit
apapun, klasifikasikan dulu apakah itu bagian dari task yang sedang dikerjakan (In Scope),
berkaitan tapi terpisah (Related but Separate), atau di luar scope sepenuhnya (Out of Scope).
Jangan menganggap "ditemukan di audit" = "harus diperbaiki sekarang".

---

## 13. Dev Environment / Build / Test Commands

`NEEDS CONFIRMATION` — tidak ada command (`npm run dev`, `php artisan serve`,
`composer install`, dsb) yang terverifikasi dari sumber manapun dalam percakapan ini.
**Jangan mengarang command.** Ambil langsung dari `package.json` (script section) dan
`composer.json` repository, atau tanyakan ke pemilik proyek.

---

## 14. Testing Rules

`NEEDS CONFIRMATION` — audit mencatat adanya testing gap (custom authorization logic di
`SoalController::show` belum punya matrix testing lengkap; route closure sulit di-unit-test),
tapi tidak ada informasi soal testing framework yang dipakai, struktur folder test, atau
command untuk menjalankan test. Verifikasi langsung dari `tests/` directory dan
`composer.json`/`package.json` sebelum menulis atau menjalankan test.

Source: Audit teknis, Section 13 (Testing Gaps).

---

## 15. Security Rules

- Semua route yang memengaruhi assignment (Koordinator, Verifikator) atau mode sistem
  (Dev Mode) **wajib** dicek middleware-nya sebelum dianggap aman — lihat Section 10 untuk
  temuan yang sudah terdokumentasi.
- Authorization tidak boleh hanya bergantung pada frontend role-guard; backend middleware
  adalah sumber kebenaran.
- Jangan tambahkan bypass, backdoor, atau kondisi khusus untuk Dev Mode yang memengaruhi
  akses Berita Acara (bertentangan langsung dengan BR-09).

Source: Audit teknis Section 6 (Security Findings); Notulensi BR-09.

---

## 16. Definition of Done (untuk perubahan yang menyentuh area di file ini)

- Perubahan tidak melanggar Business Rules di Section 8.
- Perubahan tidak masuk daftar Forbidden Changes di Section 11.
- Jika menyentuh tabel di Section 7, struktur tabel sudah diverifikasi ulang langsung dari
  migration/model — bukan hanya mengandalkan tabel di file ini.
- Jika ada bagian `NEEDS CONFIRMATION` yang tersentuh oleh perubahan, bagian itu diisi dengan
  fakta terverifikasi dan ditandai sumbernya, bukan dibiarkan atau ditebak.

---

## Open Items — Needs Confirmation Summary
- Engine database (PostgreSQL vs MySQL).
- Struktur folder aktual frontend dan backend.
- Struktur mapping Mata Kuliah↔CLO yang aktif dipakai: `course_clo` atau `mata_kuliah_id`
  (agent melaporkan dua kemungkinan, belum jelas mana yang benar).
- Status resmi larangan istilah `Coordinator` (Bahasa Inggris) — perlu cross-check ke
  audit/notulensi asli atau ke kode langsung, karena kedua sumber itu tidak menyebutkannya.
- Dev environment setup command.
- Build command.
- Test command dan test framework yang dipakai.
- Detail hak akses Koordinator dan Verifikator di luar yang sudah disebutkan.