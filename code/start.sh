#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-5173}"

# 默认空, 修改此配置可切换数据源后缀，例如改为 "_bac" 将加载以 _bac.md 结尾的文件
DATA_SUFFIX="${DATA_SUFFIX:-}" 
export DATA_SUFFIX
echo "DATA_SUFFIX: $DATA_SUFFIX"

PID_FILE="$SCRIPT_DIR/.resume-editor.pid"
LOG_FILE="$SCRIPT_DIR/.resume-editor.log"

cd "$SCRIPT_DIR"

echo "Stopping existing resume editor on port $PORT..."
"$SCRIPT_DIR/stop.sh" "$PORT" || true

if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Building resume editor..."
npm run build

echo "Starting resume editor on http://localhost:$PORT/ ..."
nohup node "$SCRIPT_DIR/server.mjs" "$PORT" "$SCRIPT_DIR/dist" > "$LOG_FILE" 2>&1 &
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
