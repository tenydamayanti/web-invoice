@echo off
setlocal

cd /d "%~dp0"

echo [1/6] Checking Docker...
docker version >nul 2>&1
if errorlevel 1 (
  echo Docker Desktop belum berjalan atau belum terpasang.
  echo Jalankan Docker Desktop dulu, lalu double-click start.bat lagi.
  pause
  exit /b 1
)

echo [2/6] Building and starting containers...
docker compose up -d --build
if errorlevel 1 (
  echo Gagal menjalankan docker compose up -d --build.
  pause
  exit /b 1
)

echo [3/6] Waiting for MySQL to become healthy...
set "MYSQL_STATUS="
set /a MYSQL_WAIT=0
:wait_mysql
for /f "delims=" %%i in ('docker inspect -f "{{.State.Health.Status}}" invoice-mysql 2^>nul') do set "MYSQL_STATUS=%%i"
if /i "%MYSQL_STATUS%"=="healthy" goto mysql_ready
set /a MYSQL_WAIT+=1
if %MYSQL_WAIT% GEQ 60 (
  echo MySQL belum healthy setelah 5 menit.
  echo Cek dengan: docker compose logs mysql
  pause
  exit /b 1
)
timeout /t 5 /nobreak >nul
goto wait_mysql

:mysql_ready
echo [4/6] Running database migration and seeder...
docker compose exec -T backend php artisan migrate --seed --force
if errorlevel 1 (
  echo Gagal menjalankan migrate --seed.
  echo Cek dengan: docker compose logs backend
  pause
  exit /b 1
)

echo [5/6] Waiting for frontend to respond...
set /a FRONTEND_WAIT=0
:wait_frontend
curl -fsS http://localhost:3000/login >nul 2>&1
if not errorlevel 1 goto frontend_ready
set /a FRONTEND_WAIT+=1
if %FRONTEND_WAIT% GEQ 60 (
  echo Frontend belum siap setelah 5 menit.
  echo Cek dengan: docker compose logs frontend
  pause
  exit /b 1
)
timeout /t 5 /nobreak >nul
goto wait_frontend

:frontend_ready
echo [6/6] Opening application...
start "" http://localhost:3000/login
echo.
echo Aplikasi siap dipakai.
echo Login default:
echo   Email    : admin@invoice.com
echo   Password : password123
pause >nul
