# Aturan & Standar Pengkodean (rules.md)

# Dashboard Verifikasi Soal Ujian — Telkom University Jakarta

Dokumen ini berisi panduan, konvensi, dan aturan wajib (*coding standards & engineering guidelines*) yang harus dipatuhi oleh seluruh pengembang maupun AI assistant saat mengedit atau menambahkan fitur dalam proyek ini.

---

## 1. Prinsip Utama Perangkat Lunak (General Engineering Principles)

1. **DRY (Don't Repeat Yourself):** Jangan menuliskan ulang logika bisnis, validasi, atau markup UI yang sama. Ekstrak ke dalam Service, Helper, atau Komponen Shared.
2. **SOLID & Single Responsibility:** Setiap kelas PHP dan komponen React harus memiliki satu tanggung jawab yang jelas.
3. **Strict Type Safety:** Gunakan *Strict Typing* di PHP (`declare(strict_types=1);`) dan hindari penggunaan tipe `any` pada TypeScript.
4. **No Superficial Symptom Patches:** Dilarang menyembunyikan error dengan `try-catch` kosong atau mengembalikan data dummy saat terjadi kegagalan sistem. Error harus ditangani dan dicatat log-nya dengan jelas.

---

## 2. Aturan Backend (Laravel / PHP Standards)

### A. Pola Slim Controller
Controller **TIDAK BOLEH** berisi query database langsung (`DB::table()` atau `Soal::where()`), validasi manual `$request->validate()`, atau kalkulasi bisnis.

- **Fungsi Controller:**
  1. Menerima data dari Form Request.
  2. Memanggil metode pada Service Layer.
  3. Mengembalikan `JsonResponse` dengan format standar.

```php
// CONTOH CONTROLLER YANG BENAR
namespace App\Http\Controllers\Api;

use App\Http\Requests\Soal\StoreSoalRequest;
use App\Services\SoalService;
use Illuminate\Http\JsonResponse;

class SoalController extends Controller
{
    public function __construct(
        protected SoalService $soalService
    ) {}

    public function store(StoreSoalRequest $request): JsonResponse
    {
        $soal = $this->soalService->createSoal($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Soal berhasil diunggah.',
            'data'    => $soal,
        ], 201);
    }
}
```

### B. Validasi Input via Form Request
Seluruh masukan API wajib menggunakan kelas **Form Request** (`app/Http/Requests/`).

- *Aturan:* Sertakan metode `authorize()` untuk memeriksa hak akses tingkat dasar dan `rules()` untuk aturan validasi.

```php
namespace App\Http\Requests\Soal;

use Illuminate\Foundation\Http\FormRequest;

class StoreSoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('upload-soal');
    }

    public function rules(): array
    {
        return [
            'mata_kuliah_id' => ['required', 'exists:courses,id'],
            'clo_id'         => ['required', 'exists:clo,id'],
            'periode_id'     => ['required', 'exists:periode,id'],
            'judul_soal'     => ['required', 'string', 'max:255'],
            'file_soal'      => ['required', 'file', 'mimes:pdf,docx', 'max:10240'], // Max 10MB
        ];
    }
}
```

### C. Abstraksi Data via Repository Layer & Eager Loading
Query database wajib berada di dalam kelas Repository (`app/Repositories/`).

- **Cegah N+1 Query:** Setiap query yang mengambil data relasi wajib mencantumkan `with()` secara eksplisit.
- **Gunakan Enum:** Gunakan Enum PHP (`SoalStatusEnum::APPROVED->value`) daripada *string literal* acak.

```php
// CONTOH REPOSITORY
namespace App\Repositories;

use App\Models\Soal;
use App\Enums\SoalStatusEnum;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SoalRepository
{
    public function getSoalByPeriode(int $periodeId, int $perPage = 10): LengthAwarePaginator
    {
        return Soal::with(['dosen', 'mataKuliah', 'clo'])
            ->where('periode_id', $periodeId)
            ->where('status', '!=', SoalStatusEnum::DRAFT->value)
            ->latest()
            ->paginate($perPage);
    }
}
```

### D. Format Standar API Response
Seluruh response JSON dari API wajib mengikuti struktur konsisten berikut:

```json
{
  "success": true,
  "message": "Pesan deskriptif aksi",
  "data": { ... },
  "errors": null
}
```

---

## 3. Aturan Frontend (React / TypeScript / Tailwind Standards)

### A. Struktur Berbasis Fitur (Feature-Driven Architecture)
Organisasikan kode frontend berdasarkan modul bisnis di `resources/js/features/`:

- `features/[feature_name]/components/`: Komponen spesifik fitur.
- `features/[feature_name]/api/`: Perintah Axios / TanStack React Query hooks.
- `features/[feature_name]/types/`: Definisi tipe TypeScript lokal.

### B. Penggunaan Strict TypeScript
- **Dilarang keras** menggunakan `any`. Seluruh Props komponen, parameter fungsi, dan state wajib memiliki tipe eksplisit.
- Definisikan tipe antarmuka Props dengan nama `[ComponentName]Props`.

```tsx
// CONTOH KOMPONEN REACT YANG BENAR
import React from 'react';
import { SoalStatus } from '@/shared/types/models';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';

interface SoalCardProps {
  judul: string;
  status: SoalStatus;
  onEdit?: () => void;
}

export const SoalCard: React.FC<SoalCardProps> = ({ judul, status, onEdit }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="font-heading font-semibold text-gray-900">{judul}</h3>
      <div className="mt-2 flex items-center justify-between">
        <StatusBadge status={status} />
        {onEdit && (
          <button 
            onClick={onEdit}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-dark)]"
          >
            Edit Soal
          </button>
        )}
      </div>
    </div>
  );
};
```

### C. Konsistensi Desain Visual (Sesuai `DESIGN.md`)
1. **Warna Utama (Primary):** Merah Telkom University (`#C8102E` / `var(--color-primary)`).
2. **Tipografi:** Heading menggunakan **Poppins** (`font-heading`), Body menggunakan **Inter** (`font-sans`).
3. **Pembulatan Sudut:**
   - Container / Card Utama: `rounded-2xl`
   - Modal / Form / Table Wrapper: `rounded-xl`
   - Button / Input / Select: `rounded-lg`
   - Badge / Avatar: `rounded-full`
4. **Status Badge Palette:**
   - `draft`: Abu-abu (`bg-gray-100 text-gray-600 border-gray-300`)
   - `submitted` / `in_review`: Biru (`bg-info-light text-info border-info`)
   - `approved`: Hijau (`bg-success-light text-success border-success`)
   - `revisi`: Jingga (`bg-warning-light text-warning border-warning`)
   - `rejected`: Merah (`bg-danger-light text-danger border-danger`)

### D. Penanganan Feedback & UI States
1. **Loading State:** Dilarang menggunakan spinner putar besar di tengah layar. Gunakan **Skeleton Loader** (`SkeletonTable`, `SkeletonStatCards`) yang menyerupai bentuk konten asli.
2. **Debounce Search:** Input pencarian wajib menggunakan debounce minimal **400ms** untuk mencegah spam request API.
3. **Toast Notifications:** Gunakan library **Sonner** (`toast.success()`, `toast.error()`) untuk notifikasi hasil transaksi.

---

## 4. Penegakan Aturan Bisnis (Core Business Rules Enforcement)

Seluruh pengembang wajib menegakkan 7 aturan bisnis utama berikut pada lapisan backend Service maupun kontrol validasi frontend:

- **BR-001 (Active Period Constraint):** Pengunggahan dan pembaruan soal **hanya dapat dilakukan** pada Periode Akademik yang berstatus **Aktif** (`status = true`) dan sebelum tanggal *deadline* berlalu.
- **BR-002 (Ownership Constraint):** Dosen **hanya dapat** melihat draf, mengubah, atau mengunggah revisi pada soal miliknya sendiri (`dosen_id == current_user_id`).
- **BR-003 (Self-Verification Restriction):** PIC Verifikator **DILARANG HARAM** memverifikasi soal buatannya sendiri (`verifier_id != target_dosen_id`).
- **BR-004 (Approval Prerequisite for Minutes):** Berita Acara **hanya dapat digenerasi** untuk daftar soal yang **SELURUHNYA** berstatus `approved`. Apabila terdapat 1 soal yang masih `draft`, `submitted`, `in_review`, atau `revisi`, proses generate BA wajib ditolak.
- **BR-005 (Active BA Template Required):** Penggenerasian Berita Acara mewajibkan adanya minimal 1 Template Berita Acara yang berstatus aktif (`is_active = true`).
- **BR-006 (Period-Scoped Assignment):** Penugasan PIC Verifikator bersifat spesifik per Periode Akademik.
- **BR-007 (Strict Status Flow):** Perubahan status soal wajib mengikuti alur baku: `draft` -> `submitted` -> `in_review` -> (`approved` | `revisi` | `rejected`).

---

## 5. Standar Penamaan & Kebersihan Kode (Naming Conventions)

### A. Basis Data (PostgreSQL)
- Nama Tabel: `snake_case` jamak (contoh: `users`, `program_studi`, `berita_acara_templates`).
- Primary Key: `id` (BIGINT auto increment).
- Foreign Key: `[singular_table_name]_id` (contoh: `prodi_id`, `periode_id`, `verifier_id`).

### B. Backend (Laravel / PHP)
- Nama Kelas / Enum / Interface: `PascalCase` (contoh: `SoalService`, `UserRoleEnum`).
- Nama Metode / Variabel: `camelCase` (contoh: `getSoalByPeriode()`, `$activePeriode`).
- File Route & Konfigurasi: `kebab-case` / `snake_case`.

### C. Frontend (React / TypeScript)
- Nama Komponen & File TSX: `PascalCase` (contoh: `TemplateBaPage.tsx`, `StatusBadge.tsx`).
- Custom Hooks: `camelCase` diawali `use` (contoh: `useDebounce.ts`, `useSoalQuery.ts`).
- Utility Files: `camelCase` (contoh: `formatters.ts`, `constants.ts`).

---

## 6. Prosedur Verifikasi Sebelum Committing Code

Sebelum menandai tugas selesai atau mengirimkan pull request, lakukan pengujian berikut:

1. **Backend Validation:** Jalankan pengujian otomatis PHPUnit / Pest jika tersedia.
   ```bash
   php artisan test
   ```
2. **Frontend Type Check & Build Check:** Pastikan tidak ada kesalahan kompilasi TypeScript atau CSS.
   ```bash
   npm run build
   ```
3. **Empirical Verification:** Pastikan seluruh fitur yang dibuat dapat berjalan di lingkungan lokal tanpa error di konsol browser maupun log Laravel (`storage/logs/laravel.log`).

