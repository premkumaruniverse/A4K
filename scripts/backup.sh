#!/usr/bin/env bash
# backup.sh — PostgreSQL daily backup with 30-day retention
# Recommended cron: 0 2 * * * /opt/a4k/scripts/backup.sh >> /var/log/a4k-backup.log 2>&1
set -euo pipefail

APP_DIR="/opt/a4k"
BACKUP_DIR="/opt/a4k/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/postgres_${TIMESTAMP}.sql.gz"

source "${APP_DIR}/production.env"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

mkdir -p "$BACKUP_DIR"

log "Starting backup → ${BACKUP_FILE}"

docker compose -f "${APP_DIR}/docker-compose.production.yml" \
    --env-file "${APP_DIR}/production.env" \
    exec -T postgres \
    pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" \
    | gzip > "${BACKUP_FILE}"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
log "Backup complete. Size: ${SIZE}"

# ── Retention: delete backups older than RETENTION_DAYS ──────────────────────
DELETED=$(find "$BACKUP_DIR" -name "postgres_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print -delete | wc -l)
log "Deleted ${DELETED} backup(s) older than ${RETENTION_DAYS} days"

log "✅ Done"
