#!/bin/bash

cd "$(dirname "$0")"

echo "🚀 Starting app..."

docker compose up -d --build

echo "⏳ Waiting..."
sleep 15

echo "🌐 Opening..."
open http://localhost:3000

echo "Press any key to exit..."
read