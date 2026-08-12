# USER FLOW
## Website Verifikator

**Source**: Use Case Diagram "Dashboard Verifikasi Soal" (C) — dibaca literal. Notulensi (B)
digunakan hanya sebagai rujukan silang untuk penamaan/context (semester, periode), bukan
untuk menambah langkah yang tidak ada di diagram.

**Prinsip penyusunan**: setiap langkah pada flow di bawah ini hanya boleh mewakili use case,
extension point, atau relasi include/extend yang benar-benar tergambar di diagram. Jika
sebuah kebutuhan disebut di notulensi tapi tidak punya representasi use case di diagram,
flow tidak dibuat untuk kebutuhan itu — ditandai `FLOW NOT SPECIFIED IN SOURCE` di bagian
akhir dokumen ini, bukan diisi dengan asumsi urutan langkah.

---

## 1. SUPERADMIN FLOW

### 1.1 Overview — Percabangan dari Aktor SuperAdmin

Berdasarkan diagram, SuperAdmin punya 4 titik masuk (garis solid langsung dari aktor):

```
SuperAdmin
   │
   ├── Mengelola master data
   ├── Mengelola tahun ajaran
   ├── Mengelola kategori soal
   └── Menentukan dosen verifikator
```

Tidak ada urutan wajib antar keempat titik ini yang tergambar di diagram — keempatnya
independen dari sisi aktor. Urutan di bawah disusun untuk keperluan dokumentasi, bukan
klaim bahwa SuperAdmin harus mengikuti urutan tersebut.

### 1.2 Flow — Mengelola Master Data

```
Login sebagai SuperAdmin
   ↓
Buka menu "Mengelola master data"
   ↓
Pilih salah satu extension point:
   ├── clo
   ├── plo
   ├── mata kuliah
   └── dosen
   ↓
Lakukan pengelolaan pada entitas terpilih
```

**Catatan wajib**: Diagram menampilkan `clo`, `plo`, `mata kuliah`, `dosen` sebagai
extension `<<Extend>>` dari "Mengelola master data" — bukan use case independen dengan
langkah tersendiri. Diagram tidak merinci apakah "pengelolaan" di sini berarti create,
read, update, delete, atau kombinasi tertentu untuk masing-masing entitas.

`NEEDS CONFIRMATION`: Notulensi (B), BR-13, menyatakan CLO/PLO/Mata Kuliah "dianggap
sudah ditetapkan seperti pada sistem OBE" dan sistem "tidak lagi menggunakan proses
penetapan tersendiri" untuk ketiganya. Ini berpotensi bertentangan dengan pembacaan
literal use case di atas (yang menyiratkan pengelolaan penuh). Flow di atas tetap
mengikuti diagram sesuai instruksi eksplisit — potensi konflik ini **tidak diselesaikan**
di dalam flow, dan wajib dikonfirmasi sebelum langkah "Lakukan pengelolaan" pada `clo`,
`plo`, dan `mata kuliah` diimplementasikan sebagai CRUD penuh.

### 1.3 Flow — Mengelola Tahun Ajaran

```
Login sebagai SuperAdmin
   ↓
Buka menu "Mengelola tahun ajaran"
   ↓
[Opsional — extension] Ubah status periode
   ↓
   (extension point: Menonaktifkan Periode Verifikasi)
```

Diagram menampilkan satu extension point bernama "Menonaktifkan Periode Verifikasi" pada
use case "Mengelola tahun ajaran", terhubung juga dari use case terpisah "mengubah status
periode" via `<<Extend>>`. Detail lain dari "mengelola tahun ajaran" (mis. membuat tahun
ajaran baru) tidak dirinci di diagram — tidak ditambahkan ke flow ini.

### 1.4 Flow — Mengelola Kategori Soal

```
Login sebagai SuperAdmin
   ↓
Buka menu "Mengelola kategori soal"
   ↓
Lakukan pengelolaan kategori soal
```

Diagram tidak memiliki extension/include pada use case ini — tidak ada sub-langkah yang
dapat diturunkan tanpa berspekulasi. Detail operasi (tambah/edit/hapus kategori) `NEEDS
CONFIRMATION`.

### 1.5 Flow — Menentukan Dosen Verifikator

```
Login sebagai SuperAdmin
   ↓
Buka menu "Menentukan dosen verifikator"
   ↓
[WAJIB — include] Menentukan MK
   ↓
Sistem menyimpan penugasan Verifikator untuk MK terpilih
```

