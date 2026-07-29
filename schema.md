# Spesifikasi Basis Data & Schema (schema.md)

# Dashboard Verifikasi Soal Ujian — Telkom University Jakarta

Dokumen ini berisi spesifikasi lengkap mengenai arsitektur basis data, struktur tabel, relasi antar tabel, tipe data, indeks, enum status, serta pemetaan tipe data TypeScript untuk aplikasi **Dashboard Verifikasi Soal Ujian**.

---

## 1. Konvensi & Aturan Basis Data

- **Database Engine:** PostgreSQL (Versi 14+)
- **ORM / Driver:** Laravel Eloquent ORM
- **Karakter Set & Collation:** UTF-8 / Standard PostgreSQL UTF8 (`utf8mb4_unicode_ci` compatible)
- **Zona Waktu:** Asia/Jakarta (WIB, UTC+7)
- **Primary Key (PK):** `id` bertipe `BIGINT` auto-increment (Sequence).
- **Public Public Identifier:** UUID v4 (`uuid`) digunakan pada tabel publik (`users`, `soal`) untuk pencegahan *enumeration attack*.
- **Integritas Referensial (Foreign Keys):** Seluruh Foreign Key menggunakan `foreignId()` dengan constraint cascading (`cascadeOnDelete()` atau `nullOnDelete()`).
- **Audit & History:**
  - Soft Deletes (`deleted_at` timestamp) pada tabel utama (`users`, `soal`, `verifications`).
  - Standard Timestamps (`created_at`, `updated_at`) pada seluruh tabel transaksi.

---

## 2. Definisi Tabel Master (Master Tables)

### 2.1 `users`
Menyimpan data pengguna, dosen, coordinator, dan super admin.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | Unique Identifier Utama (Internal) |
| `uuid` | UUID | Unique, Not Null | Identitas Publik UUID v4 |
| `kode_dosen` | VARCHAR(30) | Unique, Not Null | NIDN / Kode Dosen (Contoh: `DSN-SI-001`) |
| `nama_lengkap` | VARCHAR(150) | Not Null | Nama lengkap beserta gelar akademik |
| `email` | VARCHAR(150) | Unique, Not Null | Email resmi Telkom University |
| `password` | VARCHAR(255) | Not Null | Password terenkripsi Bcrypt / Argon2ID |
| `prodi_id` | BIGINT | FK -> `program_studi(id)` | Foreign Key Prodi (Null untuk Super Admin) |
| `tipe_dosen` | ENUM | `'biasa'`, `'lb'` | Tipe Dosen (`biasa` = Tetap, `lb` = Luar Biasa) |
| `semester_lb` | ENUM | `'ganjil'`, `'genap'`, Null | Menentukan periode keaktifan Dosen LB |
| `is_super_admin` | BOOLEAN | Default: `false` | Status Super Admin Fakultas |
| `is_coordinator` | BOOLEAN | Default: `false` | Status Coordinator Prodi / Fakultas |
| `status_aktif` | BOOLEAN | Default: `true` | Status keaktifan akun pengguna |
| `last_login_at` | TIMESTAMP | Nullable | Timestamp login terakhir pengguna |
| `remember_token` | VARCHAR(100) | Nullable | Token sesi "Remember Me" |
| `created_at` | TIMESTAMP | Nullable | Waktu akun dibuat |
| `updated_at` | TIMESTAMP | Nullable | Waktu akun diperbarui |
| `deleted_at` | TIMESTAMP | Nullable | Soft delete timestamp |

---

### 2.2 `roles` & `user_roles`
Definisi peran (*roles*) dan relasi *many-to-many* antara `users` dan `roles`.

#### Tabel `roles`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Role |
| `nama_role` | VARCHAR(50) | Unique, Not Null | Nama Role (`super_admin`, `coordinator`, `dosen`, `pic`) |

#### Tabel `user_roles`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Pivot |
| `user_id` | BIGINT | FK -> `users(id)` | Foreign Key User |
| `role_id` | BIGINT | FK -> `roles(id)` | Foreign Key Role |
| `periode_id` | BIGINT | FK -> `periode(id)` | Nullable; membatasi peran (misal: PIC per periode) |

---

### 2.3 `program_studi`
Menyimpan daftar Program Studi di lingkungan Fakultas.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Program Studi |
| `kode_prodi` | VARCHAR(10) | Unique, Not Null | Kode Singkat Prodi (Contoh: `SI`, `IF`, `TT`) |
| `nama_prodi` | VARCHAR(100) | Not Null | Nama Lengkap Prodi (Contoh: `S1 Sistem Informasi`) |

---

