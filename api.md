# API Documentation

# Dashboard Verifikasi Soal Ujian - API Reference Specification

**Version:** 1.0  
**Base URL:** `http://localhost:8000/api/v1` (Development) / `https://verifikasi-soal.telkomuniversity.ac.id/api/v1` (Production)  
**Authentication:** Laravel Sanctum (Bearer Token)  
**Content-Type Header:** `application/json` (Kecuali endpoint upload file: `multipart/form-data`)  

---

## 1. Konvensi Spesifikasi & Format Response

Semua respon REST API menggunakan amplop JSON tersentralisasi demi menjamin konsistensi penanganan data di sisi frontend client.

### 1.1 Success Response Standard
```json
{
  "success": true,
  "message": "Deskripsi sukses transaksi",
  "data": {},
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 75
  }
}
```

### 1.2 Error Response Standard
```json
{
  "success": false,
  "message": "Pesan error atau deskripsi kegagalan",
  "errors": {
    "field_name": [
      "Detail pesan validasi error..."
    ]
  }
}
```

### 1.3 HTTP Status Codes Reference

| HTTP Code | Description | Skenario Penggunaan |
| :--- | :--- | :--- |
| `200 OK` | Request berhasil diproses. | Operasi GET, PUT, PATCH, DELETE yang sukses. |
| `201 Created` | Resource baru berhasil dibuat. | Operasi POST penciptaan data baru (User, Soal, Periode, dll). |
| `400 Bad Request` | Pelanggaran aturan bisnis. | Contoh: Mencoba verifikasi soal buatan sendiri, generate BA saat soal belum approved. |
| `401 Unauthorized` | Token autentikasi hilang/invalid. | Header Authorization Bearer tidak dikirim atau sudah kadaluarsa. |
| `403 Forbidden` | Peran pengguna tidak diizinkan. | Dosen mencoba mengakses fitur Coordinator/Super Admin. |
| `404 Not Found` | Resource tidak ditemukan. | ID Soal, Periode, atau User tidak ada di database. |
| `422 Unprocessable` | Failure pada input validation. | Input form request tidak memenuhi aturan (format email, file wajib PDF). |
| `500 Server Error` | Unexpected internal server error. | Kegagalan sistem, koneksi DB terputus, error rendering PDF/DOCX. |

---

## 2. Authentication Endpoints

### 2.1 Login
- **URL:** `POST /auth/login`
- **Auth:** Public
- **Request Body:**
```json
{
  "email": "dosen@telkomuniversity.ac.id",
  "password": "password123"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "1|laravel_sanctum_token_hash_example...",
    "user": {
      "id": 1,
      "uuid": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "kode_dosen": "DSN-SI-001",
      "nama_lengkap": "Dr. Dosen Contoh, S.T., M.T.",
      "email": "dosen@telkomuniversity.ac.id",
      "prodi_id": 1,
      "is_super_admin": false,
      "is_coordinator": true,
      "status_aktif": true,
      "roles": ["coordinator", "dosen"]
    }
  }
}
```

### 2.2 Logout
- **URL:** `POST /auth/logout`
- **Auth:** `auth:sanctum`
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Logout berhasil, token telah dicabut"
}
```

### 2.3 Get Profile (`/me`)
- **URL:** `GET /auth/me`
- **Auth:** `auth:sanctum`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nama_lengkap": "Dr. Dosen Contoh, S.T., M.T.",
    "email": "dosen@telkomuniversity.ac.id",
    "kode_dosen": "DSN-SI-001",
    "prodi": {
      "id": 1,
      "kode_prodi": "SI",
      "nama_prodi": "S1 Sistem Informasi"
    },
    "is_super_admin": false,
    "is_coordinator": true
  }
}
```

---

## 3. Dashboard & Metrics Endpoints

### 3.1 Dashboard Coordinator
- **URL:** `GET /dashboard/coordinator`
- **Auth:** `auth:sanctum`, Middleware: `coordinator`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "periode_aktif": {
      "id": 2,
      "nama_periode": "Semester Genap 2025/2026",
      "tanggal_deadline": "2026-08-15"
    },
    "statistics": {
      "total_soal": 120,
      "draft": 15,
      "submitted": 35,
      "in_review": 20,
      "revisi": 10,
      "approved": 38,
      "rejected": 2
    },
    "progress_percentage": 31.67
  }
}
```

### 3.2 Dashboard Dosen
- **URL:** `GET /dashboard/dosen`
- **Auth:** `auth:sanctum`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "my_soal_summary": {
      "total": 4,
      "draft": 1,
      "submitted": 1,
      "revisi": 1,
      "approved": 1
    },
    "recent_soal": []
  }
}
```

