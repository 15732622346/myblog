#!/bin/bash
APP_DIR="$(cd "$(dirname "$0")" && pwd)"

export NODE_ENV=production
cd "$APP_DIR"

LOG_DIR="$APP_DIR/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"
echo "[$TIMESTAMP] Starting blogcurd backend..." >> "$LOG_DIR/start.log"

node dist/main.js >> "$LOG_DIR/app.log" 2>&1

