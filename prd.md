# Product Requirements Document (PRD)

# Dashboard Verifikasi Soal Ujian

**Version:** 1.1  
**Project Name:** Dashboard Verifikasi Soal Ujian  
**Organization:** Telkom University Jakarta  
**Last Updated:** Juli 2026  
**Status:** Approved / In Development  

---

## 1. Latar Belakang (Background)

Proses verifikasi soal ujian (UTS dan UAS) di lingkungan Telkom University Jakarta sebelumnya diselenggarakan secara semi-manual dengan mengandalkan media komunikasi seperti email, aplikasi pesan instan (WhatsApp), dan repositori berkas lokal. Alur kerja manual tersebut menimbulkan beberapa kendala operasional yang kritis:

1. **Sulitnya Pemantauan Progres (Lack of Visibility):** Koordinator mata kuliah dan admin kesulitan melacak sejauh mana proses verifikasi soal telah berjalan untuk setiap program studi dan dosen pengampu.
2. **Risiko Kehilangan Dokumen (Document Management Risks):** Pengiriman draft soal dan revisi via email/chat sering kali menyebabkan tumpang tindih berkas, hilangnya dokumen penting, atau tertukarnya versi soal UTS/UAS.
3. **Ketidaksesuaian Standar & Template:** Dosen kadang mengunggah soal yang belum sesuai dengan template standar Telkom University atau belum memetakan *Course Learning Outcomes* (CLO) & *Program Learning Outcomes* (PLO) secara konsisten.
4. **Penyusunan Berita Acara yang Lambat & Rentan Human Error:** Pembuatan Berita Acara Verifikasi Soal dilakukan secara manual dengan merekap satu per satu status soal yang telah disetujui (*approved*).

Untuk mengatasi permasalahan di atas, **Dashboard Verifikasi Soal Ujian** dikembangkan sebagai platform berbasis web terintegrasi. Sistem ini mendigitalisasi seluruh tahapan alur kerja—mulai dari manajemen periode akademik, distribusi penugasan *Person in Charge* (PIC) Verifikator, unggah soal, verifikasi & catatan revisi berbasis audit log, hingga pembuatan **Berita Acara Verifikasi Soal** secara otomatis.

---

## 2. Tujuan Proyek (Objectives)

- **Digitalisasi End-to-End:** Menggantikan proses verifikasi berbasis email/pesan instan dengan workflow tersentralisasi pada dashboard web.
- **Monitoring Progres Real-Time:** Menyediakan statistik visual, grafik progres, dan indikator deadline aktif bagi Koordinator dan Manajemen.
- **Manajemen Dokumen Berversi (Version Control & Repository):** Menjamin keamanan penyimpanan berkas soal (format PDF/DOCX) dengan riwayat revisi dan pencegahan manipulasi/kehilangan berkas.
- **Peningkatan Akurasi Verifikasi (Quality Assurance):** Memastikan seluruh soal yang disetujui telah memenuhi pemetaan PLO/CLO dan standar template resmi.
- **Otomatisasi Berita Acara (Automated Minutes Generation):** Menggenerasi berkas Berita Acara (format PDF dan DOCX) secara instan berdasarkan template resmi begitu seluruh soal terverifikasi.
- **Penguatan Akuntabilitas & Transparansi:** Mencatat seluruh log verifikasi (*audit trail*) dan menerapkan kontrol akses berbasis peran (*Role-Based Access Control* / RBAC).

---

## 3. Target Pengguna & Persona (Target Users & Roles)

Sistem ini dirancang untuk melayani 4 kelompok pengguna utama di Telkom University Jakarta:

| Role / Peran | Deskripsi Utama | Tanggung Jawab Utama |
| :--- | :--- | :--- |
| **Super Admin** | Pengelola sistem utama (Fakultas / IT Admin). | Pengelolaan pengguna, konfigurasi role, periode akademik, master data prodi/mata kuliah, template BA, dan audit log. |
| **Coordinator** | Koordinator Verifikasi Soal di tingkat Fakultas / Prodi. | Pengaturan periode, pembuatan kategori & template soal, penugasan PIC verifikator, monitoring grafik progres, dan generate Berita Acara. |
| **Dosen** | Dosen pengampu mata kuliah (Dosen Biasa / LB). | Pengunggahan draft soal ujian, pemetaan CLO/PLO, perbaikan revisi soal sesuai catatan PIC, dan pengunduhan template soal. |
| **PIC (Verifikator)** | Dosen terpilih yang ditugaskan memverifikasi soal dosen lain. | Peninjauan berkas soal, pemberian status verifikasi (*Approve* / *Revisi* / *Reject*), pemberian catatan perbaikan, serta pelacakan riwayat revisi. |

