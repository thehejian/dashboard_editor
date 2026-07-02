#!/bin/bash
# 启动前后台（nohup 脱离 shell 进程组，避免 Bash tool 超时回收）
DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH"

echo "Starting backend (port 3001)..."
nohup node "$DIR/server/server.js" > /tmp/server.log 2>&1 &
echo "  PID: $!"

echo "Starting frontend (port 5173)..."
nohup npm --prefix "$DIR" run dev > /tmp/vite.log 2>&1 &
echo "  PID: $!"

echo "Done. Check with: lsof -i :5173 -i :3001"
