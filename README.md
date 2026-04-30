# Invoice Management Application

Aplikasi manajemen invoice full-stack untuk deployment lokal dengan teknologi berikut:

- Backend: Laravel 11 REST API
- Frontend: Next.js 14 App Router
- Database: MySQL 8
- Auth: Laravel Sanctum token-based
- Deployment: Docker + docker-compose

## Struktur Proyek

```text
invoice-app/
├── backend/
├── frontend/
├── docker-compose.yml
├── start.bat
└── start.sh
```

## Prasyarat

- Install Docker Desktop dari https://www.docker.com/products/docker-desktop/
- Tidak perlu install PHP, Node.js, atau MySQL secara terpisah

## Cara Pertama Kali Setup

1. Extract folder project.
2. Buka terminal/command prompt di folder project.
3. Jalankan: `docker-compose up -d --build`
4. Tunggu sekitar 2-3 menit untuk build pertama kali.
5. Jalankan migrasi: `docker-compose exec backend php artisan migrate --seed`
6. Buka browser: http://localhost:3000

## Login Default

- Email: `admin@invoice.com`
- Password: `password123`

## Penggunaan Harian (Windows)

- Double-click file `start.bat`
- Browser akan terbuka otomatis

## Penggunaan Harian (Mac/Linux)

- Jalankan `./start.sh` di terminal

## Menghentikan Aplikasi

```bash
docker-compose down
```

## phpMyAdmin (opsional)

- URL: http://localhost:8080
- Server: `mysql`
- Username: `root`
- Password: `secret`

## Port yang Digunakan

- `3000`: Aplikasi utama
- `8000`: Backend API
- `3306`: Database MySQL
- `8080`: phpMyAdmin

## Fitur Utama

- Login token-based menggunakan Laravel Sanctum
- Dashboard ringkas untuk total invoice, status, dan pendapatan
- CRUD vendor dengan pencarian dan pagination
- CRUD invoice dengan item dinamis dan kalkulasi otomatis
- Status transition terkontrol: draft, terkirim, lunas, jatuh tempo, dibatalkan
- Download invoice PDF profesional dengan watermark `LUNAS`
- Tampilan antarmuka berbahasa Indonesia

## Catatan Penting

- Backend API berjalan di `http://localhost:8000`
- Frontend mengakses API melalui `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
- Semua service Docker menggunakan `restart: unless-stopped`, sehingga akan otomatis aktif kembali ketika Docker Desktop berjalan setelah restart komputer
- Jika Anda mengubah source code dan ingin image ter-update, jalankan kembali:

```bash
docker-compose up -d --build
```