### 3.3 Dashboard PIC
- **URL:** `GET /dashboard/pic`
- **Auth:** `auth:sanctum`, Middleware: `pic_periode`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "assigned_tasks_count": 8,
    "pending_review_count": 3,
    "completed_review_count": 5
  }
}
```

---

## 4. Master Data Akademik (Program Studi, Courses, PLO, CLO)

### 4.1 Get List Program Studi
- **URL:** `GET /program-studi`
- **Auth:** `auth:sanctum`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kode_prodi": "SI",
      "nama_prodi": "S1 Sistem Informasi"
    },
    {
      "id": 2,
      "kode_prodi": "IF",
      "nama_prodi": "S1 Informatika"
    }
  ]
}
```

### 4.2 Get List Courses (Mata Kuliah)
- **URL:** `GET /courses?prodi_id=1`
- **Auth:** `auth:sanctum`
- **Query Params:** `prodi_id` (optional filter)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "kode_mk": "CSI1A3",
      "nama_mk": "Algoritma & Pemrograman",
      "prodi_id": 1
    }
  ]
}
```

### 4.3 Management PLO & CLO
- **URLs:**
  - `GET /plo` | `POST /plo` | `PUT /plo/{id}` | `DELETE /plo/{id}`
  - `GET /clo` | `POST /clo` | `PUT /clo/{id}` | `DELETE /clo/{id}`
- **Auth:** `auth:sanctum`
- **POST `/clo` Request Body Example:**
```json
{
  "plo_id": 1,
  "periode_id": 2,
  "kode_clo": "CLO-01",
  "deskripsi": "Mampu merancang arsitektur REST API sesuai standar industri"
}
```

---

## 5. Periode Akademik Endpoints

### 5.1 List & Create Periode
- **GET /periode:** Ambil seluruh daftar periode akademik.
- **POST /periode:** (Middleware: `coordinator`)
  - **Request Body:**
```json
{
  "nama_periode": "Semester Ganjil 2026/2027",
  "semester": "ganjil",
  "tahun_akademik": "2026/2027",
  "tanggal_mulai": "2026-09-01",
  "tanggal_deadline": "2026-10-15"
}
```

### 5.2 Activate Periode
- **URL:** `PATCH /periode/{id}/activate`
- **Auth:** `auth:sanctum`, Middleware: `coordinator`
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Periode Semester Ganjil 2026/2027 berhasil diaktifkan"
}
```

---

## 6. Template & Kategori Endpoints

### 6.1 Kategori Soal
- `GET /kategori` | `POST /kategori` | `PUT /kategori/{id}` | `DELETE /kategori/{id}`

### 6.2 Template Soal
- `GET /templates` | `POST /templates` | `DELETE /templates/{id}`
- **POST `/templates` (Multipart/Form-data):**
  - `kategori_id`: 1
  - `nama_file`: "Template Soal UTS 2026"
  - `file`: (binary DOCX file)
  - `versi`: 1

### 6.3 Template Berita Acara
- `GET /template-ba` (Super Admin)
- `GET /template-ba/active` (Public Auth)
- `POST /template-ba` (Super Admin - Multipart file DOCX/Blade)
- `PUT /template-ba/{id}/activate` (Super Admin)

---

## 7. Penugasan PIC (Assignment) Endpoints

### 7.1 Search Dosen for Assignment
- **URL:** `GET /dosen/search?q=Ahmad`
- **Auth:** `auth:sanctum`, Middleware: `coordinator`

### 7.2 Create Assignment
- **URL:** `POST /penugasan`
- **Auth:** `auth:sanctum`, Middleware: `coordinator`
- **Request Body:**
```json
{
  "periode_id": 2,
  "verifier_id": 5,
  "target_dosen_id": 12
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Penugasan PIC berhasil ditambahkan",
  "data": {
    "id": 10,
    "periode_id": 2,
    "verifier_id": 5,
    "target_dosen_id": 12,
    "assigned_by": 1
  }
}
```

---

## 8. Unggah & Kelola Soal Endpoints

### 8.1 List Soal
- **URL:** `GET /soal`
- **Query Params:** `periode_id`, `status`, `mata_kuliah_id`, `search`
- **Auth:** `auth:sanctum`