---

## 4. Matriks Peran dan Hak Akses (RBAC Matrix)

Sistem menerapkan *Role-Based Access Control* (RBAC) yang fleksibel di mana seorang pengguna (misal: Dosen) dapat memiliki peran tambahan (misal: PIC Verifikator) sesuai periode akademik berjalan.

| Modul / Fitur | Super Admin | Coordinator | Dosen | PIC Verifikator |
| :--- | :---: | :---: | :---: | :---: |
| **Manajemen User & Role** | Full Control (CRUD) | Read-only | No Access | No Access |
| **Manajemen Prodi & Courses** | Full Control (CRUD) | Full Control (CRUD) | Read-only | Read-only |
| **Manajemen PLO & CLO** | Full Control (CRUD) | Full Control (CRUD) | Read-only | Read-only |
| **Manajemen Periode Academic** | Full Control (CRUD) | CRUD & Activate | Read-only | Read-only |
| **Kelola Template Soal & Kategori** | Full Control (CRUD) | CRUD | Download | Download |
| **Kelola Template Berita Acara** | Full Control (CRUD) | View & Select Active | No Access | No Access |
| **Penugasan PIC (Assignment)** | Full Control (CRUD) | Full Control (CRUD) | No Access | No Access |
| **Upload & Revisi Soal** | View All | View All | CRUD Soal Milik Sendiri | CRUD Soal Milik Sendiri |
| **Verifikasi Soal** | View Log | View Progress | No Access | Verifikasi Soal Penugasan |
| **Generate & Download Berita Acara** | Full Access | Full Access | No Access | View / Print BA Tugasnya |
| **Broadcast & Announcements** | CRUD & Publish | CRUD & Publish | Read / Notification | Read / Notification |
| **Export Laporan (PDF/Excel)** | Full Access | Full Access | No Access | No Access |

---

## 5. Functional Requirements (Kebutuhan Fungsional)

### 5.1 Dashboard & Monitoring
- **FR-DSB-01:** Menampilkan ringkasan statistik (Total Soal, Draft, Submitted, In Review, Revisi, Approved, Rejected).
- **FR-DSB-02:** Menampilkan informasi Periode Akademik Aktif beserta tanggal batas waktu (*deadline*) pengunggahan & verifikasi.
- **FR-DSB-03:** Menampilkan widget grafik progres verifikasi per Program Studi dan per Mata Kuliah.
- **FR-DSB-04:** Menampilkan widget notifikasi dan broadcast berita terbaru.

### 5.2 Manajemen Periode & Master Data Akademik
- **FR-MST-01:** CRUD data Program Studi (Kode Prodi, Nama Prodi).
- **FR-MST-02:** CRUD data Mata Kuliah (Kode MK, Nama MK, Prodi ID).
- **FR-MST-03:** CRUD data PLO (*Program Learning Outcomes*) dan CLO (*Course Learning Outcomes*) terikat pada prodi & periode.
- **FR-PER-01:** CRUD Periode Akademik (Nama Periode, Semester Ganjil/Genap, Tahun Akademik, Tanggal Mulai, Tanggal Deadline).
- **FR-PER-02:** Pengaturan aktivasi periode akademik (`PATCH /periode/{id}/activate`). Hanya 1 periode yang dapat berstatus **Aktif** pada satu waktu.

### 5.3 Manajemen Template & Kategori
- **FR-TPL-01:** CRUD Kategori Soal (misal: UTS, UAS, Quiz, Remedial).
- **FR-TPL-02:** Upload dan aktivasi Template Soal resmi (format DOCX/PDF) untuk diunduh Dosen.
- **FR-TPL-03:** Upload dan pengelolaan Template Berita Acara (format DOCX/Blade template) oleh Super Admin.

### 5.4 Penugasan PIC (Assignment Management)
- **FR-ASN-01:** Coordinator/Super Admin menetapkan Dosen Verifikator (PIC) untuk memverifikasi soal dari Dosen Target tertentu pada periode aktif.
- **FR-ASN-02:** Sistem mencatat penugasan dan mencegah pengulangan penugasan ganda (*duplicate assignment*) pada periode yang sama.
- **FR-ASN-03:** Pencarian dosen pengampu berbasis autokomplit untuk kemudahan penugasan.

