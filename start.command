#!/bin/bash

cd "$(dirname "$0")"

set -e

echo "[1/6] Checking Docker..."
if ! docker version >/dev/null 2>&1; then
  echo "Docker Desktop belum berjalan atau belum terpasang."
  echo "Jalankan Docker Desktop dulu, lalu double-click start.command lagi."
  read -r
  exit 1
fi

echo "[2/6] Building and starting containers..."
docker compose up -d --build

echo "[3/6] Waiting for MySQL to become healthy..."
mysql_status=""
for _ in $(seq 1 60); do
  mysql_status="$(docker inspect -f '{{.State.Health.Status}}' invoice-mysql 2>/dev/null || true)"
  if [ "$mysql_status" = "healthy" ]; then
    break
  fi
  sleep 5
done

if [ "$mysql_status" != "healthy" ]; then
  echo "MySQL belum healthy setelah 5 menit."
  echo "Cek dengan: docker compose logs mysql"
  read -r
  exit 1
fi

echo "[4/6] Running database migration and seeder..."
docker compose exec -T backend php artisan migrate --seed --force

echo "[5/6] Waiting for frontend to respond..."
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
  read -r
  exit 1
fi

echo "[6/6] Opening application..."
open http://localhost:3000/login
echo
echo "Aplikasi siap dipakai."
echo "Login default:"
echo "  Email    : admin@invoice.com"
echo "  Password : password123"
read -r
