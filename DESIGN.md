# Panduan Desain UI/UX (DESIGN.md)
**Sistem Verifikasi Soal Ujian — Telkom University**

Dokumen ini berfungsi sebagai acuan utama bagi developer dalam merancang, memodifikasi, dan mengimplementasikan antarmuka pengguna (UI) agar tetap konsisten dengan struktur dan estetika visual yang sudah ada.

---

## 1. Prinsip Desain Utama

1. **Akademik & Profesional**: UI harus mencerminkan identitas institusi yang bersih, andal, dan modern dengan dominasi warna khas Telkom University.
2. **Keterbacaan Tinggi**: Prioritaskan kontras teks yang memadai, hierarki tipografi yang jelas, serta spasi (padding/margin) yang longgar untuk kenyamanan membaca.
3. **Responsif & Ramah Pengguna**: Setiap antarmuka wajib dirancang agar dapat diakses dengan baik di perangkat *mobile* (smartphone) hingga layar *desktop* lebar.
4. **Kejelasan Status**: Pengguna harus selalu mengetahui status data (misalnya: draf, sedang direview, disetujui) secara instan melalui visualisasi warna badge yang konsisten.

---

## 2. Design Tokens (Tailwind CSS v4 & CSS Variables)

Aplikasi ini menggunakan **Tailwind CSS v4** dengan kustomisasi tema yang didefinisikan langsung di dalam [app.css](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/css/app.css).

### A. Palet Warna (Color Palette)

Gunakan variabel CSS berikut atau utility class Tailwind yang sesuai untuk pewarnaan:

| Kategori | Nama Variabel CSS | Nilai Hex | Utility Class (Tailwind) | Deskripsi |
| :--- | :--- | :--- | :--- | :--- |
| **Primary** | `--color-primary` | `#C8102E` | `bg-primary` / `text-primary` | Merah khas Telkom University |
| | `--color-primary-dark` | `#9E0B23` | `bg-primary-dark` | Merah gelap untuk hover/active |
| | `--color-primary-light` | `#FCE8EA` | `bg-primary-light` | Merah sangat muda untuk highlight/alert |
| **Secondary** | `--color-secondary` | `#1A1A1A` | `bg-secondary` / `text-secondary` | Hitam arang untuk teks utama & judul |
| **Neutral** | `--color-white` | `#FFFFFF` | `bg-white` | Putih bersih untuk latar kartu/modal |
| **Gray Scale**| `--color-gray-50` | `#F9FAFB` | `bg-gray-50` | Latar belakang halaman (canvas) |
| | `--color-gray-100` | `#F3F4F6` | `bg-gray-100` | Latar tombol pasif / baris tabel hover |
| | `--color-gray-200` | `#E5E7EB` | `border-gray-200` | Border standar elemen |
| | `--color-gray-500` | `#6B7280` | `text-gray-500` | Teks keterangan / deskripsi sekunder |
| | `--color-gray-900` | `#111827` | `text-gray-900` | Teks tebal / nilai metrik |
| **Success** | `--color-success` | `#16A34A` | `text-success` / `border-success` | Hijau status "Disetujui" |
| | `--color-success-light` | `#DCFCE7` | `bg-success-light` | Latar badge hijau |
| **Warning** | `--color-warning` | `#D97706` | `text-warning` / `border-warning` | Jingga/Kuning status "Perlu Revisi" |
| | `--color-warning-light` | `#FEF3C7` | `bg-warning-light` | Latar badge jingga |
| **Danger** | `--color-danger` | `#DC2626` | `text-danger` / `bg-danger` | Merah status "Ditolak" / aksi hapus |
| | `--color-danger-light` | `#FEE2E2` | `bg-danger-light` | Latar badge merah / dialog konfirmasi |
| **Info** | `--color-info` | `#2563EB` | `text-info` / `border-info` | Biru status "Submitted" / "Dalam Review" |
| | `--color-info-light` | `#DBEAFE` | `bg-info-light` | Latar badge biru |

### B. Tipografi & Font

*   **Judul (Heading)**: Menggunakan font **Poppins** (`font-heading`), bobot `font-semibold` atau `font-bold`.
*   **Isi (Body)**: Menggunakan font **Inter** (`font-sans`), ukuran dasar `15px` (`body` text), `line-height: 1.6`.

