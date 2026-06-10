#!/usr/bin/env bash
# Daily Postgres dump. Keeps the last 14 dumps locally.
# TODO before public launch: also upload off-server (rclone -> Backblaze B2 / Hetzner Storage Box).
set -euo pipefail

APP_DIR=/opt/zilobook/app
BACKUP_DIR=/opt/zilobook/backups
STAMP=$(date +%F_%H%M)

mkdir -p "$BACKUP_DIR"
docker compose -f "$APP_DIR/docker-compose.prod.yml" exec -T db \
  pg_dump -U zilobook zilobook | gzip > "$BACKUP_DIR/zilobook_$STAMP.sql.gz"

# Sanity check: a dump smaller than 1KB is almost certainly broken
if [ "$(stat -c%s "$BACKUP_DIR/zilobook_$STAMP.sql.gz")" -lt 1024 ]; then
  echo "WARNING: backup looks too small: zilobook_$STAMP.sql.gz" >&2
fi

ls -1t "$BACKUP_DIR"/zilobook_*.sql.gz | tail -n +15 | xargs -r rm
echo "OK: zilobook_$STAMP.sql.gz"
