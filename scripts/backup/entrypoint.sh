#!/usr/bin/env sh
set -eu

# Backup sidecar entrypoint
# Runs backup.sh on a schedule using crond.
# BACKUP_SCHEDULE defaults to daily at 3:00 AM UTC.

BACKUP_SCHEDULE="${BACKUP_SCHEDULE:-0 3 * * *}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "[backup-sidecar] Starting with schedule: $BACKUP_SCHEDULE"

# Cron jobs don't reliably inherit Docker env; persist what backup needs.
ENV_FILE="/etc/backup-env.sh"
umask 077
: > "$ENV_FILE"
for VAR in PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE BACKUP_DIR RETAIN_DAYS RETAIN_WEEKS; do
  if printenv "$VAR" >/dev/null 2>&1; then
    VAL="$(printenv "$VAR")"
    ESCAPED="$(printf "%s" "$VAL" | sed "s/'/'\"'\"'/g")"
    printf "export %s='%s'\n" "$VAR" "$ESCAPED" >> "$ENV_FILE"
  fi
done
chmod 600 "$ENV_FILE"

# Run an initial backup on startup
echo "[backup-sidecar] Running initial backup..."
sh "$SCRIPT_DIR/backup.sh" || echo "[backup-sidecar] Initial backup failed (DB may not be ready yet)"

# Write crontab
echo "$BACKUP_SCHEDULE . $ENV_FILE; /bin/sh $SCRIPT_DIR/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

# Start crond in foreground
echo "[backup-sidecar] Cron daemon running"
exec crond -f -l 2