### C. Pembulatan Sudut (Border Radius)
*   `rounded-2xl` (16px): Digunakan untuk Container Utama, Banner Periode, dan Stat Cards.
*   `rounded-xl` (12px): Digunakan untuk Modal Panel, Form Wizard Container, Widget Kecil, dan Tabel Wrapper.
*   `rounded-lg` (8px): Digunakan untuk Tombol (Button), Dropdown (Select), Input Text, dan Kotak Dialog Konfirmasi.
*   `rounded-full` (Pill): Digunakan untuk Badges Status dan Avatar Inisial.

### D. Shadow & Ring Focus
*   **Shadow**: `shadow-sm` untuk kartu informasi standar, `shadow-md` untuk hover state, `shadow-2xl` untuk modal overlay.
*   **Focus Ring**: Ketika elemen menerima fokus keyboard, wajib menampilkan outline warna primary:
    ```css
    :focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }
    ```

---

## 3. Struktur Layout Global (`MainLayout`)

Setiap halaman yang membutuhkan autentikasi dibungkus dalam [MainLayout.tsx](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/js/shared/layouts/MainLayout.tsx):

1.  **Sidebar (Fixed Left)**:
    *   Lebar tetap pada desktop. Dapat disembunyikan/dijadikan drawer pada mobile.
    *   **Active State Menu**: Item menu yang aktif menggunakan kelas `.sidebar-active-item` dengan aksen garis kiri merah tebal dan latar merah transparan:
        ```css
        border-left: 3px solid var(--color-primary);
        background-color: rgba(200, 16, 46, 0.12);
        ```
2.  **Topbar (Sticky Top)**:
    *   Latar belakang putih (`bg-white`), dengan bayangan tipis, menampilkan tombol menu mobile, notifikasi, dan profil pengguna.
3.  **Area Konten Utama (`#main-content`)**:
    *   Memiliki padding responsif: `px-4 py-6 md:px-6 md:py-8` dengan scroll independen (`overflow-y-auto`).

---

## 4. Standar Komponen UI & Kode Acuan

Gunakan komponen bawaan di dalam folder `resources/js/shared/components/ui/` daripada menulis markup Tailwind mentah.

### A. Page Header (`PageHeader.tsx`)
Digunakan di setiap halaman sebagai penunjuk konteks navigasi. Urutan visual: Judul Utama → Deskripsi Singkat → Navigasi Breadcrumbs → Tombol Aksi (Kanan).

*   **Acuan Kode**: [PageHeader.tsx](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/js/shared/components/ui/PageHeader.tsx)
*   **Contoh Markup**:
    ```tsx
    <PageHeader
        title="Daftar Soal Ujian"
        description="Kelola dan pantau proses verifikasi soal ujian Anda di sini."
        breadcrumb={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Soal Ujian' }
        ]}
        action={
            <button className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition">
                Upload Soal
            </button>
        }
    />
    ```

### B. Status Badge (`StatusBadge.tsx`)
Pill status yang seragam untuk merepresentasikan status berkas soal ujian. Wajib menggunakan pemetaan kelas warna berikut:

*   **Acuan Kode**: [StatusBadge.tsx](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/js/shared/components/ui/StatusBadge.tsx)
*   **Panduan Warna Status**:
    *   `draft`: Abu-abu (`bg-gray-100 text-gray-600 border-gray-300`)
    *   `submitted` / `in_review`: Biru (`bg-info-light text-info border-info`)
    *   `approved`: Hijau (`bg-success-light text-success border-success`)
    *   `revisi`: Jingga (`bg-warning-light text-warning border-warning`)
    *   `rejected`: Merah (`bg-danger-light text-danger border-danger`)

### C. Search & Filter Bar (`FilterBar.tsx` & `SearchBar.tsx`)
Form filter diletakkan di bagian atas tabel dengan susunan flex wrap horizontal.

*   **Acuan Kode**: [FilterBar.tsx](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/js/shared/components/ui/FilterBar.tsx) & [SearchBar.tsx](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/js/shared/components/ui/SearchBar.tsx)
*   **Ketentuan UX**:
    *   **Debounce**: Input pencarian wajib menggunakan debounce minimal `400ms` agar tidak membebani server database secara berlebihan saat mengetik.
    *   **Clear Button (X)**: Wajib menampilkan tombol clear di sisi kanan input pencarian apabila nilai input tidak kosong.
