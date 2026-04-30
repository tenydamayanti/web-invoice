# Invoice Management Application

Aplikasi manajemen invoice full-stack untuk deployment lokal dengan teknologi berikut:

- Backend: Laravel 11 REST API
- Frontend: Next.js 14 App Router
- Database: MySQL 8
- Auth: Laravel Sanctum token-based
- Deployment: Docker + Docker Compose

## Struktur Proyek

```text
web-invoice/
├── backend/
├── frontend/
├── docker-compose.yml
├── start.bat
└── start.command
```

## Prasyarat

- Install Docker Desktop dari https://www.docker.com/products/docker-desktop/
- Jalankan Docker Desktop sebelum membuka aplikasi
- Tidak perlu install PHP, Node.js, atau MySQL secara terpisah

## Cara Menjalankan

### Windows

- Double-click [start.bat](C:/xampp/htdocs/web-invoice/start.bat)

### macOS

- Double-click `start.command`
- Jika macOS meminta izin, buka file tersebut melalui Terminal atau izinkan eksekusi terlebih dahulu dengan:

```bash
chmod +x start.command
```

Script start akan otomatis:

1. Mengecek Docker Desktop
2. Menjalankan `docker compose up -d --build`
3. Menunggu MySQL siap
4. Menjalankan `php artisan migrate --seed --force`
5. Menunggu frontend siap
6. Membuka `http://localhost:3000/login`

## Login Default

- Email: `admin@invoice.com`
- Password: `password123`

## Menjalankan Manual

Kalau ingin menjalankan tanpa script start:

```bash
docker compose up -d --build
docker compose exec -T backend php artisan migrate --seed --force
```

Lalu buka:

- Aplikasi: http://localhost:3000/login
- Backend API: http://localhost:8000
- phpMyAdmin: http://localhost:8080

## Menghentikan Aplikasi

```bash
docker compose down
```

## Port yang Digunakan

- `3000`: Frontend
- `8000`: Backend API
- `3306`: MySQL
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
- Semua service Docker menggunakan `restart: unless-stopped`, jadi container akan otomatis aktif kembali saat Docker Desktop menyala lagi
- Jika source code diubah dan ingin image ter-update, jalankan ulang script start atau perintah berikut:

```bash
docker compose up -d --build
```