### 8.2 Upload / Create Soal
- **URL:** `POST /soal`
- **Content-Type:** `multipart/form-data`
- **Auth:** `auth:sanctum`
- **Form Fields:**
  - `mata_kuliah_id` (integer, required)
  - `clo_id` (integer, required)
  - `periode_id` (integer, required)
  - `template_id` (integer, optional)
  - `judul_soal` (string, required)
  - `file_soal` (file, required, PDF format, max 10MB)
  - `status` (string, enum: `draft` | `submitted`, default: `submitted`)
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Soal berhasil diunggah",
  "data": {
    "id": 45,
    "uuid": "a7c82e66-88b1-4f2a-b67f-90214c71ef10",
    "judul_soal": "Soal UTS Algoritma 2026",
    "status": "submitted",
    "versi": 1,
    "file_soal_url": "/storage/soal/soal_uts_algoritma.pdf"
  }
}
```

### 8.3 Upload Revisi Soal
- **URL:** `POST /soal/{id}` (dengan Form Method Override `_method=PUT`)
- **Auth:** `auth:sanctum` (Hanya pemilik soal)
- **Form Fields:** `file_soal` (PDF), `catatan_revisi` (optional)
- **Response `200 OK`:** Status otomatis ter-increment versi-nya (`versi`: 2) dan status kembali menjadi `submitted` / `in_review`.

---

## 9. Verifikasi Soal Endpoints

### 9.1 Get Tugas Verifikasi Saya (PIC Only)
- **URL:** `GET /verifikasi/tugas-saya`
- **Auth:** `auth:sanctum`, Middleware: `pic_periode`

### 9.2 Submit Decision Verifikasi
- **URL:** `POST /soal/{soal}/verifikasi`
- **Auth:** `auth:sanctum`, Middleware: `pic_periode`
- **Request Body:**
```json
{
  "status": "revisi",
  "catatan": "Mohon perbaiki Bobot Nilai pada Soal No. 3 agar sesuai CLO-02."
}
```
*Note: Nilai status valid: `approved`, `revisi`, `rejected`.*
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Verifikasi berhasil disimpan. Status soal diubah menjadi revisi.",
  "data": {
    "id": 78,
    "soal_id": 45,
    "verifier_id": 5,
    "status": "revisi",
    "catatan": "Mohon perbaiki Bobot Nilai pada Soal No. 3 agar sesuai CLO-02.",
    "verified_at": "2026-07-24T14:30:00Z"
  }
}
```

### 9.3 Get Verifikasi History Log
- **URL:** `GET /soal/{soal}/verifikasi/history`
- **Auth:** `auth:sanctum`

---

## 10. Berita Acara Endpoints

### 10.1 Generate Berita Acara
- **URL:** `POST /berita-acara/generate`
- **Auth:** `auth:sanctum`, Middleware: `coordinator`
- **Request Body:**
```json
{
  "periode_id": 2,
  "verifier_id": 5
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Berita Acara berhasil digenerasi",
  "data": {
    "id": 12,
    "nomor_ba": "BA/VERIF/2026/0012",
    "generated_at": "2026-07-24T14:35:00Z",
    "file_pdf_url": "/api/v1/berita-acara/12/download?format=pdf",
    "file_docx_url": "/api/v1/berita-acara/12/download?format=docx"
  }
}
```

### 10.2 Download Berita Acara
- **URL:** `GET /berita-acara/{id}/download?format=pdf`
- **Auth:** `auth:sanctum`
- **Response:** Binary Stream Download File (Content-Type: `application/pdf` atau `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).

---

## 11. Broadcast & Notification Endpoints

### 11.1 Create Broadcast Announcement
- **URL:** `POST /broadcast`
- **Auth:** `auth:sanctum`, Middleware: `coordinator`
- **Request Body:**
```json
{
  "title": "Batas Waktu Unggah Soal UTS Semester Genap 2025/2026",
  "message": "Diimbau kepada seluruh Dosen Pengampu untuk mengunggah soal sebelum tanggal 15 Agustus 2026."
}
```

### 11.2 Get User Notifications
- **URL:** `GET /notifikasi`
- **Auth:** `auth:sanctum`
- **PATCH `/notifikasi/{id}/read`:** Tandai notifikasi dibaca.
- **PATCH `/notifikasi/read-all`:** Tandai semua dibaca.