*   **Contoh Gabungan**:
    ```tsx
    <FilterBar onReset={handleResetFilters}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Cari soal..." className="w-64" />
        <FilterSelect value={selectedStatus} onChange={setSelectedStatus} options={statusOptions} placeholder="Semua Status" />
    </FilterBar>
    ```

### D. Tabel Data & Pagination
*   **Tabel**:
    *   Gunakan latar belakang putih (`bg-white`), border tipis (`border-gray-200`), dan pembulatan ujung wrapper (`rounded-xl`).
    *   Baris header menggunakan teks abu-abu berukuran kecil (`text-xs font-semibold tracking-wider text-gray-500 uppercase`).
    *   Berikan efek transisi latar saat baris ditunjuk hover (`hover:bg-gray-50/70 transition`).
*   **Pagination (`Pagination.tsx`)**:
    *   Wajib menampilkan informasi range data saat ini ("Menampilkan 1–10 dari 45 data").
    *   Terdapat opsi seleksi baris per halaman (dropdown *per page*).
    *   Tombol navigasi halaman menggunakan `ChevronLeft` dan `ChevronRight` dengan penanda status aktif menggunakan warna primer.
    *   *Acuan*: [Pagination.tsx](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/js/shared/components/ui/Pagination.tsx).

### E. Dialog Modal & Konfirmasi
*   **Modal Umum (`Modal.tsx`)**:
    *   Wajib memiliki pelindung layar transparan gelap dengan efek buram (`bg-black/50 backdrop-blur-sm`).
    *   Mengunci scroll halaman utama (`overflow: hidden` pada `body`) ketika modal dalam kondisi terbuka.
    *   Mendukung penutupan dengan menekan tombol `Escape` pada keyboard.
*   **Konfirmasi Hapus (`ConfirmDialog.tsx`)**:
    *   Gunakan ikon peringatan berwarna merah (`AlertTriangle`) di dalam lingkaran merah muda.
    *   Tombol konfirmasi menggunakan warna bahaya merah (`bg-danger`) dengan ikon sampah (`Trash2`).
    *   *Acuan*: [ConfirmDialog.tsx](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/js/shared/components/ui/ConfirmDialog.tsx).

---

## 5. Pedoman Form & Input Kontrol

Untuk menjaga konsistensi visual input form, ikuti aturan kelas Tailwind berikut:

*   **Text Input / Select Dropdown**:
    *   Tinggi standar: `h-10` (atau `h-9` jika digunakan di area filter yang padat).
    *   Gaya visual: `rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]`.
*   **Radio / Checkbox**:
    *   Gunakan aksen warna utama: `text-[var(--color-primary)] focus:ring-[var(--color-primary)]`.
*   **File Dropzone (Upload Area)**:
    *   Gunakan batas putus-putus (`border-dashed border-2 border-gray-300 hover:border-[var(--color-primary)]`) dengan latar belakang yang berganti transparan kemerahan saat berkas ditarik di atasnya.

---

## 6. Penanganan Feedback & State

### A. Loading Skeleton (`Skeleton.tsx`)
Jangan gunakan spinner putar besar di tengah layar untuk memuat konten halaman. Gunakan animasi denyut abu-abu (*Skeleton Pulse*) yang menyerupai bentuk konten asli.
*   Gunakan `SkeletonTable` saat memuat tabel data.
*   Gunakan `SkeletonStatCards` saat memuat widget rangkuman angka di dashboard.
*   *Acuan*: [Skeleton.tsx](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/js/shared/components/ui/Skeleton.tsx).

### B. Empty State (`EmptyState.tsx`)
Tampilkan ilustrasi grafis ikon pasif berwarna abu-abu ketika data kosong. Bedakan pesan jika data kosong karena "belum ada data sama sekali" dengan "hasil pencarian tidak ditemukan".
*   *Acuan*: [EmptyState.tsx](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/js/shared/components/ui/EmptyState.tsx).

### C. Toast Notification (`Toast.tsx`)
Notifikasi melayang di pojok kanan bawah (`bottom-6 right-6`) untuk merespons hasil aksi pengguna (sukses/gagal/informasi). Menggunakan transisi geser dari samping kanan (`animate-in slide-in-from-right-4`).
*   *Acuan*: [Toast.tsx](file:///c:/Users/Acer/Downloads/soal_verif/dashboard_verif/resources/js/shared/components/ui/Toast.tsx).