Ini satu-satunya relasi `<<Include>>` pada seluruh diagram — artinya "menentukan MK" bukan
langkah opsional, melainkan **bagian wajib** dari proses "menentukan dosen verifikator".
Urutan yang ditampilkan (include mengalir ke bawah pada diagram, dari "menentukan dosen
verifikator" ke "menentukan MK") dibaca sebagai: MK harus ditentukan sebagai bagian dari
proses ini, kemungkinan sebelum atau bersamaan dengan penentuan dosen — diagram tidak
merinci urutan sub-langkah include, jadi urutan pasti (MK dulu baru dosen, atau
sebaliknya) `NEEDS CONFIRMATION`.

### 1.6 Ringkasan Diagram Alur SuperAdmin

```
Login
 ↓
┌─────────────────────────────────────────────┐
│         (4 titik masuk independen)            │
├─────────────────────────────────────────────┤
│ Mengelola master data                         │
│   └── extend: clo / plo / mata kuliah / dosen │
│                                                 │
│ Mengelola tahun ajaran                         │
│   └── extend: mengubah status periode          │
│                                                 │
│ Mengelola kategori soal                        │
│                                                 │
│ Menentukan dosen verifikator                   │
│   └── include (wajib): menentukan MK           │
└─────────────────────────────────────────────┘
```

---

## 2. KOORDINATOR FLOW (Dosen Koordinator MK)

### 2.1 Overview — Percabangan dari Aktor Dosen Koordinator MK

```
Dosen Koordinator MK
   │
   ├── Mengunduh Template Soal
   ├── Mengunggah Soal
   └── Melihat Status Verifikasi
```

### 2.2 Flow — Mengunduh Template Soal

```
Login sebagai Dosen Koordinator MK
   ↓
Buka menu "Mengunduh Template Soal"
   ↓
Sistem menyediakan file template untuk diunduh
```

Diagram tidak memiliki extension/include pada use case ini.

### 2.3 Flow — Mengunggah Soal

```
Login sebagai Dosen Koordinator MK
   ↓
Buka menu "Mengunggah Soal"
   ↓
Unggah file soal
   ↓
[Opsional — extension] Mengunggah Revisi Soal
```

Diagram menampilkan "Mengunggah Revisi Soal" sebagai extension `<<Extend>>` dari
"Mengunggah Soal" — dibaca sebagai proses opsional yang tersedia setelah soal awal sudah
ada dalam sistem (revisi mengandaikan ada versi sebelumnya). Diagram tidak merinci trigger
pasti kapan extension ini aktif (mis. apakah trigger-nya adalah status verifikasi
"Revisi" dari Verifikator) — hubungan ini `NEEDS CONFIRMATION`, lihat juga Section 4 di
bawah soal keterkaitan dengan flow Verifikator.

### 2.4 Flow — Melihat Status Verifikasi

```
Login sebagai Dosen Koordinator MK
   ↓
Buka menu "Melihat Status Verifikasi"
   ↓
Sistem menampilkan status verifikasi soal yang relevan dengan Koordinator tersebut
```

Diagram tidak merinci filter/scope tampilan (mis. apakah hanya soal miliknya sendiri, atau
seluruh soal pada MK yang dikoordinasikannya) — `NEEDS CONFIRMATION`.

### 2.5 Ringkasan Diagram Alur Koordinator

```
Login
 ↓
┌─────────────────────────────────────────────┐
│ Mengunduh Template Soal                       │
│                                                 │
│ Mengunggah Soal                                │
│   └── extend: Mengunggah Revisi Soal           │
│                                                 │
│ Melihat Status Verifikasi                      │
└─────────────────────────────────────────────┘
```

---

## 3. VERIFIKATOR FLOW (Dosen Verifikator)

### 3.1 Overview — Percabangan dari Aktor Dosen Verifikator

Diagram menampilkan satu titik masuk tunggal dari aktor Dosen Verifikator:

```
Dosen Verifikator
   │
   └── Memverifikasi Soal
```

### 3.2 Flow — Memverifikasi Soal

```
Login sebagai Dosen Verifikator
   ↓
Buka menu "Memverifikasi Soal"
   ↓
Tinjau soal yang perlu diverifikasi
   ↓
[Opsional — extension] Memberikan Catatan Verifikasi
   ↓
[Opsional — extension] mencetak berita acara
```

**Catatan wajib**: Diagram tidak menampilkan use case terpisah bernama "Approve", "Revisi",
atau "Reject" — meskipun ketiganya disebutkan eksplisit di audit teknis (A) sebagai status
workflow verifikasi yang sudah fully implemented. "Memverifikasi Soal" pada diagram
kemungkinan adalah use case payung yang di dalamnya terjadi pemilihan status
(Approve/Revisi/Reject), tapi diagram tidak merinci ini sebagai langkah/percabangan
terpisah. Flow di atas **tidak menambahkan** langkah "Pilih status: Approve/Revisi/Reject"
karena itu tidak tergambar eksplisit di diagram — ini murni gap representasi, ditandai
`NEEDS CONFIRMATION`, bukan diisi dari asumsi berdasarkan audit.

Kedua extension ("Memberikan Catatan Verifikasi" dan "mencetak berita acara") tergambar
independen satu sama lain pada diagram (keduanya extend langsung dari "Memverifikasi
Soal", tidak saling extend). Tidak ada urutan wajib antara keduanya yang tergambar —
"mencetak berita acara" tidak digambarkan sebagai langkah yang harus didahului "Memberikan
Catatan Verifikasi", meskipun secara umum proses pencetakan Berita Acara biasanya terjadi
setelah keputusan verifikasi final. Urutan pasti `NEEDS CONFIRMATION`.

### 3.3 Ringkasan Diagram Alur Verifikator

```
Login
 ↓
Memverifikasi Soal
   ├── extend: Memberikan Catatan Verifikasi
   └── extend: mencetak berita acara
```

---

## 4. RELASI ANTAR-FLOW YANG TIDAK TERGAMBAR EKSPLISIT

Beberapa keterkaitan logis antar flow (Koordinator ↔ Verifikator) **tampak masuk akal**
dari konteks bisnis, namun **tidak tergambar sebagai relasi eksplisit** di diagram use
case (tidak ada garis, extend, atau include yang menghubungkan use case milik Koordinator
dengan use case milik Verifikator). Sesuai instruksi untuk mengikuti apa yang benar-benar
ada di use case, keterkaitan berikut **tidak dituliskan sebagai flow gabungan**, hanya
dicatat sebagai potensi gap:

- Hubungan antara hasil "Memverifikasi Soal" (Verifikator) dengan trigger "Mengunggah
  Revisi Soal" (Koordinator) — tidak ada relasi eksplisit di diagram.
- Hubungan antara "Melihat Status Verifikasi" (Koordinator) dengan output dari
  "Memverifikasi Soal" (Verifikator) — tidak ada relasi eksplisit di diagram, meski secara
  logis status yang dilihat Koordinator kemungkinan berasal dari sini.

---

## 5. FLOW NOT SPECIFIED IN SOURCE

Kebutuhan berikut disebutkan di notulensi (B) sebagai business requirement, namun tidak
memiliki representasi use case, extension, atau include yang jelas di diagram (C).
Konsisten dengan instruksi untuk mengikuti apa yang benar-benar ada di use case, flow
untuk item-item ini **tidak dibuat**:

- **BR-03 (Penunjukan Koordinator) dan BR-04 (Pergantian Koordinator)** — tidak ada use
  case bernama eksplisit untuk ini. Kemungkinan tercakup di dalam extension `dosen` pada
  "Mengelola master data" (Section 1.2), tapi diagram tidak merinci ini sebagai proses
  penunjukan/pergantian Koordinator secara spesifik.
  → `FLOW NOT SPECIFIED IN SOURCE`
- **BR-08 (Periode soal mengikuti periode berjalan)** — kemungkinan berkaitan dengan
  "Mengelola tahun ajaran" / "mengubah status periode" (Section 1.3), namun diagram tidak
  merinci mekanisme "opsi periode soal menyesuaikan periode berjalan" sebagai
  langkah/use case tersendiri.
  → `FLOW NOT SPECIFIED IN SOURCE`
- **BR-11 (Monitoring status upload kelas dengan konteks semester berjalan)** — tidak ada
  use case bernama "Monitoring" atau serupa pada diagram sama sekali, baik di sisi
  SuperAdmin, Koordinator, maupun Verifikator.
  → `FLOW NOT SPECIFIED IN SOURCE`
- **BR-10 (Penghapusan kursor/info pada deskripsi chart)** — ini adalah UI adjustment,
  bukan use case aksi user, sehingga secara wajar memang tidak muncul di use case diagram.
  Tidak dianggap sebagai gap, hanya dicatat karena merupakan BR aktif dari notulensi.
  → Tidak relevan untuk direpresentasikan sebagai user flow.

---

## 6. CATATAN PENUTUP

Seluruh flow pada dokumen ini adalah representasi langsung dari use case diagram (C),
tanpa penambahan langkah, urutan, atau percabangan yang tidak tergambar di sumber
tersebut. Titik-titik yang ditandai `NEEDS CONFIRMATION` bukan kekurangan pada dokumen
ini — melainkan batas jujur dari seberapa jauh diagram use case saja dapat menentukan
urutan operasional yang presisi. Detail lebih lanjut (urutan sub-langkah, validasi per
field, kondisi percabangan) memerlukan sumber tambahan seperti wireframe, sequence
diagram, atau spesifikasi tertulis per use case sebelum dapat dituliskan sebagai flow
yang lebih rinci.