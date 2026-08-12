# DESIGN.md — Sistem Verifikasi Soal Ujian

Kerangka HTML seluruh halaman. **Struktur dan styling saja** — data di dalamnya placeholder,
isi fitur menyesuaikan saat development.

- Palette: maroon Telkom University `#B6252A` sebagai primary, `#ED1E28` hanya untuk alert.
- Layout: sidebar 260px putih, header 64px, konten `#F9FAFB`.
- Login: split 60/40, panel maroon kiri, card putih kanan (Opsi A).
- Tanpa gradient, tanpa gambar, tanpa logo, tanpa icon library. Icon = inline SVG atau dihilangkan.

**Daftar halaman**

| # | Halaman | Role |
|---|---|---|
| 1 | Login | semua |
| 2 | Dashboard | SuperAdmin |
| 3 | Import Kurikulum | SuperAdmin |
| 4 | Master Data — Mata Kuliah | SuperAdmin |
| 5 | Master Data — PLO & CLO | SuperAdmin |
| 6 | Master Data — Dosen | SuperAdmin |
| 7 | Penugasan Koordinator MK | SuperAdmin |
| 8 | Penentuan Dosen Verifikator | SuperAdmin |
| 9 | Tahun Ajaran & Periode | SuperAdmin |
| 10 | Kategori Soal | SuperAdmin |
| 11 | Template Soal | Koordinator |
| 12 | Unggah Soal | Koordinator |
| 13 | Status Verifikasi | Koordinator |
| 14 | Antrian Verifikasi | Verifikator |
| 15 | Detail Verifikasi Soal | Verifikator |
| 16 | Berita Acara | Verifikator |
| 17 | Shared states | semua |

---

## 0. Design System — CSS

Pasang sekali di root. Semua halaman di bawah memakai class dari sini.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">

<style>
:root{
  --maroon:#B6252A; --maroon-deep:#930316; --maroon-tint:rgba(182,37,42,.06);
  --maroon-tint-10:rgba(182,37,42,.1);
  --alert:#ED1E28; --alert-tint:rgba(237,30,40,.1);
  --white:#FFFFFF; --canvas:#F9FAFB;
  --ink:#1A1B20; --body:#55565B; --muted:#959597; --line:#E2E2E8;
  --ok:#0F7B4F; --ok-tint:rgba(15,123,79,.1);
  --warn:#B7791F; --warn-tint:rgba(183,121,31,.1);
  --slate:#55565B; --slate-tint:rgba(85,86,91,.1);
  --sidebar-w:260px; --header-h:64px;
  --r-sm:4px; --r-lg:8px;
  --shadow:0 4px 12px rgba(85,86,91,.08);
}

*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;font-size:14px;color:var(--body);background:var(--canvas);-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:'Plus Jakarta Sans',sans-serif;color:var(--ink)}
a{color:var(--maroon);text-decoration:none}

/* ---------- LAYOUT ---------- */
.app{display:flex;min-height:100vh}
.sidebar{width:var(--sidebar-w);flex:0 0 var(--sidebar-w);background:var(--white);border-right:1px solid var(--line);display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.content{flex:1;padding:32px;max-width:1440px;width:100%}

.brand{height:var(--header-h);padding:0 16px;display:flex;flex-direction:column;justify-content:center;border-bottom:1px solid var(--line)}
.brand-mark{font-size:16px;font-weight:700;color:var(--maroon);letter-spacing:.02em}
.brand-sub{font-size:12px;color:var(--muted)}

.nav{flex:1;overflow-y:auto;padding:16px 0}
.nav-group{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);padding:16px 16px 8px}
.nav-item{display:flex;align-items:center;gap:10px;height:44px;padding-left:16px;font-size:14px;font-weight:500;color:var(--body);border-left:4px solid transparent;border-radius:0;cursor:pointer}
.nav-item:hover{background:var(--canvas)}
.nav-item.active{border-left:4px solid var(--maroon);background:var(--maroon-tint);color:var(--maroon);padding-left:12px}

.sidebar-foot{border-top:1px solid var(--line);padding:12px 16px;display:flex;align-items:center;gap:10px}
.avatar{width:36px;height:36px;flex:0 0 36px;border-radius:9999px;background:var(--line);color:var(--body);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600}
.avatar-sm{width:28px;height:28px;flex:0 0 28px;font-size:11px}
.user-name{font-size:14px;font-weight:500;color:var(--ink)}
.user-role{font-size:12px;color:var(--muted)}

.topbar{height:var(--header-h);background:var(--white);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 32px;position:sticky;top:0;z-index:5}
.crumbs{font-size:14px;color:var(--muted)}
.crumbs .now{color:var(--ink)}
.period-chip{border:1px solid var(--line);border-radius:var(--r-sm);padding:6px 12px;font-size:13px;color:var(--body);background:var(--white)}

/* ---------- PAGE HEAD ---------- */
.page-head{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:24px}
.page-title{font-size:30px;font-weight:700;letter-spacing:-.02em;line-height:1.2}
.page-desc{font-size:14px;color:var(--muted);margin-top:4px}

/* ---------- GRID ---------- */
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:24px}
.col-3{grid-column:span 3}.col-4{grid-column:span 4}.col-5{grid-column:span 5}
.col-6{grid-column:span 6}.col-7{grid-column:span 7}.col-8{grid-column:span 8}.col-12{grid-column:span 12}
.stack{display:flex;flex-direction:column;gap:24px}
.row{display:flex;align-items:center;gap:12px}
.spread{display:flex;align-items:center;justify-content:space-between;gap:16px}

/* ---------- CARD ---------- */
.card{background:var(--white);border:1px solid var(--line);border-radius:var(--r-lg);padding:24px}
.card-flush{padding:0;overflow:hidden}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid var(--line)}
.card-title{font-size:20px;font-weight:600}
.card-body{padding:24px}

/* ---------- BUTTON ---------- */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 20px;border-radius:var(--r-sm);font-family:inherit;font-size:14px;font-weight:500;cursor:pointer;border:1px solid transparent;white-space:nowrap}
.btn-primary{background:var(--maroon);color:var(--white)}
.btn-primary:hover{background:var(--maroon-deep)}
.btn-primary:disabled,.btn-primary.is-disabled{background:var(--line);color:var(--muted);cursor:not-allowed}
.btn-secondary{background:var(--white);border-color:var(--line);color:var(--body)}
.btn-secondary:hover{background:var(--canvas)}
.btn-outline{background:var(--white);border-color:var(--maroon);color:var(--maroon);height:36px;padding:0 14px}
.btn-ghost{background:none;border:none;color:var(--maroon);padding:0 8px;height:32px}
.btn-ghost-muted{background:none;border:none;color:var(--body);padding:0 8px;height:32px}
.btn-danger{background:var(--white);border-color:var(--alert);color:var(--alert)}
.btn-danger-ghost{background:none;border:none;color:var(--alert);padding:0 8px;height:32px}
.btn-lg{height:48px;padding:0 24px}
.btn-block{width:100%}

/* ---------- FORM ---------- */
.field{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
.label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--body)}
.input,.select,.textarea{width:100%;height:40px;padding:0 12px;background:var(--white);border:1px solid var(--line);border-radius:var(--r-sm);font-family:inherit;font-size:14px;color:var(--ink)}
.textarea{height:auto;padding:10px 12px;resize:vertical;min-height:110px}
.input:focus,.select:focus,.textarea:focus{outline:none;border-color:var(--maroon);box-shadow:0 0 0 2px var(--maroon-tint-10)}
.input::placeholder{color:var(--muted)}
.input-locked{background:var(--canvas);color:var(--body)}
.help{font-size:12px;color:var(--muted)}
.help-err{font-size:12px;color:var(--alert)}
.check{display:inline-flex;align-items:center;gap:8px;font-size:14px;cursor:pointer}

/* ---------- TABLE ---------- */
.table{width:100%;border-collapse:collapse;background:var(--white)}
.table thead th{background:var(--canvas);text-align:left;padding:12px 16px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--body);border-bottom:1px solid var(--line);white-space:nowrap}
.table tbody td{padding:12px 16px;height:48px;border-bottom:1px solid var(--line);font-size:14px;color:var(--ink);vertical-align:middle}
.table tbody tr:hover{background:var(--canvas)}
.td-muted{color:var(--muted)}
.row-flag-warn td:first-child{box-shadow:inset 4px 0 0 var(--warn)}
.row-flag-active td:first-child{box-shadow:inset 4px 0 0 var(--maroon)}
.toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 24px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.toolbar-l,.toolbar-r{display:flex;align-items:center;gap:12px}
.search{width:280px}
.pager{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}

/* ---------- CHIP ---------- */
.chip{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:9999px;font-size:12px;font-weight:600;white-space:nowrap}
.chip-ok{background:var(--ok-tint);color:var(--ok)}
.chip-warn{background:var(--warn-tint);color:var(--warn)}
.chip-slate{background:var(--slate-tint);color:var(--slate)}
.chip-alert{background:var(--alert-tint);color:var(--alert)}
.chip-draft{background:rgba(149,149,151,.1);color:var(--muted)}
.chip-maroon{background:var(--maroon-tint-10);color:var(--maroon)}
.tag{display:inline-flex;align-items:center;height:26px;padding:0 8px;border:1px solid var(--line);border-radius:var(--r-sm);font-size:12px;color:var(--body);background:var(--white)}
.tag-sel{border-color:var(--maroon);color:var(--maroon)}
.tag-x{margin-left:6px;color:var(--muted);cursor:pointer}

