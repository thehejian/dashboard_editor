#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Starting Vite dev server..."
nohup npm run dev > /tmp/vite-dev.log 2>&1 &
echo "  Vite PID: $!"
echo "Starting Express API..."
nohup node --watch server/server.js > /tmp/express-dev.log 2>&1 &
echo "  Express PID: $!"
echo ""
echo "Frontend: http://192.168.0.155:5173/"
echo "Backend:  http://192.168.0.155:3001/"
