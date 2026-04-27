#!/usr/bin/env sh
set -eu

# SkyHarmony Database Restore Script
# Restores a pg_dump backup into the running Postgres container.
#
# Usage:
#   ./restore.sh <backup_file.sql.gz>
#   ./restore.sh latest              # restores the most recent backup
#
# Environment variables:
#   PGHOST     - Postgres host (default: db)
#   PGPORT     - Postgres port (default: 5432)
#   PGUSER     - Postgres user (default: skyharmony)
#   PGPASSWORD - Postgres password (required)
#   PGDATABASE - Database name (default: skyharmony)
#   BACKUP_DIR - Where backups are stored (default: /backups)

PGHOST="${PGHOST:-db}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-skyharmony}"
PGDATABASE="${PGDATABASE:-skyharmony}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

log() { echo "[restore] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_file.sql.gz | latest>"
  echo ""
  echo "Available backups:"
  ls -lh "$BACKUP_DIR/daily/" 2>/dev/null || echo "  No daily backups found"
  ls -lh "$BACKUP_DIR/weekly/" 2>/dev/null || echo "  No weekly backups found"
  exit 1
fi

BACKUP_FILE="$1"

if [ "$BACKUP_FILE" = "latest" ]; then
  BACKUP_FILE="$BACKUP_DIR/latest.sql.gz"
  if [ ! -f "$BACKUP_FILE" ]; then
    log "ERROR: No latest backup found at $BACKUP_FILE"
    exit 1
  fi
fi

if [ ! -f "$BACKUP_FILE" ]; then
  log "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Restoring from $BACKUP_FILE ($SIZE)"
log "WARNING: This will overwrite all data in $PGDATABASE"

# Restore
TMP_SQL="$(mktemp)"
trap 'rm -f "$TMP_SQL"' EXIT INT TERM

if ! gunzip -c "$BACKUP_FILE" >"$TMP_SQL"; then
  log "ERROR: Failed to decompress backup file: $BACKUP_FILE"
  exit 1
fi

if psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" --single-transaction -q <"$TMP_SQL"; then
  log "Restore complete"
else
  log "ERROR: Restore failed"
  exit 1
fi
