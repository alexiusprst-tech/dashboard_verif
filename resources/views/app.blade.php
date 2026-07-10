<!DOCTYPE html>
<html lang="id" class="h-full">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Sistem Verifikasi Soal — Platform pengelolaan dan verifikasi soal ujian Telkom University" />
    <meta name="theme-color" content="#C8102E" />

    <title>Sistem Verifikasi Soal — Telkom University</title>

    {{-- CSRF meta (untuk Sanctum SPA) --}}
    <meta name="csrf-token" content="{{ csrf_token() }}" />

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body class="h-full antialiased">
    {{-- React SPA mount point --}}
    <div id="app" class="h-full"></div>
</body>
</html>