### 2.4 `courses` (Mata Kuliah)
Menyimpan data Mata Kuliah per Program Studi.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Mata Kuliah |
| `kode_mk` | VARCHAR(20) | Unique, Not Null | Kode Mata Kuliah (Contoh: `CSI1A3`) |
| `nama_mk` | VARCHAR(150) | Not Null | Nama Mata Kuliah (Contoh: `Algoritma & Pemrograman`) |
| `prodi_id` | BIGINT | FK -> `program_studi(id)` | Foreign Key Program Studi pengampu |

---

### 2.5 `dosen_mata_kuliah`
Tabel relasi penugasan pengampuan Mata Kuliah oleh Dosen.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Pivot |
| `user_id` | BIGINT | FK -> `users(id)` | Foreign Key Dosen Pengampu |
| `course_id` | BIGINT | FK -> `courses(id)` | Foreign Key Mata Kuliah |

---

### 2.6 `periode`
Menyimpan Periode Akademik (Semester & Tahun Akademik).

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Periode |
| `nama_periode` | VARCHAR(100) | Not Null | Nama Periode (Contoh: `Semester Genap 2025/2026`) |
| `semester` | ENUM | `'ganjil'`, `'genap'` | Jenis Semester |
| `tahun_akademik` | VARCHAR(20) | Not Null | Format: `2025/2026` |
| `tanggal_mulai` | DATE | Not Null | Tanggal awal pembukaan upload |
| `tanggal_deadline`| DATE | Not Null | Batas akhir pengunggahan & verifikasi |
| `status` | BOOLEAN | Default: `false` | `true` = Aktif (Hanya 1 periode aktif pada 1 waktu) |

---

### 2.7 `plo` (*Program Learning Outcomes*) & 2.8 `clo` (*Course Learning Outcomes*)

#### Tabel `plo`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID PLO |
| `kode_plo` | VARCHAR(20) | Not Null | Kode PLO (Contoh: `PLO-01`) |
| `deskripsi` | TEXT | Not Null | Deskripsi Capaian Pembelajaran Lulusan |
| `prodi_id` | BIGINT | FK -> `program_studi(id)` | Foreign Key Prodi |
| `periode_id` | BIGINT | FK -> `periode(id)` | Foreign Key Periode |

#### Tabel `clo`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID CLO |
| `kode_clo` | VARCHAR(20) | Not Null | Kode CLO (Contoh: `CLO-01`) |
| `deskripsi` | TEXT | Not Null | Deskripsi Capaian Pembelajaran Mata Kuliah |
| `plo_id` | BIGINT | FK -> `plo(id)` | Foreign Key PLO Terkait |
| `periode_id` | BIGINT | FK -> `periode(id)` | Foreign Key Periode |

---

### 2.9 `categories`, `templates`, & `berita_acara_templates`

#### Tabel `categories`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Kategori |
| `nama_kategori` | VARCHAR(50) | Not Null | Kategori Soal (`UTS`, `UAS`, `Quiz`, `Remedial`) |
| `deskripsi` | TEXT | Nullable | Deskripsi Tambahan |

#### Tabel `templates`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Template Soal |
| `kategori_id` | BIGINT | FK -> `categories(id)` | Foreign Key Kategori Soal |
| `nama_file` | VARCHAR(150) | Not Null | Nama Asli Berkas Template |
| `file_path` | TEXT | Not Null | Path Penyimpanan Berkas Template |
| `versi` | UNSIGNED INT | Default: 1 | Nomor Versi Template |
| `is_active` | BOOLEAN | Default: `true` | Status Keaktifan Template |

#### Tabel `berita_acara_templates`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Template Berita Acara |
| `nama_template` | VARCHAR(100) | Not Null | Nama Identitas Template BA |
| `nama_file` | VARCHAR(150) | Not Null | Nama Berkas Master DOCX/Blade |
| `file_path` | TEXT | Not Null | Path Penyimpanan Template BA |
| `is_active` | BOOLEAN | Default: `false` | Hanya 1 template BA aktif pada 1 waktu |

---

## 3. Definisi Tabel Transaksi (Transaction Tables)

