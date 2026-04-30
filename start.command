#!/bin/bash

cd "$(dirname "$0")"

set -e

echo "[1/5] Checking Docker..."
if ! docker version >/dev/null 2>&1; then
  echo "Docker Desktop belum berjalan atau belum terpasang."
  echo "Jalankan Docker Desktop dulu, lalu double-click start.command lagi."
  read -r
  exit 1
fi

echo "[2/5] Starting containers..."
docker compose up -d

echo "[3/5] Waiting for frontend to respond..."
frontend_ready="0"
for _ in $(seq 1 60); do
  if curl -fsS http://localhost:3000/login >/dev/null 2>&1; then
    frontend_ready="1"
    break
  fi
  sleep 5
done

if [ "$frontend_ready" != "1" ]; then
  echo "Frontend belum siap setelah 5 menit."
  echo "Cek dengan: docker compose logs frontend"
  echo "Jika ini pertama kali dijalankan, gunakan start-first-run.command"
  read -r
  exit 1
fi

echo "[4/5] Opening application..."
open http://localhost:3000/login
echo "[5/5] Done."
echo
echo "Aplikasi siap dipakai untuk penggunaan harian."
echo "Untuk setup pertama kali atau setelah update struktur database, jalankan start-first-run.command"
echo "Login default:"
echo "  Email    : admin@invoice.com"
echo "  Password : password123"
read -r
