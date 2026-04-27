# SkyHarmony Disaster Recovery Runbook

**Last updated:** 2026-04-27
**RTO target:** < 1 hour
**RPO target:** < 24 hours (daily backups)

---

## Backup System

Automated daily pg_dump via Docker sidecar container (`skyharmony-backup`).

- **Schedule:** Daily at 3:00 AM UTC (configurable via `BACKUP_SCHEDULE`)
- **Location:** Docker volume `backups` (mounted at `/backups` inside container)
- **Retention:** 30 daily + 52 weekly backups
- **Format:** Compressed SQL (`pg_dump --clean --if-exists | gzip`)

### Check Backup Status

```bash
# On the NAS
docker exec skyharmony-backup cat /backups/.last_backup

# List available backups
docker exec skyharmony-backup ls -lh /backups/daily/
docker exec skyharmony-backup ls -lh /backups/weekly/
```

### Run Manual Backup

```bash
docker exec skyharmony-backup sh /scripts/backup.sh
```

### Copy Backup Off-NAS

```bash
# From your local machine
docker exec skyharmony-backup cat /backups/latest.sql.gz > ~/skyharmony-backup.sql.gz
# Or via SSH
ssh islandpitch@192.168.4.235 "docker exec skyharmony-backup cat /backups/latest.sql.gz" > ~/skyharmony-backup.sql.gz
```

---

## Scenario 1: NAS Hardware Failure

**Symptoms:** NAS unreachable, skyharmony.net down.

### Recovery Steps

1. **Get a backup file** — from off-site copy, or if NAS disk is recoverable, mount and extract from Docker volume.

2. **Provision a new host** (any Linux with Docker):
   ```bash
   git clone https://github.com/Island-Pitch/skyharmony-drone-broker.git
   cd skyharmony-drone-broker
   ```

3. **Create `.env`** with production values:
   ```bash
   POSTGRES_PASSWORD=<new-strong-password>
   JWT_SECRET=<new-random-secret>
   SEED_DATA=false
   ```

4. **Start the stack:**
   ```bash
   docker compose up -d
   ```

5. **Restore the backup:**
   ```bash
   # Copy backup into the backup container
   docker cp ~/skyharmony-backup.sql.gz skyharmony-backup:/backups/restore.sql.gz

   # Restore
   docker exec skyharmony-backup sh /scripts/restore.sh /backups/restore.sql.gz
   ```

6. **Update DNS** — Point `skyharmony.net` A record to the new host's public IP.

7. **Verify:**
   ```bash
   curl https://skyharmony.net/api/health
   ```

**Estimated time:** 30-60 minutes (mostly Docker build time).

---

## Scenario 2: Migration to New Hosting

**Reason:** Moving off Synology NAS to VPS, dedicated server, or another NAS.

### Steps

1. **Backup current DB:**
   ```bash
   ssh islandpitch@192.168.4.235 "docker exec skyharmony-backup sh /scripts/backup.sh"
   ssh islandpitch@192.168.4.235 "docker exec skyharmony-backup cat /backups/latest.sql.gz" > migration-backup.sql.gz
   ```

2. **On new host:**
   ```bash
   git clone https://github.com/Island-Pitch/skyharmony-drone-broker.git
   cd skyharmony-drone-broker
   # Copy .env.synology or create new .env
   docker compose up -d
   # Wait for DB healthy, then restore
   docker cp migration-backup.sql.gz skyharmony-backup:/backups/restore.sql.gz
   docker exec skyharmony-backup sh /scripts/restore.sh /backups/restore.sql.gz
   ```

3. **Update DNS** — Change A record. TTL is typically 300s, so propagation is fast.

4. **SSL** — If using Let's Encrypt, the new host needs its own cert. Set up Caddy, nginx + certbot, or your reverse proxy.

5. **Decommission old host** after verifying everything works.

---

## Scenario 3: Security Compromise

**Symptoms:** Unauthorized access, data exfiltration, defacement.

### Immediate Response (first 15 minutes)

1. **Stop the application** (limit exposure):
   ```bash
   ssh islandpitch@192.168.4.235 "docker stop skyharmony-api skyharmony-app"
   ```

2. **Preserve evidence** — do NOT destroy containers or volumes yet:
   ```bash
   # Capture logs
   ssh islandpitch@192.168.4.235 "docker logs skyharmony-api" > incident-api-logs.txt
   # Backup current DB state
   ssh islandpitch@192.168.4.235 "docker exec skyharmony-backup sh /scripts/backup.sh"
   ```

3. **Rotate secrets:**
   - Generate new `JWT_SECRET` (invalidates all active sessions)
   - Generate new `POSTGRES_PASSWORD`
   - Rotate any API keys (PostHog, SMTP)

4. **Review audit events:**
   ```bash
   ssh islandpitch@192.168.4.235 "docker exec skyharmony-db psql -U skyharmony -c \"
     SELECT * FROM audit_events ORDER BY changed_at DESC LIMIT 50;
   \""
   ```

### Recovery

5. **Restore from last known-good backup** (before compromise date):
   ```bash
   docker exec skyharmony-backup sh /scripts/restore.sh /backups/daily/skyharmony_YYYYMMDD_HHMMSS.sql.gz
   ```

6. **Force password reset for all users:**
   ```bash
   docker exec skyharmony-db psql -U skyharmony -c "
     UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL;
   "
   ```

7. **Rebuild and redeploy** with patched code:
   ```bash
   ./scripts/deploy.sh rebuild
   ```

8. **Post-incident:** Document the incident, review access controls, update this runbook.

---

## Scenario 4: Traffic Spike / Resource Exhaustion

**Symptoms:** Slow responses, 502/503 errors, high CPU/memory on NAS.

### Immediate Mitigation

1. **Check container resource usage:**
   ```bash
   ssh islandpitch@192.168.4.235 "docker stats --no-stream"
   ```

2. **Rate limiting is already active** (100 req/min global, 5 req/min auth). Check if it's being triggered:
   ```bash
   ssh islandpitch@192.168.4.235 "docker logs skyharmony-api --since 5m" | grep "429\|Too many"
   ```

3. **Restart the API** if it's in a bad state:
   ```bash
   ssh islandpitch@192.168.4.235 "docker restart skyharmony-api"
   ```

4. **If under DDoS** — Add Cloudflare (free tier) in front of skyharmony.net:
   - Change DNS to Cloudflare nameservers
   - Enable "Under Attack" mode
   - Cloudflare proxies traffic and absorbs the attack

### Longer-term

- Add container resource limits in docker-compose (CPU, memory)
- Add PgBouncer for connection pooling
- Consider CDN for static frontend assets

---

## Key Information

| Item | Value |
|------|-------|
| NAS hostname | `harbor` / `192.168.4.235` |
| NAS Tailscale IP | `100.76.87.65` |
| SSH user | `islandpitch` |
| Deploy path | `/volume1/docker_1/skyharmony` |
| Domain | `skyharmony.net` |
| Git repo | `Island-Pitch/skyharmony-drone-broker` |
| Docker containers | `skyharmony-db`, `skyharmony-api`, `skyharmony-app`, `skyharmony-backup` |
| DB credentials | In `.env.synology` (gitignored) |

## Recovery Checklist

- [ ] Backup file obtained
- [ ] New host provisioned (if needed)
- [ ] Docker stack running
- [ ] Database restored
- [ ] DNS updated (if host changed)
- [ ] SSL working
- [ ] API health check passes
- [ ] Frontend loads
- [ ] Login works
- [ ] Existing data verified