### 3.1 `soal`
Tabel utama penyimpanan data berkas soal ujian.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Transaksi Soal |
| `uuid` | UUID | Unique, Not Null | Identitas Publik UUID v4 |
| `dosen_id` | BIGINT | FK -> `users(id)` | Foreign Key Dosen Pengunggah |
| `mata_kuliah_id` | BIGINT | FK -> `courses(id)` | Foreign Key Mata Kuliah |
| `clo_id` | BIGINT | FK -> `clo(id)` | Foreign Key CLO Terkait |
| `periode_id` | BIGINT | FK -> `periode(id)` | Foreign Key Periode Akademik |
| `template_id` | BIGINT | FK -> `templates(id)` | Foreign Key Template Soal yang digunakan |
| `judul_soal` | VARCHAR(255) | Not Null | Judul Soal Ujian |
| `file_soal` | TEXT | Not Null | Path Penyimpanan Berkas PDF / DOCX |
| `versi` | UNSIGNED INT | Default: 1 | Versi Soal (Di-increment tiap revisi) |
| `status` | ENUM | `'draft'`, `'submitted'`, `'in_review'`, `'revisi'`, `'approved'`, `'rejected'` | Status Alur Verifikasi Soal |
| `uploaded_at` | TIMESTAMP | Nullable | Timestamp saat dikirim (`submitted`) |
| `created_at` | TIMESTAMP | Nullable | Timestamp Pembuatan |
| `updated_at` | TIMESTAMP | Nullable | Timestamp Perubahan |
| `deleted_at` | TIMESTAMP | Nullable | Soft Delete Timestamp |

---

### 3.2 `revisi_history`
Menyimpan riwayat arsip berkas dan catatan revisi terdahulu.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID History |
| `soal_id` | BIGINT | FK -> `soal(id)` | Foreign Key Soal |
| `file_soal` | TEXT | Not Null | Path Berkas Versi Sebelumnya |
| `versi` | UNSIGNED INT | Not Null | Angka Versi Revisi |
| `catatan` | TEXT | Nullable | Catatan Perbaikan Dosen/PIC |
| `created_at` | TIMESTAMP | Default: NOW() | Waktu Pengunggahan Versi Revisi |

---

### 3.3 `penugasan` (Assignment PIC)
Menyimpan penugasan Dosen PIC Verifikator terhadap Dosen Target per Periode.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Penugasan |
| `periode_id` | BIGINT | FK -> `periode(id)` | Foreign Key Periode Akademik |
| `verifier_id` | BIGINT | FK -> `users(id)` | Foreign Key Dosen PIC Verifikator |
| `target_dosen_id`| BIGINT | FK -> `users(id)` | Foreign Key Dosen Target |
| `assigned_by` | BIGINT | FK -> `users(id)` | Foreign Key Super Admin / Coordinator Penugas |
| `assigned_at` | TIMESTAMP | Nullable | Waktu Penugasan Dibuat |

*Composite Unique Index:* `penugasan_unique_assignment` pada `(periode_id, verifier_id, target_dosen_id)`.

---

### 3.4 `verifications` (Verification Audit Trail)
Menyimpan log keputusan dan tinjauan verifikasi dari PIC Verifikator.

| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Log Verifikasi |
| `soal_id` | BIGINT | FK -> `soal(id)` | Foreign Key Soal |
| `verifier_id` | BIGINT | FK -> `users(id)` | Foreign Key Dosen PIC Verifikator |
| `tipe_verifikator`| ENUM | `'pic'`, `'coordinator'` | Jenis Verifikator (Default: `pic`) |
| `status` | ENUM | `'approved'`, `'revisi'`, `'rejected'` | Decision Status Keputusan |
| `catatan` | TEXT | Nullable | Catatan Perbaikan & Masukan Verifikasi |
| `verified_at` | TIMESTAMP | Nullable | Waktu Verifikasi Dilakukan |
| `created_at` | TIMESTAMP | Nullable | Waktu Entri Dibuat |
| `updated_at` | TIMESTAMP | Nullable | Waktu Entri Diperbarui |
| `deleted_at` | TIMESTAMP | Nullable | Soft Delete Timestamp |

---

### 3.5 `berita_acara` & `berita_acara_items`

#### Tabel `berita_acara`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Berita Acara |
| `nomor_ba` | VARCHAR(100) | Unique, Not Null | Nomor BA Resmi (contoh: `BA/VERIF/2026/001`) |
| `periode_id` | BIGINT | FK -> `periode(id)` | Foreign Key Periode Akademik |
| `verifier_id` | BIGINT | FK -> `users(id)` | Foreign Key Verifikator Penanggung Jawab |
| `generated_at` | TIMESTAMP | Nullable | Waktu Berita Acara Dihasilkan |
| `file_pdf` | TEXT | Nullable | Path Simpan Berkas PDF Hasil Render |
| `file_docx` | TEXT | Nullable | Path Simpan Berkas DOCX Hasil Render |

#### Tabel `berita_acara_items`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Item BA |
| `berita_acara_id`| BIGINT | FK -> `berita_acara(id)` | Foreign Key Berita Acara |
| `soal_id` | BIGINT | FK -> `soal(id)` | Foreign Key Soal yang Terangkum |

