#!/usr/bin/env sh
set -eu

# SkyHarmony Database Backup Script
# Runs inside the backup sidecar container alongside the Postgres container.
# Creates compressed pg_dump backups with configurable retention.
#
# Environment variables:
#   PGHOST       - Postgres host (default: db)
#   PGPORT       - Postgres port (default: 5432)
#   PGUSER       - Postgres user (default: skyharmony)
#   PGPASSWORD   - Postgres password (required)
#   PGDATABASE   - Database name (default: skyharmony)
#   BACKUP_DIR   - Where to store backups (default: /backups)
#   RETAIN_DAYS  - Keep daily backups for N days (default: 30)
#   RETAIN_WEEKS - Keep weekly backups for N weeks (default: 52)

PGHOST="${PGHOST:-db}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-skyharmony}"
PGDATABASE="${PGDATABASE:-skyharmony}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETAIN_DAYS="${RETAIN_DAYS:-30}"
RETAIN_WEEKS="${RETAIN_WEEKS:-52}"

TIMESTAMP=$(date -u +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date -u +%u)  # 1=Monday, 7=Sunday
DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
LATEST_LINK="$BACKUP_DIR/latest.sql.gz"
STATUS_FILE="$BACKUP_DIR/.last_backup"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR"

log() { echo "[backup] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }

# ── Run backup ──────────────────────────────────────────────────
BACKUP_FILE="$DAILY_DIR/skyharmony_${TIMESTAMP}.sql.gz"

log "Starting backup to $BACKUP_FILE"

TMP_SQL="$BACKUP_FILE.tmp.sql"
TMP_GZ="$BACKUP_FILE.tmp.gz"
rm -f "$TMP_SQL" "$TMP_GZ"

if pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" \
  --no-owner --no-privileges --clean --if-exists \
  > "$TMP_SQL" \
  && gzip -c "$TMP_SQL" > "$TMP_GZ" \
  && mv -f "$TMP_GZ" "$BACKUP_FILE"; then
  rm -f "$TMP_SQL"

  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log "Backup complete: $SIZE"

  # Update latest symlink
  ln -sf "$BACKUP_FILE" "$LATEST_LINK"

  # Write status for monitoring
  cat > "$STATUS_FILE" <<EOF
status=ok
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
file=$BACKUP_FILE
size=$SIZE
EOF

  # ── Weekly copy (every Sunday) ──────────────────────────────
  if [ "$DAY_OF_WEEK" = "7" ]; then
    WEEKLY_FILE="$WEEKLY_DIR/skyharmony_week_${TIMESTAMP}.sql.gz"
    cp "$BACKUP_FILE" "$WEEKLY_FILE"
    log "Weekly backup saved: $WEEKLY_FILE"
  fi

else
  log "ERROR: pg_dump failed"
  rm -f "$TMP_SQL" "$TMP_GZ"
  cat > "$STATUS_FILE" <<EOF
status=error
timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
error=pg_dump failed
EOF
  exit 1
fi

# ── Retention cleanup ─────────────────────────────────────────
log "Cleaning up old backups (daily: ${RETAIN_DAYS}d, weekly: ${RETAIN_WEEKS}w)"

# Delete daily backups older than RETAIN_DAYS
find "$DAILY_DIR" -name "skyharmony_*.sql.gz" -mtime +"$RETAIN_DAYS" -delete 2>/dev/null || true

# Delete weekly backups older than RETAIN_WEEKS (in days)
RETAIN_WEEKS_DAYS=$((RETAIN_WEEKS * 7))
find "$WEEKLY_DIR" -name "skyharmony_week_*.sql.gz" -mtime +"$RETAIN_WEEKS_DAYS" -delete 2>/dev/null || true

# Count remaining backups
DAILY_COUNT=$(find "$DAILY_DIR" -name "*.sql.gz" | wc -l | tr -d ' ')
WEEKLY_COUNT=$(find "$WEEKLY_DIR" -name "*.sql.gz" | wc -l | tr -d ' ')
log "Retention: $DAILY_COUNT daily, $WEEKLY_COUNT weekly backups on disk"

log "Done"