### 5.5 Manajemen Unggah & Revisi Soal (Dosen Workflow)
- **FR-SOL-01:** Dosen dapat mengunggah berkas soal (wajib format PDF/DOCX sesuai ketentuan validasi API).
- **FR-SOL-02:** Dosen memilih Mata Kuliah, CLO yang relevan, Kategori Soal, dan Periode Akademik saat mengunggah.
- **FR-SOL-03:** Pengelolaan status soal: `draft` -> `submitted` -> `in_review` -> `revisi` / `approved` / `rejected`.
- **FR-SOL-04:** Dosen dapat mengunggah ulang revisi soal jika statusnya `revisi`. Sistem mencatat nomor versi (`versi 1`, `versi 2`, dst.) dan menyimpannya di riwayat revisi (`revisi_history`).

### 5.6 Workflow Verifikasi Soal (PIC Verifikator Workflow)
- **FR-VRF-01:** PIC dapat melihat daftar penugasan verifikasi soal dosen target melalui endpoint `/verifikasi/tugas-saya`.
- **FR-VRF-02:** PIC meninjau berkas soal, kesesuaian template, serta pemetaan CLO/PLO.
- **FR-VRF-03:** PIC memberikan keputusan verifikasi:
  - **Approve:** Mengubah status soal menjadi `approved`.
  - **Revisi:** Mengubah status soal menjadi `revisi` dan wajib melampirkan catatan revisi mendalam.
  - **Reject:** Mengubah status soal menjadi `rejected` dengan alasan penolakan.
- **FR-VRF-04:** Sistem mencatat transaksi verifikasi di tabel `verifications` sebagai audit log.

### 5.7 Otomatisasi Berita Acara Verifikasi (Minutes of Verification)
- **FR-BAC-01:** Penggenerasian Berita Acara otomatis oleh Coordinator/Super Admin jika seluruh soal pada periode/penugasan terkait telah berstatus `approved`.
- **FR-BAC-02:** Berita Acara diberi Nomor BA unik dengan format otomatis (contoh: `BA/VERIF/2026/001`).
- **FR-BAC-03:** Penyimpanan hasil cetak Berita Acara dalam format PDF (`file_pdf`) dan DOCX (`file_docx`).
- **FR-BAC-04:** Pratinjau (*Print Preview*) dan pengunduhan berkas Berita Acara via REST API.

### 5.8 Broadcast & System Notification
- **FR-BRD-01:** Super Admin dan Coordinator dapat membuat pesan pengumuman/broadcast untuk seluruh Dosen.
- **FR-BRD-02:** Sistem mengirimkan notifikasi in-app kepada Dosen saat ada pengumuman baru, penugasan PIC baru, atau pengembalian catatan revisi soal.

---

## 6. Non-Functional Requirements (Kebutuhan Non-Fungsional & Performa)

### 6.1 Usability & Interface
- **NFR-UI-01 (Modern Aesthetic):** Antarmuka web dibangun menggunakan React + TypeScript + Tailwind v4 HSL design system modern yang mendukung visualisasi data bersih, dark mode, serta responsive layout.
- **NFR-UI-02 (User Experience):** Waktu respon antarmuka lokal cepat (< 100ms untuk aksi lokal) dengan indikator Skeleton Loader yang intuitif.

### 6.2 Security & Authentication
- **NFR-SEC-01 (Authentication):** Menggunakan **Laravel Sanctum** berbasis Bearer Token yang terenkripsi aman.
- **NFR-SEC-02 (Role-Based Access Control):** Setiap endpoint diproteksi oleh middleware spesifik (`auth:sanctum`, `coordinator`, `super_admin`, `pic_periode`).
- **NFR-SEC-03 (Data Protection & Input Validation):** Seluruh masukan API divalidasi ketat via Form Request. Password di-hash menggunakan Bcrypt / Argon2ID.
- **NFR-SEC-04 (File Upload Security):** Validasi tipe MIME file (PDF/DOCX), pembatasan ukuran berkas maksimum (10MB), dan pengacakan nama berkas tersimpan di storage terproteksi.

### 6.3 Performance, Scalability & Throughput (SLA Performa)
- **NFR-PRF-01 (Database Indexing Strategy):** PostgreSQL dilengkapi dengan B-Tree Composite Indexes pada kolom `(periode_id, status)`, Partial Unique Index untuk periode aktif, dan Full-Text Search GIN Index.
- **NFR-PRF-02 (API Latency SLA):** Response time REST API wajib memenuhi standar latensi berikut:
  - Read Queries (`GET /soal`, `/dashboard`): Latensi p95 < **150ms**.
  - Write Operations (`POST /soal`, `POST /verifikasi`): Latensi p95 < **300ms**.
  - Sync Report Generation (PDF/DOCX): Latensi < **2.5 detik**.
