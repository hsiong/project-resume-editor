#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-5173}"
PID_FILE="$ROOT_DIR/.resume-editor.pid"
LOG_FILE="$ROOT_DIR/.resume-editor.log"

cd "$ROOT_DIR"

echo "Stopping existing resume editor on port $PORT..."
"$ROOT_DIR/stop.sh" "$PORT" || true

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Building resume editor..."
npm run build

echo "Starting resume editor on http://localhost:$PORT/ ..."
nohup node "$ROOT_DIR/server.mjs" "$PORT" "$ROOT_DIR/dist" > "$LOG_FILE" 2>&1 &
echo "$!" > "$PID_FILE"

sleep 2

if lsof -ti tcp:"$PORT" >/dev/null 2>&1; then
  echo "Started. PID: $(cat "$PID_FILE")"
  echo "Log: $LOG_FILE"
  echo "URL: http://localhost:$PORT/"
else
  echo "Failed to start. Check log: $LOG_FILE" >&2
  exit 1
fi
