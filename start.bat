@echo off
setlocal

cd /d "%~dp0"

echo [1/5] Checking Docker...
docker version >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop belum berjalan atau belum terpasang.
  echo Jalankan Docker Desktop dulu, lalu double-click start.bat lagi.
  pause
  exit /b 1
)

echo [2/5] Starting containers...
docker compose up -d
if errorlevel 1 (
  echo Gagal menjalankan docker compose up -d.
  echo Untuk setup pertama kali, jalankan start-first-run.bat
  pause
  exit /b 1
)

echo [3/5] Waiting for frontend to respond...
set /a FRONTEND_WAIT=0
:wait_frontend
curl -fsS http://localhost:3000/login >nul 2>&1
if not errorlevel 1 goto frontend_ready
set /a FRONTEND_WAIT+=1
if %FRONTEND_WAIT% GEQ 60 (
  echo Frontend belum siap setelah 5 menit.
  echo Cek dengan: docker compose logs frontend
  echo Jika ini pertama kali dijalankan, gunakan start-first-run.bat
  pause
  exit /b 1
)
timeout /t 5 /nobreak >nul
goto wait_frontend

:frontend_ready
echo [4/5] Opening application...
start "" http://localhost:3000/login
echo [5/5] Done.
echo.
echo Aplikasi siap dipakai untuk penggunaan harian.
echo Untuk setup pertama kali atau setelah update struktur database, jalankan start-first-run.bat
echo Login default:
echo   Email    : admin@invoice.com
echo   Password : password123
pause >nul
