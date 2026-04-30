@echo off
setlocal

where docker-compose >nul 2>nul
if %errorlevel%==0 (
  docker-compose up -d
) else (
  docker compose up -d
)

timeout /t 10 /nobreak >nul
start http://localhost:3000
