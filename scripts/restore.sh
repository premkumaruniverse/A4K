#!/usr/bin/env bash
# restore.sh — Restore PostgreSQL from a backup file
# Usage: ./scripts/restore.sh /opt/a4k/backups/postgres_20240101_020000.sql.gz
set -euo pipefail

APP_DIR="/opt/a4k"
BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    echo "Usage: $0 <path-to-backup.sql.gz>"
    echo "Available backups:"
    ls -lh "${APP_DIR}/backups/"
    exit 1
fi

source "${APP_DIR}/production.env"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "⚠️  This will OVERWRITE the current database '${POSTGRES_DB}'. Press Ctrl+C within 5s to abort."
sleep 5

log "Stopping backend to prevent writes..."
docker compose -f "${APP_DIR}/docker-compose.production.yml" \
    --env-file "${APP_DIR}/production.env" stop backend

log "Dropping and recreating database..."
docker compose -f "${APP_DIR}/docker-compose.production.yml" \
    --env-file "${APP_DIR}/production.env" \
    exec -T postgres \
    psql -U "${POSTGRES_USER}" -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"

docker compose -f "${APP_DIR}/docker-compose.production.yml" \
    --env-file "${APP_DIR}/production.env" \
    exec -T postgres \
    psql -U "${POSTGRES_USER}" -c "CREATE DATABASE ${POSTGRES_DB};"

log "Restoring from ${BACKUP_FILE}..."
gunzip -c "$BACKUP_FILE" | \
    docker compose -f "${APP_DIR}/docker-compose.production.yml" \
    --env-file "${APP_DIR}/production.env" \
    exec -T postgres \
    psql -U "${POSTGRES_USER}" "${POSTGRES_DB}"

log "Restarting backend..."
docker compose -f "${APP_DIR}/docker-compose.production.yml" \
    --env-file "${APP_DIR}/production.env" start backend

log "✅ Restore complete from: ${BACKUP_FILE}"