/* ---------- ALERT / NOTE ---------- */
.note{border-radius:var(--r-sm);padding:12px 16px;font-size:14px;line-height:1.5}
.note-err{background:var(--alert-tint);border:1px solid var(--alert);color:var(--alert)}
.note-warn{background:var(--warn-tint);border:1px solid var(--warn);color:var(--warn)}
.note-flat{background:var(--canvas);border:1px solid var(--line);color:var(--body)}

/* ---------- CONTEXT STRIP ---------- */
.strip{background:var(--white);border:1px solid var(--line);border-radius:var(--r-lg);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}
.dot{width:8px;height:8px;border-radius:9999px;background:var(--maroon);flex:0 0 8px}
.strip-main{font-size:16px;font-weight:600;color:var(--ink)}

/* ---------- METRIC ---------- */
.metric-label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
.metric-value{font-family:'Plus Jakarta Sans',sans-serif;font-size:30px;font-weight:700;color:var(--ink);line-height:1.2;margin:8px 0 4px}
.metric-sub{font-size:12px;color:var(--muted)}

/* ---------- BAR CHART ---------- */
.bar-row{display:flex;align-items:center;gap:16px;margin-bottom:16px}
.bar-name{width:150px;flex:0 0 150px;font-size:14px;color:var(--ink)}
.bar-track{flex:1;height:12px;background:var(--canvas);border-radius:2px;overflow:hidden}
.bar-fill{height:100%;background:var(--maroon);border-radius:2px}
.bar-val{width:130px;flex:0 0 130px;text-align:right;font-size:13px;color:var(--muted)}
.legend{display:flex;flex-direction:column;gap:10px;margin-top:20px}
.legend-item{display:flex;align-items:center;gap:10px;font-size:13px}
.legend-sq{width:10px;height:10px;border-radius:2px;flex:0 0 10px}
.legend-count{margin-left:auto;color:var(--muted)}

/* ---------- STEPPER ---------- */
.stepper{display:flex;align-items:flex-start;padding:24px;border-bottom:1px solid var(--line)}
.step{display:flex;flex-direction:column;align-items:center;gap:8px;flex:0 0 auto;width:130px}
.step-dot{width:32px;height:32px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600}
.step-done{background:var(--maroon);color:var(--white)}
.step-now{background:var(--white);border:2px solid var(--maroon);color:var(--maroon)}
.step-next{background:var(--white);border:1px solid var(--muted);color:var(--muted)}
.step-label{font-size:12px;text-align:center;color:var(--muted)}
.step-label.on{color:var(--ink);font-weight:600}
.step-line{flex:1;height:1px;background:var(--line);margin-top:16px}

/* ---------- DROPZONE ---------- */
.dropzone{border:1px dashed var(--muted);border-radius:var(--r-lg);height:200px;background:var(--white);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:16px}
.dropzone-title{font-size:16px;color:var(--ink)}
.file-row{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:var(--r-sm);padding:12px 16px;background:var(--white)}
.progress{height:4px;background:var(--line);border-radius:2px;overflow:hidden;flex:1}
.progress-fill{height:100%;background:var(--maroon)}

/* ---------- PICKER LIST ---------- */
.picklist{border:1px solid var(--line);border-radius:var(--r-sm);max-height:320px;overflow-y:auto}
.pick-group{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);padding:10px 16px;background:var(--canvas);position:sticky;top:0}
.pick-item{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--line);font-size:14px;cursor:pointer}
.pick-item:hover{background:var(--canvas)}

/* ---------- SELECT LIST (PLO) ---------- */
.sel-item{padding:14px 16px;border-bottom:1px solid var(--line);border-left:4px solid transparent;cursor:pointer}
.sel-item:hover{background:var(--canvas)}
.sel-item.active{border-left-color:var(--maroon);background:var(--maroon-tint)}
.sel-code{font-size:14px;font-weight:600;color:var(--ink)}
.sel-desc{font-size:14px;color:var(--body);margin:4px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sel-meta{font-size:12px;color:var(--muted)}

/* ---------- DECISION OPTIONS ---------- */
.opt{display:flex;gap:12px;padding:16px;border:1px solid var(--line);border-radius:var(--r-sm);margin-bottom:12px;cursor:pointer}
.opt-title{font-size:14px;font-weight:600;color:var(--ink)}
.opt-help{font-size:12px;color:var(--muted);margin-top:2px}
.opt.on-ok{background:var(--ok-tint);border-color:var(--ok)}
.opt.on-warn{background:var(--warn-tint);border-color:var(--warn)}
.opt.on-alert{background:var(--alert-tint);border-color:var(--alert)}

/* ---------- TABS ---------- */
.tabs{display:flex;gap:24px;border-bottom:1px solid var(--line);padding:0 24px}
.tab{padding:14px 0;font-size:14px;color:var(--body);border-bottom:2px solid transparent;cursor:pointer;display:flex;align-items:center;gap:8px}
.tab.active{color:var(--maroon);border-bottom-color:var(--maroon);font-weight:500}
.tab-count{background:var(--canvas);border-radius:9999px;padding:1px 8px;font-size:12px;color:var(--muted)}

/* ---------- MODAL ---------- */
.overlay{position:fixed;inset:0;background:rgba(26,27,32,.4);display:flex;align-items:center;justify-content:center;padding:24px;z-index:50}
.modal{background:var(--white);border-radius:var(--r-lg);box-shadow:var(--shadow);width:560px;max-width:100%;max-height:90vh;display:flex;flex-direction:column}
.modal-wide{width:720px}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--line)}
.modal-title{font-size:20px;font-weight:600}
.modal-body{padding:24px;overflow-y:auto}
.modal-foot{display:flex;justify-content:flex-end;gap:12px;padding:16px 24px;border-top:1px solid var(--line)}
.x{background:none;border:none;font-size:20px;color:var(--muted);cursor:pointer;line-height:1}

/* ---------- DOC PREVIEW ---------- */
.doc{background:var(--canvas);border:1px solid var(--line);border-radius:var(--r-sm);padding:40px;min-height:520px}
.doc-sheet{background:var(--white);border:1px solid var(--line);padding:48px;max-width:720px;margin:0 auto;font-size:13px;color:var(--ink);line-height:1.7}
.doc-title{text-align:center;font-size:15px;font-weight:700;letter-spacing:.05em;font-family:'Plus Jakarta Sans',sans-serif}
.skel{background:var(--line);border-radius:2px;height:10px;margin-bottom:10px}
.sig{display:flex;gap:48px;margin-top:48px}
.sig-col{flex:1;text-align:center;font-size:13px}
.sig-line{border-bottom:1px solid var(--ink);height:64px;margin-bottom:8px}
.pagebar{display:flex;gap:6px;justify-content:center;padding:16px 0 0}
.pagesq{width:28px;height:28px;border:1px solid var(--line);border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted);background:var(--white)}
.pagesq.on{border-color:var(--maroon);color:var(--maroon)}

/* ---------- EMPTY / TOAST ---------- */
.empty{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:64px 24px}
.empty-title{font-size:20px;font-weight:600;color:var(--ink)}
.empty-help{font-size:14px;color:var(--muted);margin-bottom:8px}
.toast{display:flex;gap:12px;background:var(--white);border:1px solid var(--line);border-left:4px solid var(--slate);border-radius:var(--r-lg);box-shadow:var(--shadow);padding:14px 16px;width:360px}
.toast-ok{border-left-color:var(--ok)}
.toast-err{border-left-color:var(--alert)}
.toast-title{font-size:14px;font-weight:600;color:var(--ink)}
.toast-line{font-size:12px;color:var(--muted)}