- **NFR-PRF-03 (Concurrent Active Capacity):** Sistem harus mampu menangani minimal **500+ pengguna aktif bersamaan** (*concurrent active faculty users*) tanpa penurunan kinerja (*zero degradation*) pada puncak periode unggah soal.
- **NFR-PRF-04 (Asynchronous Job Queue):** Pemrosesan berat seperti penggenerasian Berita Acara massal dan pengiriman notifikasi broadcast dilakukan secara asynchronous menggunakan **Laravel Queue Workers** (`202 Accepted`).
- **NFR-PRF-05 (API Rate Limiting & Throttling):** Perlindungan endpoint menggunakan Laravel Rate Limiter (`5 req/min` untuk auth/report generation, `120 req/min` untuk API umum).
- **NFR-PRF-06 (HTTP & Static Asset Caching):** Endpoint data master dilengkapi header HTTP `ETag` dan `Cache-Control: max-age=300` untuk meminimalkan transmisi jaringan berulang.

### 6.4 Reliability & Auditability
- **NFR-REL-01 (Audit Trail):** Semua aksi krusial (login, verifikasi, ubah status, generate BA) dicatat dalam `activity_logs` dan `verifications` untuk keperluan audit akademik.
- **NFR-REL-02 (Soft Deletes):** Menggunakan pola *Soft Delete* pada tabel utama (`users`, `soal`, `verifications`) untuk mencegah kehilangan data akibat penghapusan tidak sengaja.

---

## 7. Business Rules (Aturan Bisnis Kunci)

- **BR-001 (Active Period Constraint):** Dosen hanya dapat mengunggah atau memperbarui soal pada Periode Akademik yang berstatus **Aktif** (`status = true`) dan sebelum tanggal *deadline* berlalu.
- **BR-002 (Ownership Constraint):** Dosen hanya dapat melihat draft, mengubah, atau mengunggah revisi pada soal miliknya sendiri.
- **BR-003 (Self-Verification Restriction):** PIC Verifikator **DILARANG HARAM** memverifikasi soal buatannya sendiri (`verifier_id != target_dosen_id`).
- **BR-004 (Approval Prerequisite for Minutes):** Berita Acara hanya dapat digenerasi untuk daftar soal yang **SELURUHNYA** telah mendapat status `approved`. Jika ada 1 soal yang masih `draft`, `submitted`, `in_review`, atau `revisi`, proses generate BA akan ditolak.
- **BR-005 (Active BA Template Required):** Penggenerasian Berita Acara mewajibkan adanya minimal 1 **Template Berita Acara** yang berstatus aktif dalam sistem.
- **BR-006 (Period-Scoped Assignment):** Penugasan PIC bersifat spesifik per Periode Akademik. Penugasan di semester ganjil tidak berlaku otomatis di semester genap.
- **BR-007 (Strict Status Flow):** Perubahan status soal wajib mengikuti alur baku: `draft` -> `submitted` -> `in_review` -> (`approved` | `revisi` | `rejected`). Status yang sudah `approved` tidak dapat diubah kembali kecuali oleh Super Admin melalui override reset.

---

## 8. Kriteria Penerimaan (Acceptance Criteria)

- [x] **Unggah Soal:** Dosen dapat mengunggah berkas PDF/DOCX, memilih CLO, dan status otomatis berubah menjadi `submitted`.
- [x] **Penugasan PIC:** Coordinator dapat menugaskan verifikator tanpa konflik/duplikasi penugasan.
- [x] **Verifikasi & Revisi:** PIC dapat menyetujui atau mengembalikan soal dengan catatan revisi. Dosen menerima notifikasi real-time dan dapat mengunggah versi revisi baru.
- [x] **Generasi Berita Acara:** Berita Acara ter-generate otomatis lengkap dengan nomor BA unik, daftar soal approved, dan berkas PDF/DOCX yang dapat diunduh.
- [x] **Dashboard Real-Time & High Performance:** Dashboard Koordinator menampilkan statistik real-time dengan latensi API < 150ms.

---

## 9. Success Metrics (Indikator Keberhasilan)

1. **100% Transformasi Digital:** Tidak ada lagi pengiriman soal ujian dan verifikasi via email atau WhatsApp.
2. **Efisiensi Waktu Verifikasi:** Memangkas durasi verifikasi soal dari rata-rata 7 hari menjadi maksimum 2-3 hari.
3. **Zero Lost Documents:** 0% kasus berkas soal tertukar, hilang, atau tidak memiliki versi yang jelas.
4. **Otomatisasi Berita Acara 100%:** 100% Berita Acara Verifikasi Soal dihasilkan secara otomatis oleh sistem tanpa rekap manual spreadsheet.
5. **High Throughput & SLA Adherence:** Latensi p95 REST API konsisten di bawah 150ms dan daya tampung 500+ pengguna aktif simultan tanpa bottleneck.

