#!/usr/bin/env sh
set -eu

if command -v docker-compose >/dev/null 2>&1; then
  docker-compose up -d
else
  docker compose up -d
fi

sleep 10

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open http://localhost:3000 >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open http://localhost:3000 >/dev/null 2>&1 || true
fi