.sticky{position:sticky;top:calc(var(--header-h) + 24px)}
.divider{height:1px;background:var(--line);margin:20px 0}
.mono-meta{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
</style>
```

---

## 1. App Shell

Bungkus semua halaman (kecuali Login) dengan kerangka ini. Ganti isi `.content` per halaman,
dan pangkas `.nav-group` sesuai role.

```html
<div class="app">
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">VERIFIKASI SOAL</div>
      <div class="brand-sub">Sistem Informasi</div>
    </div>

    <nav class="nav">
      <div class="nav-group">Utama</div>
      <div class="nav-item active">Dashboard</div>

      <div class="nav-group">Master Data</div>
      <div class="nav-item">Import Kurikulum</div>
      <div class="nav-item">Mata Kuliah</div>
      <div class="nav-item">PLO &amp; CLO</div>
      <div class="nav-item">Dosen</div>

      <div class="nav-group">Penugasan</div>
      <div class="nav-item">Koordinator MK</div>
      <div class="nav-item">Dosen Verifikator</div>

      <div class="nav-group">Pengaturan</div>
      <div class="nav-item">Tahun Ajaran &amp; Periode</div>
      <div class="nav-item">Kategori Soal</div>

      <div class="nav-group">Soal</div>
      <div class="nav-item">Template Soal</div>
      <div class="nav-item">Unggah Soal</div>
      <div class="nav-item">Status Verifikasi</div>

      <div class="nav-group">Verifikasi</div>
      <div class="nav-item">Antrian Verifikasi</div>
      <div class="nav-item">Berita Acara</div>
    </nav>

    <div class="sidebar-foot">
      <div class="avatar">AU</div>
      <div style="flex:1;min-width:0">
        <div class="user-name">Admin Utama</div>
        <div class="user-role">SuperAdmin</div>
      </div>
      <button class="btn-ghost-muted">Keluar</button>
    </div>
  </aside>

  <div class="main">
    <header class="topbar">
      <div class="crumbs">Beranda / <span class="now">Dashboard</span></div>
      <div class="period-chip">Ganjil 2025/2026 · UTS</div>
    </header>

    <main class="content">
      <!-- ISI HALAMAN -->
    </main>
  </div>
</div>
```

**Varian sidebar per role** — buang grup yang tidak dipakai, jangan ditampilkan abu-abu.

```html
<!-- Koordinator -->
<div class="nav-group">Soal</div>
<div class="nav-item active">Template Soal</div>
<div class="nav-item">Unggah Soal</div>
<div class="nav-item">Status Verifikasi</div>

<!-- Verifikator -->
<div class="nav-group">Verifikasi</div>
<div class="nav-item active">Antrian Verifikasi</div>
<div class="nav-item">Berita Acara</div>
```

---

## 2. Login

Tanpa shell. Split 60/40 — panel maroon kiri, card putih kanan.

```html
<div style="display:flex;height:100vh;width:100vw">

  <section style="flex:0 0 60%;background:var(--maroon);display:flex;flex-direction:column;justify-content:center;padding:80px">
    <div style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#fff">Verifikasi Soal</div>
    <h1 style="font-size:40px;font-weight:700;color:#fff;line-height:1.2;margin-top:24px">Sistem Verifikasi<br>Soal Ujian</h1>
    <p style="font-size:16px;color:rgba(255,255,255,.8);max-width:420px;margin-top:16px;line-height:1.6">
      Platform internal Program Studi Sistem Informasi untuk pengelolaan, penugasan, dan verifikasi soal ujian tiap periode.
    </p>
    <div style="margin-top:auto;font-size:12px;color:rgba(255,255,255,.6)">© 2026 Program Studi Sistem Informasi</div>
  </section>

  <section style="flex:0 0 40%;background:var(--white);display:flex;align-items:center;justify-content:center;padding:24px">
    <div style="width:400px;background:var(--white);border:1px solid var(--line);border-radius:var(--r-lg);padding:40px">
      <h2 style="font-size:24px;font-weight:600">Masuk</h2>
      <p class="help" style="margin:6px 0 24px">Gunakan akun akademik yang terdaftar.</p>

      <!-- varian error: sisipkan blok ini di atas field pertama
      <div class="note note-err" style="margin-bottom:16px">Email atau password salah.</div>
      -->

      <div class="field">
        <label class="label">Email</label>
        <input class="input" type="email" placeholder="nama@telkomuniversity.ac.id">
      </div>

      <div class="field">
        <label class="label">Password</label>
        <div style="position:relative">
          <input class="input" type="password" placeholder="••••••••" style="padding-right:44px">
          <button class="btn-ghost-muted" style="position:absolute;right:4px;top:4px">Lihat</button>
        </div>
      </div>

      <div class="spread" style="margin:4px 0 24px">
        <label class="check"><input type="checkbox"> Ingat saya</label>
        <a href="#">Lupa password?</a>
      </div>

      <button class="btn btn-primary btn-block">Masuk</button>
    </div>
  </section>

</div>
```

---

## 3. Dashboard — SuperAdmin

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Dashboard</h1>
    <p class="page-desc">Monitoring progres pengunggahan dan verifikasi soal pada semester berjalan.</p>
  </div>
</div>

<div class="strip">
  <div class="row">
    <span class="dot"></span>
    <div>
      <div class="strip-main">Semester Berjalan: Ganjil 2025/2026 · Periode UTS</div>
      <div class="help">Seluruh data pada halaman ini mengikuti semester berjalan.</div>
    </div>
  </div>
  <button class="btn btn-secondary">Ganti Periode</button>
</div>

<div class="grid" style="margin-bottom:24px">
  <div class="card col-3">
    <div class="metric-label">Total Mata Kuliah</div>
    <div class="metric-value">52</div>
    <div class="metric-sub">Aktif semester ini</div>
  </div>
  <div class="card col-3">
    <div class="metric-label">Soal Terunggah</div>
    <div class="metric-value">38</div>
    <div class="metric-sub">73% dari total mata kuliah</div>
  </div>
  <div class="card col-3">
    <div class="metric-label">Menunggu Verifikasi</div>
    <div class="metric-value">9</div>
    <div class="metric-sub">Antrean verifikator aktif</div>
  </div>
  <div class="card col-3">
    <div class="metric-label">Perlu Revisi</div>
    <div class="metric-value">4</div>
    <div class="metric-sub">Menunggu tindakan koordinator</div>
  </div>
</div>

<div class="grid" style="margin-bottom:24px">
  <div class="card col-8">
    <h3 class="card-title">Status Upload per Semester</h3>
    <p class="help" style="margin:4px 0 24px">Jumlah soal yang sudah diunggah dibanding total mata kuliah tiap semester.</p>

    <!-- ulang .bar-row untuk semester 1..8 -->
    <div class="bar-row">
      <div class="bar-name">Semester 1</div>
      <div class="bar-track"><div class="bar-fill" style="width:86%"></div></div>
      <div class="bar-val">6 / 7 Soal (86%)</div>
    </div>
    <div class="bar-row">
      <div class="bar-name">Semester 2</div>
      <div class="bar-track"><div class="bar-fill" style="width:71%"></div></div>
      <div class="bar-val">5 / 7 Soal (71%)</div>
    </div>
    <div class="bar-row">
      <div class="bar-name">Semester 3</div>
      <div class="bar-track"><div class="bar-fill" style="width:100%"></div></div>
      <div class="bar-val">7 / 7 Soal (100%)</div>
    </div>
  </div>

  <div class="card col-4">
    <h3 class="card-title">Breakdown Verifikasi</h3>
    <p class="help" style="margin-top:4px">Status verifikasi soal semester berjalan.</p>

    <!-- donut: SVG statis, tanpa tooltip -->
    <div style="display:flex;justify-content:center;padding:24px 0">
      <svg viewBox="0 0 42 42" width="180" height="180" role="img" aria-label="Breakdown status verifikasi">
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="#E2E2E8" stroke-width="6"></circle>
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="#0F7B4F" stroke-width="6"
                stroke-dasharray="66 34" stroke-dashoffset="25"></circle>
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="#B7791F" stroke-width="6"
                stroke-dasharray="11 89" stroke-dashoffset="-41"></circle>
        <circle cx="21" cy="21" r="15.9" fill="none" stroke="#ED1E28" stroke-width="6"
                stroke-dasharray="8 92" stroke-dashoffset="-52"></circle>
        <text x="21" y="23" text-anchor="middle" font-size="7" font-weight="700" fill="#1A1B20">38</text>
      </svg>
    </div>

    <div class="legend">
      <div class="legend-item"><span class="legend-sq" style="background:var(--ok)"></span> Disetujui <span class="legend-count">25</span></div>
      <div class="legend-item"><span class="legend-sq" style="background:var(--warn)"></span> Perlu Revisi <span class="legend-count">4</span></div>
      <div class="legend-item"><span class="legend-sq" style="background:var(--alert)"></span> Ditolak <span class="legend-count">0</span></div>
      <div class="legend-item"><span class="legend-sq" style="background:var(--muted)"></span> Menunggu <span class="legend-count">9</span></div>
    </div>
  </div>
</div>

<div class="card card-flush">
  <div class="card-head"><h3 class="card-title">Aktivitas Terbaru</h3></div>
  <table class="table">
    <thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Objek</th></tr></thead>
    <tbody>
      <tr>
        <td class="td-muted">Hari ini, 10:24</td>
        <td><div class="row"><span class="avatar avatar-sm">BS</span> Budi Santoso</div></td>
        <td>Mengunggah soal</td>
        <td class="td-muted">Basis Data · UTS</td>
      </tr>
      <tr>
        <td class="td-muted">Hari ini, 09:15</td>
        <td><div class="row"><span class="avatar avatar-sm">AW</span> Anita Wijaya</div></td>
        <td>Menyetujui soal</td>
        <td class="td-muted">Pemrograman Web · UTS</td>
      </tr>
    </tbody>
  </table>
  <div class="pager"><span>Menampilkan 1–10 dari 124</span><span>1 2 3 …</span></div>
</div>
```

---

## 4. Import Kurikulum — Wizard 5 Langkah

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Import Kurikulum</h1>
    <p class="page-desc">Data kurikulum berasal dari sistem OBE dan diunggah melalui berkas Excel.</p>
  </div>
</div>

<div class="card card-flush">

  <div class="stepper">
    <div class="step">
      <div class="step-dot step-done">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <div class="step-label">Kurikulum</div>
    </div>
    <div class="step-line"></div>
    <div class="step">
      <div class="step-dot step-now">2</div>
      <div class="step-label on">Mata Kuliah</div>
    </div>
    <div class="step-line"></div>
    <div class="step"><div class="step-dot step-next">3</div><div class="step-label">Kategori MK</div></div>
    <div class="step-line"></div>
    <div class="step"><div class="step-dot step-next">4</div><div class="step-label">PLO</div></div>
    <div class="step-line"></div>
    <div class="step"><div class="step-dot step-next">5</div><div class="step-label">CLO &amp; Pemetaan</div></div>
  </div>

  <div class="card-body">
    <div class="grid">

      <div class="col-5">
        <h3 class="card-title">Unggah Data Mata Kuliah</h3>
        <p class="help" style="margin:8px 0 20px">Gunakan template tanpa mengubah struktur kolom.</p>

        <table class="table" style="border:1px solid var(--line);border-radius:var(--r-sm)">
          <thead><tr><th>Kolom</th><th>Format</th></tr></thead>
          <tbody>
            <tr><td>Semester</td><td class="td-muted">Angka 1–14</td></tr>
            <tr><td>Kode MK</td><td class="td-muted">Teks, unik</td></tr>
            <tr><td>Nama MK (INA)</td><td class="td-muted">Teks, wajib</td></tr>
            <tr><td>Nama MK (ENG)</td><td class="td-muted">Teks, wajib</td></tr>
            <tr><td>SKS</td><td class="td-muted">Angka positif</td></tr>
          </tbody>
        </table>

        <button class="btn btn-secondary" style="margin-top:20px">Unduh Template .xlsx</button>
      </div>

      <div class="col-7">
        <!-- state kosong -->
        <div class="dropzone">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5"><path d="M12 16V4m0 0L7 9m5-5l5 5M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"/></svg>
          <div class="dropzone-title">Tarik file .xlsx ke sini</div>
          <a href="#">Pilih File</a>
        </div>

        <!-- state terisi: ganti dropzone di atas dengan blok ini
        <div class="file-row">
          <span style="flex:1">mata-kuliah-2026.xlsx <span class="td-muted">· 24 KB</span></span>
          <span class="chip chip-ok">Valid</span>
          <button class="btn-ghost">Ganti file</button>
        </div>
        <div class="row" style="margin:20px 0 12px"><span class="chip chip-ok">52 baris valid</span></div>
        <table class="table" style="border:1px solid var(--line)">
          <thead><tr><th>Semester</th><th>Kode</th><th>Nama MK</th><th>SKS</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>SI1101</td><td>Algoritma dan Pemrograman</td><td>4</td></tr>
            <tr><td>1</td><td>SI1102</td><td>Matematika Diskrit</td><td>3</td></tr>
          </tbody>
        </table>
        <div class="help" style="margin-top:12px">Menampilkan 10 dari 52 baris.</div>
        -->

        <!-- state error: ganti preview dengan blok ini
        <div class="note note-err" style="margin-top:20px">
          <strong>3 baris tidak valid</strong>
          <ul style="margin:8px 0 0 18px;line-height:1.8">
            <li>Baris 12: SKS harus berupa angka positif</li>
            <li>Baris 27: Nama Mata Kuliah (INA) tidak boleh kosong</li>
            <li>Baris 40: Semester harus berupa angka antara 1 sampai 14</li>
          </ul>
        </div>
        <button class="btn-ghost" style="margin-top:12px">Unduh laporan error</button>
        -->
      </div>

    </div>
  </div>

  <div class="modal-foot" style="justify-content:space-between">
    <button class="btn btn-secondary">Kembali</button>
    <div class="row">
      <span class="help">Langkah 2 dari 5</span>
      <button class="btn btn-primary">Lanjut ke Kategori MK</button>
    </div>
  </div>

</div>
```

---

## 5. Master Data — Mata Kuliah

Read-only. Data berasal dari import, tidak ada tambah/hapus.

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Mata Kuliah</h1>
    <p class="page-desc">52 mata kuliah semester 1–8, bersumber dari kurikulum yang telah ditetapkan.</p>
  </div>
</div>

<div class="card card-flush">
  <div class="toolbar">
    <div class="toolbar-l">
      <input class="input search" placeholder="Cari kode atau nama mata kuliah…">
    </div>
    <div class="toolbar-r">
      <select class="select"><option>Semua Semester</option><option>Semester 1</option></select>
      <select class="select"><option>Semua Kategori</option><option>MKWU</option><option>MKWP</option><option>MKPP</option></select>
      <button class="btn btn-primary">Import Kurikulum</button>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr><th>Semester</th><th>Kode MK</th><th>Nama Mata Kuliah</th><th>SKS</th><th>Kategori</th><th>Jumlah CLO</th><th>Koordinator</th><th></th></tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td><td>SI1101</td><td>Algoritma dan Pemrograman</td><td>4</td>
        <td><span class="chip chip-slate">MKWP</span></td><td>3</td>
        <td>Budi Santoso</td>
        <td><button class="btn-ghost">Detail</button></td>
      </tr>
      <tr>
        <td>1</td><td>SI1102</td><td>Matematika Diskrit</td><td>3</td>
        <td><span class="chip chip-slate">MKWP</span></td><td>2</td>
        <td class="td-muted">Belum ditentukan</td>
        <td><button class="btn-ghost">Detail</button></td>
      </tr>
    </tbody>
  </table>

  <div class="pager"><span>Menampilkan 1–10 dari 52</span><span>1 2 3 4 5 6</span></div>
</div>
```

**Modal detail**

```html
<div class="overlay">
  <div class="modal">
    <div class="modal-head">
      <div class="modal-title">SI1101 · Algoritma dan Pemrograman</div>
      <button class="x">&times;</button>
    </div>
    <div class="modal-body">
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
        <div><div class="mono-meta">Semester</div><div>1</div></div>
        <div><div class="mono-meta">SKS</div><div>4</div></div>
        <div><div class="mono-meta">Kategori</div><div>MKWP</div></div>
        <div><div class="mono-meta">Nama MK (ENG)</div><div>Algorithm and Programming</div></div>
        <div><div class="mono-meta">Koordinator</div><div>Budi Santoso</div></div>
        <div><div class="mono-meta">Periode</div><div>Ganjil 2025/2026</div></div>
      </div>
      <div class="divider"></div>
      <div class="mono-meta" style="margin-bottom:10px">CLO Terpetakan</div>
      <div class="row" style="flex-wrap:wrap;gap:8px">
        <span class="tag">PLO01-CLO01</span>
        <span class="tag">PLO01-CLO02</span>
        <span class="tag">PLO03-CLO01</span>
      </div>
    </div>
    <div class="modal-foot"><button class="btn btn-secondary">Tutup</button></div>
  </div>
</div>
```

---

## 6. Master Data — PLO &amp; CLO

Read-only, tanpa kolom nilai/capaian.

```html
<div class="page-head">
  <div>
    <h1 class="page-title">PLO &amp; CLO</h1>
    <p class="page-desc">Pemetaan capaian pembelajaran program studi ke mata kuliah.</p>
  </div>
</div>

<div class="grid">

  <div class="card card-flush col-4">
    <div style="padding:16px;border-bottom:1px solid var(--line)">
      <input class="input" placeholder="Cari PLO…">
    </div>
    <div style="max-height:640px;overflow-y:auto">
      <div class="sel-item active">
        <div class="sel-code">PLO01</div>
        <div class="sel-desc">Mampu menerapkan konsep dasar sistem informasi dalam penyelesaian masalah organisasi.</div>
        <div class="sel-meta">4 CLO</div>
      </div>
      <div class="sel-item">
        <div class="sel-code">PLO02</div>
        <div class="sel-desc">Mampu merancang basis data dan sistem terintegrasi sesuai kebutuhan pengguna.</div>
        <div class="sel-meta">3 CLO</div>
      </div>
      <!-- PLO03 … PLO10 -->
    </div>
  </div>

  <div class="card col-8">
    <h2 style="font-size:24px;font-weight:600">PLO01</h2>
    <p style="font-size:16px;line-height:1.6;margin-top:8px">
      Mampu menerapkan konsep dasar sistem informasi dalam penyelesaian masalah organisasi.
    </p>
    <div class="divider"></div>

    <table class="table">
      <thead><tr><th>Kode CLO</th><th>Deskripsi</th><th>Bloom</th><th>Jumlah MK</th></tr></thead>
      <tbody>
        <tr>
          <td>PLO01-CLO01</td>
          <td>Menjelaskan konsep dasar sistem informasi.</td>
          <td><span class="chip chip-slate">2 - Understand</span></td>
          <td>12</td>
        </tr>
        <!-- baris expanded -->
        <tr>
          <td colspan="4" style="background:var(--canvas)">
            <div class="mono-meta" style="margin-bottom:10px">Mata Kuliah Terpetakan</div>
            <div class="row" style="flex-wrap:wrap;gap:8px">
              <span class="tag">Algoritma dan Pemrograman</span>
              <span class="tag">Basis Data</span>
              <span class="tag">Analisis Proses Bisnis</span>
              <span class="tag">Pemrograman Web</span>
            </div>
          </td>
        </tr>
        <tr>
          <td>PLO01-CLO02</td>
          <td>Menerapkan konsep sistem informasi pada studi kasus.</td>
          <td><span class="chip chip-slate">3 - Apply</span></td>
          <td>8</td>
        </tr>
      </tbody>
    </table>
  </div>

</div>
```

---

## 7. Master Data — Dosen

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Dosen</h1>
    <p class="page-desc">Daftar dosen beserta peran yang diberikan pada sistem.</p>
  </div>
</div>

<div class="card card-flush">
  <div class="toolbar">
    <div class="toolbar-l"><input class="input search" placeholder="Cari nama atau kode dosen…"></div>
    <div class="toolbar-r">
      <select class="select"><option>Semua Role</option><option>Koordinator</option><option>Verifikator</option><option>SuperAdmin</option></select>
      <button class="btn btn-primary">Tambah Dosen</button>
    </div>
  </div>

  <table class="table">
    <thead><tr><th>Nama Lengkap</th><th>Kode Dosen</th><th>JFA</th><th>Kelompok Keahlian</th><th>Role</th><th></th></tr></thead>
    <tbody>
      <tr>
        <td><div class="row"><span class="avatar avatar-sm">BS</span> Budi Santoso</div></td>
        <td>BDS</td><td>Lektor</td><td>Data Engineering</td>
        <td><span class="chip chip-maroon">Koordinator</span></td>
        <td>
          <button class="btn-ghost">Edit</button>
          <button class="btn-danger-ghost">Hapus</button>
        </td>
      </tr>
      <tr>
        <td><div class="row"><span class="avatar avatar-sm">AW</span> Anita Wijaya</div></td>
        <td>ANW</td><td>Asisten Ahli</td><td>Enterprise Systems</td>
        <td>
          <span class="chip chip-maroon">Verifikator</span>
          <span class="chip chip-maroon">Koordinator</span>
        </td>
        <td>
          <button class="btn-ghost">Edit</button>
          <button class="btn-danger-ghost">Hapus</button>
        </td>
      </tr>
    </tbody>
  </table>

  <div class="pager"><span>Menampilkan 1–10 dari 22</span><span>1 2 3</span></div>
</div>
```

**Modal tambah / edit dosen**

```html
<div class="overlay">
  <div class="modal">
    <div class="modal-head"><div class="modal-title">Tambah Dosen</div><button class="x">&times;</button></div>
    <div class="modal-body">
      <div class="field"><label class="label">Nama Lengkap</label><input class="input"></div>
      <div class="grid" style="grid-template-columns:1fr 1fr;gap:16px">
        <div class="field"><label class="label">Kode Dosen</label><input class="input" placeholder="BDS"></div>
        <div class="field"><label class="label">JFA</label>
          <select class="select"><option>NJFA</option><option>Asisten Ahli</option><option>Lektor</option></select>
        </div>
      </div>
      <div class="field"><label class="label">Email</label><input class="input" type="email"></div>
      <div class="field">
        <label class="label">Role</label>
        <div class="row" style="flex-wrap:wrap">
          <span class="tag tag-sel">Koordinator</span>
          <span class="tag">Verifikator</span>
          <span class="tag">SuperAdmin</span>
        </div>
        <span class="help">Satu dosen dapat memiliki lebih dari satu peran.</span>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary">Batal</button>
      <button class="btn btn-primary">Simpan</button>
    </div>
  </div>
</div>
```

---

## 8. Penugasan Koordinator MK

Satu koordinator per mata kuliah per semester. Aksi utama: mengganti koordinator.

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Penugasan Koordinator MK</h1>
    <p class="page-desc">Satu koordinator per mata kuliah, berlaku untuk periode berjalan.</p>
  </div>
</div>

<div class="card card-flush">
  <div class="toolbar">
    <div class="toolbar-l">
      <input class="input search" placeholder="Cari mata kuliah…">
      <span class="help">38 dari 52 mata kuliah sudah memiliki koordinator pada periode berjalan.</span>
    </div>
    <div class="toolbar-r">
      <select class="select"><option>Semua Semester</option></select>
      <button class="btn btn-primary">Tugaskan Massal</button>
    </div>
  </div>

  <table class="table">
    <thead>
      <tr><th style="width:40px"><input type="checkbox"></th><th>Kode MK</th><th>Nama Mata Kuliah</th><th>Semester</th><th>Koordinator Saat Ini</th><th>Periode</th><th></th></tr>
    </thead>
    <tbody>
      <tr>
        <td><input type="checkbox"></td>
        <td>SI1101</td><td>Algoritma dan Pemrograman</td><td>1</td>
        <td>Budi Santoso</td><td class="td-muted">Ganjil 2025/2026</td>
        <td><button class="btn-ghost">Ganti Koordinator</button></td>
      </tr>
      <tr class="row-flag-warn">
        <td><input type="checkbox"></td>
        <td>SI1102</td><td>Matematika Diskrit</td><td>1</td>
        <td class="td-muted">Belum ditentukan</td><td class="td-muted">Ganjil 2025/2026</td>
        <td><button class="btn-ghost">Tentukan</button></td>
      </tr>
    </tbody>
  </table>

  <div class="pager"><span>Menampilkan 1–10 dari 52</span><span>1 2 3 4 5 6</span></div>
</div>
```

**Modal ganti koordinator**

```html
<div class="overlay">
  <div class="modal">
    <div class="modal-head"><div class="modal-title">Ganti Koordinator</div><button class="x">&times;</button></div>
    <div class="modal-body">

      <div class="field">
        <label class="label">Mata Kuliah</label>
        <input class="input input-locked" value="SI1101 · Algoritma dan Pemrograman" readonly>
      </div>

      <div class="note note-flat">
        <div class="mono-meta">Koordinator Saat Ini</div>
        <div style="color:var(--ink);margin-top:4px">Budi Santoso · BDS</div>
      </div>

      <div style="display:flex;justify-content:center;padding:12px 0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5"><path d="M12 5v14m0 0l-6-6m6 6l6-6"/></svg>
      </div>

      <div class="field">
        <label class="label">Koordinator Baru</label>
        <select class="select">
          <option>Pilih dosen…</option>
          <option>Anita Wijaya · ANW</option>
          <option>Chandra Putra · CHP</option>
        </select>
      </div>

      <div class="field">
        <label class="label">Periode</label>
        <input class="input input-locked" value="Ganjil 2025/2026 · UTS" readonly>
        <span class="help">Mengikuti periode berjalan.</span>
      </div>

      <div class="note note-warn">
        Perubahan berlaku untuk periode berjalan. Penugasan periode sebelumnya tetap tersimpan.
      </div>

    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary">Batal</button>
      <button class="btn btn-primary">Simpan Perubahan</button>
    </div>
  </div>
</div>
```

---

## 9. Penentuan Dosen Verifikator

Memilih mata kuliah bersifat wajib — tombol simpan nonaktif selama belum ada yang dipilih.

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Penentuan Dosen Verifikator</h1>
    <p class="page-desc">Tetapkan dosen verifikator beserta mata kuliah yang menjadi tanggung jawabnya.</p>
  </div>
</div>

<div class="card" style="margin-bottom:24px">
  <div class="grid">

    <div class="col-5">
      <div class="field">
        <label class="label">Pilih Dosen Verifikator</label>
        <select class="select">
          <option>Cari dosen…</option>
          <option>Anita Wijaya · ANW</option>
        </select>
      </div>

      <div class="note note-flat" style="display:flex;gap:12px;align-items:center">
        <span class="avatar">AW</span>
        <div>
          <div class="user-name">Anita Wijaya</div>
          <div class="help">ANW · Asisten Ahli</div>
        </div>
      </div>
    </div>

    <div class="col-7">
      <div class="field">
        <label class="label">Pilih Mata Kuliah <span style="color:var(--alert)">*</span></label>

        <div class="row" style="flex-wrap:wrap;margin-bottom:10px">
          <span class="tag tag-sel">Algoritma dan Pemrograman <span class="tag-x">&times;</span></span>
          <span class="tag tag-sel">Basis Data <span class="tag-x">&times;</span></span>
          <span class="help" style="margin-left:auto">2 mata kuliah dipilih</span>
          <button class="btn-ghost">Hapus semua</button>
        </div>

        <input class="input" placeholder="Cari mata kuliah…" style="margin-bottom:10px">

        <div class="picklist">
          <div class="pick-group">Semester 1</div>
          <label class="pick-item"><input type="checkbox" checked> SI1101 · Algoritma dan Pemrograman</label>
          <label class="pick-item"><input type="checkbox"> SI1102 · Matematika Diskrit</label>
          <div class="pick-group">Semester 2</div>
          <label class="pick-item"><input type="checkbox" checked> SI1203 · Basis Data</label>
          <label class="pick-item"><input type="checkbox"> SI1204 · Struktur Data</label>
        </div>
      </div>
    </div>

  </div>

  <div class="divider"></div>

  <div class="spread">
    <!-- state nonaktif: ganti dengan
         <span class="help">Minimal satu mata kuliah wajib dipilih.</span>
         <button class="btn btn-primary is-disabled" disabled>Simpan Penugasan</button> -->
    <span class="help">2 mata kuliah akan ditugaskan pada periode berjalan.</span>
    <button class="btn btn-primary">Simpan Penugasan</button>
  </div>
</div>

<div class="card card-flush">
  <div class="card-head"><h3 class="card-title">Penugasan Aktif</h3></div>
  <table class="table">
    <thead><tr><th>Dosen</th><th>Jumlah MK</th><th>Periode</th><th></th></tr></thead>
    <tbody>
      <tr>
        <td><div class="row"><span class="avatar avatar-sm">AW</span> Anita Wijaya</div></td>
        <td>12</td><td class="td-muted">Ganjil 2025/2026</td>
        <td><button class="btn-ghost">Ubah</button><button class="btn-danger-ghost">Hapus</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 10. Tahun Ajaran &amp; Periode

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Tahun Ajaran &amp; Periode</h1>
    <p class="page-desc">Hanya satu periode yang aktif dalam satu waktu.</p>
  </div>
  <button class="btn btn-primary">Tambah Tahun Ajaran</button>
</div>

<div class="strip">
  <div class="row">
    <span class="dot"></span>
    <div>
      <div class="strip-main">Periode Berjalan: Ganjil 2025/2026 · UTS</div>
      <div class="help">Seluruh opsi periode pada sistem mengikuti periode ini.</div>
    </div>
  </div>
  <button class="btn btn-secondary">Nonaktifkan Periode Verifikasi</button>
</div>

<div class="card card-flush">
  <table class="table">
    <thead>
      <tr><th>Tahun Ajaran</th><th>Semester</th><th>Periode</th><th>Tanggal Mulai</th><th>Tanggal Selesai</th><th>Status</th><th></th></tr>
    </thead>
    <tbody>
      <tr class="row-flag-active">
        <td>2025/2026</td>
        <td><span class="chip chip-slate">Ganjil</span></td>
        <td><span class="chip chip-maroon">UTS</span></td>
        <td>01 Sep 2025</td><td>31 Okt 2025</td>
        <td><span class="chip chip-ok">Aktif</span></td>
        <td><button class="btn-ghost">Edit</button></td>
      </tr>
      <tr>
        <td>2025/2026</td>
        <td><span class="chip chip-slate">Ganjil</span></td>
        <td><span class="chip chip-slate">UAS</span></td>
        <td>01 Nov 2025</td><td>31 Des 2025</td>
        <td><span class="chip chip-draft">Nonaktif</span></td>
        <td><button class="btn-ghost">Edit</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

**Modal konfirmasi nonaktifkan periode**

```html
<div class="overlay">
  <div class="modal">
    <div class="modal-head"><div class="modal-title">Nonaktifkan Periode Verifikasi</div><button class="x">&times;</button></div>
    <div class="modal-body">
      <p style="margin-bottom:16px">Periode <strong>Ganjil 2025/2026 · UTS</strong> akan dinonaktifkan.</p>
      <div class="note note-err">
        Koordinator tidak lagi dapat mengunggah soal, dan seluruh soal yang belum diverifikasi akan dibekukan pada status terakhirnya.
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary">Batal</button>
      <button class="btn btn-danger">Ya, Nonaktifkan</button>
    </div>
  </div>
</div>
```

---

## 11. Kategori Soal

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Kategori Soal</h1>
    <p class="page-desc">Jenis soal yang dapat dipilih koordinator saat mengunggah.</p>
  </div>
  <button class="btn btn-primary">Tambah Kategori</button>
</div>

<div class="card card-flush">
  <div class="toolbar">
    <div class="toolbar-l"><input class="input search" placeholder="Cari kategori…"></div>
  </div>
  <table class="table">
    <thead><tr><th>Kode</th><th>Nama Kategori</th><th>Deskripsi</th><th>Jumlah Soal</th><th></th></tr></thead>
    <tbody>
      <tr>
        <td>UTS</td><td>Ujian Tengah Semester</td>
        <td class="td-muted">Soal ujian pada pertengahan periode perkuliahan.</td><td>38</td>
        <td><button class="btn-ghost">Edit</button><button class="btn-danger-ghost">Hapus</button></td>
      </tr>
      <tr>
        <td>UAS</td><td>Ujian Akhir Semester</td>
        <td class="td-muted">Soal ujian pada akhir periode perkuliahan.</td><td>0</td>
        <td><button class="btn-ghost">Edit</button><button class="btn-danger-ghost">Hapus</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 12. Template Soal — Koordinator

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Template Soal</h1>
    <p class="page-desc">Unduh berkas template sebelum menyusun soal.</p>
  </div>
</div>

<div class="grid">
  <div class="card col-8">
    <h3 class="card-title">Unduh Template Soal</h3>
    <p class="help" style="margin:8px 0 20px">
      Susun soal langsung pada template ini tanpa mengubah strukturnya. Berkas yang strukturnya berubah akan ditolak saat diunggah.
    </p>

    <table class="table" style="border:1px solid var(--line)">
      <thead><tr><th>Ketentuan</th><th>Nilai</th></tr></thead>
      <tbody>
        <tr><td>Format berkas</td><td class="td-muted">.docx untuk penyusunan, .pdf saat diunggah</td></tr>
        <tr><td>Bagian wajib</td><td class="td-muted">Identitas MK, petunjuk pengerjaan, butir soal, kunci jawaban</td></tr>
        <tr><td>Ukuran halaman</td><td class="td-muted">A4, margin 2,5 cm</td></tr>
      </tbody>
    </table>

    <button class="btn btn-primary btn-lg" style="margin-top:24px">Unduh Template Soal (.docx)</button>
  </div>

  <div class="card col-4">
    <h3 class="card-title" style="font-size:16px">Riwayat Unduhan</h3>
    <div class="divider"></div>
    <div class="spread" style="margin-bottom:14px">
      <div>
        <div style="color:var(--ink)">template-soal-v3.docx</div>
        <div class="help">12 Agu 2026</div>
      </div>
      <span class="chip chip-ok">Versi terbaru</span>
    </div>
    <div class="spread">
      <div>
        <div style="color:var(--ink)">template-soal-v2.docx</div>
        <div class="help">04 Mar 2026</div>
      </div>
    </div>
  </div>
</div>
```

---

## 13. Unggah Soal — Koordinator

Mata kuliah dan periode terkunci. Opsi periode selain yang berjalan tidak ditampilkan.

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Unggah Soal</h1>
    <p class="page-desc">Unggah berkas soal untuk mata kuliah yang Anda koordinasikan.</p>
  </div>
</div>

<div class="grid" style="margin-bottom:24px">

  <div class="card col-8">
    <div class="field">
      <label class="label">Mata Kuliah</label>
      <div style="position:relative">
        <input class="input input-locked" value="SI1101 · Algoritma dan Pemrograman" readonly style="padding-right:40px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" style="position:absolute;right:12px;top:12px"><rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>
      </div>
      <span class="help">Terkunci sesuai penugasan Anda.</span>
    </div>

    <div class="field">
      <label class="label">Kategori Soal</label>
      <select class="select"><option>Pilih kategori…</option><option>Ujian Tengah Semester</option></select>
    </div>

    <div class="field">
      <label class="label">Periode</label>
      <input class="input input-locked" value="UTS · Ganjil 2025/2026" readonly>
      <span class="help">Mengikuti periode berjalan.</span>
    </div>

    <div class="field">
      <label class="label">Berkas Soal</label>
      <div class="dropzone">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5"><path d="M12 16V4m0 0L7 9m5-5l5 5M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"/></svg>
        <div class="dropzone-title">Tarik file PDF ke sini</div>
        <a href="#">Pilih File</a>
        <span class="help">Maksimal 10 MB.</span>
      </div>

      <!-- state mengunggah
      <div class="file-row">
        <span style="flex:1">soal-uts-si1101.pdf</span>
        <div class="progress" style="max-width:160px"><div class="progress-fill" style="width:64%"></div></div>
        <span class="help">64%</span>
        <button class="btn-ghost">Batal</button>
      </div>
      -->
    </div>

    <button class="btn btn-primary">Unggah Soal</button>
  </div>

  <div class="card col-4">
    <h3 class="card-title" style="font-size:16px">Informasi Periode</h3>
    <div class="divider"></div>
    <div style="margin-bottom:16px"><div class="mono-meta">Periode Berjalan</div><div>UTS · Ganjil 2025/2026</div></div>
    <div style="margin-bottom:16px"><div class="mono-meta">Batas Unggah</div><div>28 Sep 2026</div></div>
    <div><div class="mono-meta">Verifikator</div><div>Anita Wijaya</div></div>
  </div>

</div>

<div class="card card-flush">
  <div class="card-head"><h3 class="card-title">Riwayat Unggahan</h3></div>
  <table class="table">
    <thead><tr><th>Versi</th><th>Nama File</th><th>Kategori Soal</th><th>Tanggal Unggah</th><th>Status</th><th></th></tr></thead>
    <tbody>
      <tr>
        <td>v2</td><td>soal-uts-si1101-rev.pdf</td><td>UTS</td><td class="td-muted">12 Agu 2026</td>
        <td><span class="chip chip-slate">Menunggu Verifikasi</span></td>
        <td><button class="btn-ghost">Lihat</button></td>
      </tr>
      <tr>
        <td>v1</td><td>soal-uts-si1101.pdf</td><td>UTS</td><td class="td-muted">05 Agu 2026</td>
        <td><span class="chip chip-warn">Perlu Revisi</span></td>
        <td><button class="btn-ghost" style="color:var(--warn)">Unggah Revisi</button></td>
      </tr>
    </tbody>
  </table>
</div>
```

**Modal unggah revisi**

```html
<div class="overlay">
  <div class="modal">
    <div class="modal-head"><div class="modal-title">Unggah Revisi Soal</div><button class="x">&times;</button></div>
    <div class="modal-body">
      <div class="field">
        <label class="label">Versi Sebelumnya</label>
        <input class="input input-locked" value="v1 · soal-uts-si1101.pdf" readonly>
      </div>

      <div class="mono-meta" style="margin-bottom:8px">Catatan dari Verifikator</div>
      <div class="note note-flat" style="margin-bottom:20px">
        Butir soal nomor 4 dan 7 belum sesuai dengan CLO yang dipetakan. Mohon disesuaikan dan sertakan kunci jawaban lengkap.
      </div>

      <div class="field">
        <label class="label">Berkas Revisi</label>
        <div class="dropzone" style="height:160px">
          <div class="dropzone-title">Tarik file PDF ke sini</div>
          <a href="#">Pilih File</a>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary">Batal</button>
      <button class="btn btn-primary">Unggah Revisi</button>
    </div>
  </div>
</div>
```

---

## 14. Status Verifikasi — Koordinator

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Status Verifikasi</h1>
    <p class="page-desc">Hasil verifikasi soal yang Anda unggah.</p>
  </div>
</div>

<div class="row" style="margin-bottom:24px">
  <span class="chip chip-ok">Disetujui · 1</span>
  <span class="chip chip-slate">Menunggu Verifikasi · 1</span>
  <span class="chip chip-warn">Perlu Revisi · 1</span>
  <span class="help" style="margin-left:8px">Periode berjalan: UTS · Ganjil 2025/2026</span>
</div>

<div class="card card-flush">
  <table class="table">
    <thead><tr><th>Mata Kuliah</th><th>Kategori Soal</th><th>Versi</th><th>Tanggal Unggah</th><th>Verifikator</th><th>Status</th><th>Catatan</th></tr></thead>
    <tbody>
      <tr>
        <td>Algoritma dan Pemrograman</td><td>UTS</td><td>v2</td>
        <td class="td-muted">12 Agu 2026</td><td>Anita Wijaya</td>
        <td><span class="chip chip-slate">Menunggu Verifikasi</span></td>
        <td class="td-muted">—</td>
      </tr>
      <tr>
        <td>Basis Data</td><td>UTS</td><td>v1</td>
        <td class="td-muted">05 Agu 2026</td><td>Anita Wijaya</td>
        <td><span class="chip chip-warn">Perlu Revisi</span></td>
        <td><button class="btn-ghost">Lihat</button></td>
      </tr>
    </tbody>
  </table>
</div>

<!-- empty state
<div class="card">
  <div class="empty">
    <div class="empty-title">Belum ada soal diunggah</div>
    <div class="empty-help">Unggah berkas soal untuk mata kuliah yang Anda koordinasikan pada periode berjalan.</div>
    <button class="btn btn-primary">Unggah Soal</button>
  </div>
</div>
-->
```

---

## 15. Antrian Verifikasi — Verifikator

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Antrian Verifikasi</h1>
    <p class="page-desc">Soal yang menunggu peninjauan pada periode berjalan.</p>
  </div>
</div>

<div class="card card-flush">
  <div class="tabs">
    <div class="tab active">Perlu Ditinjau <span class="tab-count">9</span></div>
    <div class="tab">Sudah Diverifikasi <span class="tab-count">29</span></div>
    <div class="tab">Semua <span class="tab-count">38</span></div>
  </div>

  <div class="toolbar">
    <div class="toolbar-l"><input class="input search" placeholder="Cari mata kuliah atau koordinator…"></div>
    <div class="toolbar-r">
      <select class="select"><option>Semua Mata Kuliah</option></select>
      <select class="select"><option>Semua Status</option></select>
    </div>
  </div>

  <table class="table">
    <thead><tr><th>Mata Kuliah</th><th>Koordinator</th><th>Kategori Soal</th><th>Versi</th><th>Tanggal Masuk</th><th>Status</th><th></th></tr></thead>
    <tbody>
      <tr class="row-flag-warn">
        <td>Algoritma dan Pemrograman <span class="tag" style="margin-left:6px">Revisi v2</span></td>
        <td>Budi Santoso</td><td>UTS</td><td>v2</td>
        <td class="td-muted">12 Agu 2026</td>
        <td><span class="chip chip-slate">Menunggu Verifikasi</span></td>
        <td><button class="btn btn-outline">Verifikasi</button></td>
      </tr>
      <tr class="row-flag-warn">
        <td>Pemrograman Web</td>
        <td>Chandra Putra</td><td>UTS</td><td>v1</td>
        <td class="td-muted">11 Agu 2026</td>
        <td><span class="chip chip-slate">Menunggu Verifikasi</span></td>
        <td><button class="btn btn-outline">Verifikasi</button></td>
      </tr>
    </tbody>
  </table>

  <div class="pager"><span>Menampilkan 1–9 dari 9</span><span>1</span></div>
</div>

<!-- empty state antrean bersih
<div class="card">
  <div class="empty">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5"><path d="M20 6L9 17l-5-5"/></svg>
    <div class="empty-title">Tidak ada soal yang perlu ditinjau</div>
    <div class="empty-help">Seluruh soal pada periode berjalan sudah diverifikasi.</div>
    <button class="btn btn-secondary">Lihat Semua</button>
  </div>
</div>
-->
```

---

## 16. Detail Verifikasi Soal — Verifikator

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Verifikasi Soal</h1>
    <p class="page-desc">Algoritma dan Pemrograman · UTS · Versi 2</p>
  </div>
</div>

<div class="grid">

  <div class="card card-flush col-8">
    <div class="toolbar">
      <div class="toolbar-l">
        <strong style="font-size:14px;color:var(--ink)">soal-uts-si1101-rev.pdf</strong>
        <span class="help">Halaman 1 dari 8</span>
      </div>
      <div class="toolbar-r">
        <button class="btn-ghost-muted">−</button>
        <span class="help">100%</span>
        <button class="btn-ghost-muted">+</button>
        <button class="btn-ghost">Unduh</button>
      </div>
    </div>

    <div style="padding:24px">
      <div class="doc">
        <div class="doc-sheet">
          <!-- placeholder isi dokumen, bukan gambar -->
          <div class="skel" style="width:45%;height:14px;margin-bottom:24px"></div>
          <div class="skel" style="width:100%"></div>
          <div class="skel" style="width:96%"></div>
          <div class="skel" style="width:88%;margin-bottom:24px"></div>
          <div class="skel" style="width:30%;height:12px"></div>
          <div class="skel" style="width:100%"></div>
          <div class="skel" style="width:92%"></div>
          <div class="skel" style="width:70%"></div>
        </div>
      </div>

      <div class="pagebar">
        <span class="pagesq on">1</span><span class="pagesq">2</span><span class="pagesq">3</span>
        <span class="pagesq">4</span><span class="pagesq">5</span><span class="pagesq">6</span>
        <span class="pagesq">7</span><span class="pagesq">8</span>
      </div>
    </div>
  </div>

  <div class="col-4">
    <div class="sticky stack">

      <div class="card">
        <div style="margin-bottom:14px"><div class="mono-meta">Mata Kuliah</div><div>Algoritma dan Pemrograman</div></div>
        <div style="margin-bottom:14px"><div class="mono-meta">Koordinator</div><div>Budi Santoso</div></div>
        <div style="margin-bottom:14px"><div class="mono-meta">Kategori Soal</div><div>UTS</div></div>
        <div style="margin-bottom:14px"><div class="mono-meta">Versi</div><div>v2</div></div>
        <div><div class="mono-meta">Tanggal Unggah</div><div>12 Agu 2026</div></div>
      </div>

      <div class="card">
        <h3 class="card-title" style="font-size:16px;margin-bottom:16px">Keputusan Verifikasi</h3>

        <label class="opt on-ok">
          <input type="radio" name="keputusan" checked>
          <div><div class="opt-title">Disetujui</div><div class="opt-help">Soal memenuhi seluruh kriteria.</div></div>
        </label>

        <label class="opt">
          <input type="radio" name="keputusan">
          <div><div class="opt-title">Perlu Revisi</div><div class="opt-help">Soal dikembalikan untuk diperbaiki.</div></div>
        </label>

        <label class="opt">
          <input type="radio" name="keputusan">
          <div><div class="opt-title">Ditolak</div><div class="opt-help">Soal tidak dapat digunakan.</div></div>
        </label>

        <div class="field" style="margin-top:20px">
          <label class="label">Catatan Verifikasi</label>
          <textarea class="textarea" rows="5" placeholder="Tuliskan catatan untuk koordinator…"></textarea>
          <div class="spread">
            <span class="help">Wajib diisi untuk keputusan Perlu Revisi dan Ditolak.</span>
            <span class="help">0/500</span>
          </div>
        </div>

        <button class="btn btn-primary btn-block" style="margin-bottom:12px">Simpan Keputusan</button>
        <button class="btn btn-secondary btn-block">Cetak Berita Acara</button>
      </div>

      <!-- varian sudah diverifikasi: ganti card keputusan dengan blok ini
      <div class="card">
        <h3 class="card-title" style="font-size:16px;margin-bottom:16px">Hasil Verifikasi</h3>
        <span class="chip chip-ok">Disetujui</span>
        <div style="margin:16px 0 14px"><div class="mono-meta">Diverifikasi Oleh</div><div>Anita Wijaya</div></div>
        <div style="margin-bottom:16px"><div class="mono-meta">Waktu</div><div>12 Agu 2026, 14:20</div></div>
        <div class="mono-meta" style="margin-bottom:8px">Catatan</div>
        <div class="note note-flat">Soal sudah sesuai dengan CLO yang dipetakan.</div>
        <button class="btn btn-secondary btn-block" style="margin-top:20px">Cetak Berita Acara</button>
      </div>
      -->

    </div>
  </div>

</div>
```

**Modal konfirmasi keputusan**

```html
<div class="overlay">
  <div class="modal">
    <div class="modal-head"><div class="modal-title">Konfirmasi Keputusan Verifikasi</div><button class="x">&times;</button></div>
    <div class="modal-body">
      <p style="margin-bottom:16px">
        Soal <strong>Algoritma dan Pemrograman · UTS · v2</strong> akan ditetapkan sebagai
        <span class="chip chip-ok">Disetujui</span>
      </p>
      <p class="help">Keputusan tersimpan permanen dan koordinator akan menerima pemberitahuan.</p>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary">Batal</button>
      <button class="btn btn-primary">Ya, Simpan Keputusan</button>
    </div>
  </div>
</div>
```

---

## 17. Berita Acara — Verifikator

Selalu dapat diakses. Tidak ada gating dev mode / feature flag.

```html
<div class="page-head">
  <div>
    <h1 class="page-title">Berita Acara</h1>
    <p class="page-desc">Dokumen resmi hasil verifikasi soal per mata kuliah dan periode.</p>
  </div>
</div>

<div class="grid">

  <div class="card col-8">
    <div class="doc">
      <div class="doc-sheet">
        <div class="doc-title">BERITA ACARA VERIFIKASI SOAL</div>
        <div style="text-align:center;color:var(--muted);margin:6px 0 32px">Nomor: 014/BA-VS/SI/VIII/2026</div>

        <table style="width:100%;font-size:13px;margin-bottom:28px">
          <tr><td style="width:32%;color:var(--muted);padding:4px 0">Tahun Ajaran</td><td>: 2025/2026</td></tr>
          <tr><td style="color:var(--muted);padding:4px 0">Periode</td><td>: Ganjil · UTS</td></tr>
          <tr><td style="color:var(--muted);padding:4px 0">Mata Kuliah</td><td>: SI1101 · Algoritma dan Pemrograman</td></tr>
          <tr><td style="color:var(--muted);padding:4px 0">Koordinator</td><td>: Budi Santoso</td></tr>
          <tr><td style="color:var(--muted);padding:4px 0">Verifikator</td><td>: Anita Wijaya</td></tr>
          <tr><td style="color:var(--muted);padding:4px 0">Tanggal</td><td>: 12 Agustus 2026</td></tr>
        </table>

        <table class="table" style="border:1px solid var(--line);margin-bottom:28px">
          <thead><tr><th>No</th><th>Kategori Soal</th><th>Versi</th><th>Keputusan</th><th>Catatan</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>UTS</td><td>v2</td><td>Disetujui</td><td class="td-muted">Sesuai CLO</td></tr>
          </tbody>
        </table>

        <p style="margin-bottom:8px">
          Demikian berita acara ini dibuat untuk dipergunakan sebagaimana mestinya.
        </p>

        <div class="sig">
          <div class="sig-col">
            <div style="color:var(--muted);margin-bottom:4px">Koordinator Mata Kuliah</div>
            <div class="sig-line"></div>
            <div>Budi Santoso</div>
          </div>
          <div class="sig-col">
            <div style="color:var(--muted);margin-bottom:4px">Dosen Verifikator</div>
            <div class="sig-line"></div>
            <div>Anita Wijaya</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="col-4">
    <div class="sticky stack">
      <div class="card">
        <h3 class="card-title" style="font-size:16px;margin-bottom:16px">Opsi Cetak</h3>

        <div class="field">
          <label class="label">Periode</label>
          <select class="select input-locked"><option>UTS · Ganjil 2025/2026</option></select>
          <span class="help">Mengikuti periode berjalan.</span>
        </div>

        <div class="field">
          <label class="label">Mata Kuliah</label>
          <select class="select"><option>SI1101 · Algoritma dan Pemrograman</option></select>
        </div>

        <label class="check" style="margin-bottom:10px"><input type="checkbox" checked> Sertakan catatan verifikasi</label>
        <label class="check" style="margin-bottom:20px"><input type="checkbox"> Sertakan riwayat revisi</label>

        <button class="btn btn-primary btn-block">Cetak / Unduh PDF</button>
      </div>

      <div class="card">
        <h3 class="card-title" style="font-size:16px">Riwayat Dokumen</h3>
        <div class="divider"></div>
        <div class="spread" style="margin-bottom:14px">
          <div>
            <div style="color:var(--ink)">BA-SI1101-UTS.pdf</div>
            <div class="help">12 Agu 2026</div>
          </div>
          <button class="btn-ghost">Unduh</button>
        </div>
      </div>
    </div>
  </div>

</div>
```

---

## 18. Shared States

Dipakai lintas halaman.

```html
<!-- 1. Skeleton tabel -->
<div class="card card-flush">
  <table class="table">
    <thead><tr><th>Kode MK</th><th>Nama Mata Kuliah</th><th>Semester</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td><div class="skel" style="width:60px"></div></td><td><div class="skel" style="width:70%"></div></td><td><div class="skel" style="width:30px"></div></td><td><div class="skel" style="width:80px"></div></td></tr>
      <tr><td><div class="skel" style="width:60px"></div></td><td><div class="skel" style="width:55%"></div></td><td><div class="skel" style="width:30px"></div></td><td><div class="skel" style="width:80px"></div></td></tr>
      <tr><td><div class="skel" style="width:60px"></div></td><td><div class="skel" style="width:64%"></div></td><td><div class="skel" style="width:30px"></div></td><td><div class="skel" style="width:80px"></div></td></tr>
    </tbody>
  </table>
</div>

<!-- 2. Empty state generik -->
<div class="card">
  <div class="empty">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8"/></svg>
    <div class="empty-title">Belum ada data</div>
    <div class="empty-help">Data akan muncul setelah proses terkait dijalankan.</div>
    <button class="btn btn-primary">Mulai</button>
  </div>
</div>

<!-- 3. 403 Akses Ditolak -->
<div class="card">
  <div class="empty">
    <h1 class="page-title">Akses Ditolak</h1>
    <div class="empty-help">Peran Anda tidak memiliki izin untuk membuka halaman ini.</div>
    <button class="btn btn-secondary">Kembali ke Dashboard</button>
  </div>
</div>

<!-- 4. Toast -->
<div style="position:fixed;top:24px;right:24px;display:flex;flex-direction:column;gap:12px;z-index:60">
  <div class="toast toast-ok">
    <div style="flex:1">
      <div class="toast-title">Keputusan tersimpan</div>
      <div class="toast-line">Koordinator telah menerima pemberitahuan.</div>
    </div>
    <button class="x">&times;</button>
  </div>
  <div class="toast toast-err">
    <div style="flex:1">
      <div class="toast-title">Gagal mengunggah</div>
      <div class="toast-line">Ukuran berkas melebihi 10 MB.</div>
    </div>
    <button class="x">&times;</button>
  </div>
  <div class="toast">
    <div style="flex:1">
      <div class="toast-title">Periode berjalan berubah</div>
      <div class="toast-line">Data pada halaman ini telah disesuaikan.</div>
    </div>
    <button class="x">&times;</button>
  </div>
</div>

<!-- 5. Modal konfirmasi destruktif (pola pakai ulang) -->
<div class="overlay">
  <div class="modal">
    <div class="modal-head"><div class="modal-title">Hapus Kategori Soal</div><button class="x">&times;</button></div>
    <div class="modal-body">
      <p style="margin-bottom:16px">Kategori <strong>Ujian Tengah Semester</strong> akan dihapus.</p>
      <div class="note note-err">Kategori ini sedang digunakan oleh 38 soal. Menghapusnya akan memutus keterkaitan tersebut.</div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-secondary">Batal</button>
      <button class="btn btn-danger">Ya, Hapus</button>
    </div>
  </div>
</div>

<!-- 6. Select terkunci periode (pola pakai ulang) -->
<div class="field" style="max-width:320px">
  <label class="label">Periode</label>
  <select class="select input-locked" disabled><option>UTS · Ganjil 2025/2026</option></select>
  <span class="help">Mengikuti periode berjalan.</span>
</div>
```
