# API Documentation

# Dashboard Verifikasi Soal Ujian - API Reference Specification

**Version:** 1.1  
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
| `202 Accepted` | Request diterima untuk diproses secara async. | Pemrosesan background job (Generate PDF/DOCX Berita Acara). |
| `400 Bad Request` | Pelanggaran aturan bisnis. | Contoh: Mencoba verifikasi soal buatan sendiri, generate BA saat soal belum approved. |
| `401 Unauthorized` | Token autentikasi hilang/invalid. | Header Authorization Bearer tidak dikirim atau sudah kadaluarsa. |
| `403 Forbidden` | Peran pengguna tidak diizinkan. | Dosen mencoba mengakses fitur Coordinator/Super Admin. |
| `404 Not Found` | Resource tidak ditemukan. | ID Soal, Periode, atau User tidak ada di database. |
| `422 Unprocessable` | Failure pada input validation. | Input form request tidak memenuhi aturan (format email, file wajib PDF). |
| `429 Too Many Requests` | Rate limit terlampaui. | Jumlah request melebihi batas yang diizinkan per menit. |
| `500 Server Error` | Unexpected internal server error. | Kegagalan sistem, koneksi DB terputus, error rendering PDF/DOCX. |

---

## 2. Authentication Endpoints

### 2.1 Login
- **URL:** `POST /auth/login`
- **Auth:** Public
- **Rate Limit:** `throttle:5,1` (Maksimum 5 percobaan login per menit per IP)
- **Request Body:**
```json
{
  "email": "dosen@telkomuniversity.ac.id",
  "password": "password"
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

---

## 4. Master Data Akademik (Program Studi, Courses, PLO, CLO)

### 4.1 Get List Program Studi
- **URL:** `GET /program-studi`
- **Auth:** `auth:sanctum`
- **HTTP Caching:** Response dikirim dengan header `Cache-Control: private, max-age=300, ETag` untuk mengurangi latensi jaringan frontend.

---

## 5. Unggah & Kelola Soal Endpoints

### 5.1 List Soal
- **URL:** `GET /soal`
- **Query Params:** `periode_id`, `status`, `mata_kuliah_id`, `search`, `per_page` (Default: 15, Max: 100)
- **Auth:** `auth:sanctum`

### 5.2 Upload / Create Soal
- **URL:** `POST /soal`
- **Content-Type:** `multipart/form-data`
- **Rate Limit:** `throttle:10,1` (Maksimum 10 kali unggah per menit per user)
- **Auth:** `auth:sanctum`
- **Form Fields:**
  - `mata_kuliah_id` (integer, required)
  - `clo_id` (integer, required)
  - `periode_id` (integer, required)
  - `judul_soal` (string, required)
  - `file_soal` (file, required, PDF format, max 10MB)

---

## 6. Berita Acara Endpoints (Async Queue Enabled)

### 6.1 Generate Berita Acara (Async Job)
- **URL:** `POST /berita-acara/generate`
- **Auth:** `auth:sanctum`, Middleware: `coordinator`
- **Rate Limit:** `throttle:5,1`
- **Request Body:**
```json
{
  "periode_id": 2,
  "verifier_id": 5
}
```
- **Response `202 Accepted` (Background Queue Processing):**
```json
{
  "success": true,
  "message": "Permintaan pembuatan Berita Acara telah diterima dan sedang diproses di background.",
  "data": {
    "job_id": "job_ba_render_9872136",
    "status": "processing",
    "status_url": "/api/v1/jobs/job_ba_render_9872136/status"
  }
}
```

### 6.2 Polling Status Job Generate Berita Acara
- **URL:** `GET /jobs/{job_id}/status`
- **Auth:** `auth:sanctum`
- **Response `200 OK` (Saat Selesai):**
```json
{
  "success": true,
  "data": {
    "job_id": "job_ba_render_9872136",
    "status": "completed",
    "result": {
      "berita_acara_id": 12,
      "nomor_ba": "BA/VERIF/2026/0012",
      "file_pdf_url": "/api/v1/berita-acara/12/download?format=pdf",
      "file_docx_url": "/api/v1/berita-acara/12/download?format=docx"
    }
  }
}
```

---

## 7. Optimasi Performa & Pembatasan API (Performance & Rate Limiting Strategy)

### 7.1 Aturan Rate Limiting (API Throttling Matrix)

| Endpoint Group | Middleware Rate Limit | Alasan Performa & Keamanan |
| :--- | :--- | :--- |
| `POST /auth/login` | `throttle:5,1` | Proteksi brute-force attack & penghematan resource hash Bcrypt. |
| Standard API (`GET /soal`, `/dashboard`) | `throttle:120,1` | Menjamin throughput 120 request/menit per user terautentikasi. |
| File Upload (`POST /soal`, `/templates`) | `throttle:10,1` | Mencegah penumpukan memori upload file di server web. |
| Report Generation (`POST /berita-acara/generate`) | `throttle:5,1` | Mencegah lonjakan CPU dari rendering PDF Dompdf & DOCX PHPWord. |

### 7.2 Strategy HTTP Caching & Compression
1. **Response Payload Compression:** Mengaktifkan kompresi Gzip / Brotli pada Nginx / Web Server untuk seluruh response `application/json` (memotong ukuran payload data hingga 70%).
2. **Client-Side HTTP Caching (ETag & Cache-Control):**
   - Endpoint Master Data (`GET /program-studi`, `GET /courses`, `GET /categories`) mengirimkan header `Cache-Control: private, max-age=300`.
   - Browser client akan mengembalikan `304 Not Modified` jika data tidak mengalami perubahan.
3. **Payload Pagination Boundary:** Parameter `per_page` dibatasi secara mutlak maksimum **100 item** untuk mencegah kebocoran memori RAM PHP akibat query berukuran raksasa.

