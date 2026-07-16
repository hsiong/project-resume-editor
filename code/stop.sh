#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-${PORT:-5173}}"
PID_FILE="$SCRIPT_DIR/.resume-editor.pid"

stop_pid() {
  local pid="$1"
  if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid" >/dev/null 2>&1 || true
  fi
}

if [ -f "$PID_FILE" ]; then
  stop_pid "$(cat "$PID_FILE")"
  rm -f "$PID_FILE"
fi

PORT_PIDS="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
if [ -n "$PORT_PIDS" ]; then
  echo "$PORT_PIDS" | xargs kill >/dev/null 2>&1 || true
  sleep 1
fi

PORT_PIDS="$(lsof -ti tcp:"$PORT" 2>/dev/null || true)"
if [ -n "$PORT_PIDS" ]; then
  echo "$PORT_PIDS" | xargs kill -9 >/dev/null 2>&1 || true
fi

echo "Stopped resume editor on port $PORT."