---

### 3.6 `broadcasts`, `notifikasi`, & `activity_logs`

#### Tabel `broadcasts`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Broadcast |
| `title` | VARCHAR(255) | Not Null | Judul Pengumuman |
| `message` | TEXT | Not Null | Konten Pesan Broadcast |
| `status` | ENUM | `'draft'`, `'published'` | Status Publikasi |
| `created_by` | BIGINT | FK -> `users(id)` | Foreign Key Pembuat Pesan |
| `published_at` | TIMESTAMP | Nullable | Waktu Publikasi |

#### Tabel `notifikasi`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Notifikasi |
| `user_id` | BIGINT | FK -> `users(id)` | Foreign Key Penerima Notifikasi |
| `title` | VARCHAR(255) | Not Null | Judul Notifikasi |
| `message` | TEXT | Not Null | Pesan Notifikasi |
| `type` | VARCHAR(50) | Default: `'info'` | Jenis Notifikasi (`revisi`, `assignment`, `system`) |
| `is_read` | BOOLEAN | Default: `false` | Status Dibaca |
| `read_at` | TIMESTAMP | Nullable | Waktu Dibaca |

#### Tabel `activity_logs`
| Nama Kolom | Tipe Data | Constraint | Deskripsi |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT | PK, Auto Increment | ID Log Aktivitas |
| `user_id` | BIGINT | FK -> `users(id)` | Foreign Key Pengguna Pelaku Aksi |
| `action` | VARCHAR(100) | Not Null | Jenis Aksi (Login, Upload Soal, Verify, Generate BA) |
| `description` | TEXT | Nullable | Rincian Keterangan Aksi |
| `ip_address` | VARCHAR(45) | Nullable | IP Address Pengakses |

---

## 4. Matriks Perubahan Status Soal (State Machine)

```
        +---------+
        |  draft  |
        +---------+
             |
             v (Submit by Dosen)
       +-----------+
       | submitted |
       +-----------+
             |
             v (Review Start by PIC)
       +-----------+
       | in_review |
       +-----------+
         /    |    \
        /     |     \ (Reject)
       /      |      +-------------> +----------+
      / (Approve)                    | rejected |
     v        v                      +----------+
+----------+ +--------+
| approved | | revisi |
+----------+ +--------+
                |
                v (Upload Revisi by Dosen)
          +-----------+
          | submitted | (Versi + 1)
          +-----------+
```

---

## 5. Tipe Data TypeScript (Frontend Model Sync)

Untuk memastikan konsistensi antarmuka frontend React dengan database backend, seluruh tipe model didefinisikan secara ketat pada `resources/js/shared/types/models.ts`:

```typescript
export type SoalStatus = 'draft' | 'submitted' | 'in_review' | 'revisi' | 'approved' | 'rejected';
export type TipeDosen = 'biasa' | 'lb';
export type SemesterType = 'ganjil' | 'genap';

export interface User {
  id: number;
  uuid: string;
  kode_dosen: string;
  nama_lengkap: string;
  email: string;
  prodi_id: number | null;
  tipe_dosen: TipeDosen;
  semester_lb: SemesterType | null;
  is_super_admin: boolean;
  is_coordinator: boolean;
  status_aktif: boolean;
}

export interface Soal {
  id: number;
  uuid: string;
  dosen_id: number;
  mata_kuliah_id: number;
  clo_id: number;
  periode_id: number;
  template_id: number;
  judul_soal: string;
  file_soal: string;
  versi: number;
  status: SoalStatus;
  uploaded_at: string | null;
  dosen?: User;
  mata_kuliah?: Course;
  periode?: Periode;
}

export interface Verification {
  id: number;
  soal_id: number;
  verifier_id: number;
  tipe_verifikator: 'pic' | 'coordinator';
  status: 'approved' | 'revisi' | 'rejected';
  catatan: string | null;
  verified_at: string;
}
```

---

## 6. Aturan Indeks & Optimasi

1. **Unique Composite Index:**
   - `penugasan`: Unique Index pada `(periode_id, verifier_id, target_dosen_id)`.
2. **Foreign Key Indexing:**
   - Seluruh Foreign Key (`prodi_id`, `course_id`, `periode_id`, `dosen_id`, `soal_id`) diberi indeks B-Tree bawaan oleh PostgreSQL untuk query gabungan (`JOIN`).
3. **Lookup Search Indexing:**
   - Index pada `soal(periode_id, status)` untuk mempercepat pemfilteran dashboard dan penggenerasian Berita Acara.

