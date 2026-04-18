# SkyHarmony Hosting Guide

## Indigenous-Friendly, Sovereign Infrastructure

SkyHarmony is designed to be hosted on infrastructure that respects indigenous data sovereignty principles. This guide covers deploying on self-owned hardware, community-controlled cloud, and indigenous-operated data centers — avoiding dependency on Big Tech cloud platforms.

---

## Principles

### Te Tino Rangatiratanga (Self-Determination)

Data sovereignty means communities control where their data lives, who can access it, and how it's governed. SkyHarmony is built **cloud-agnostic** — no AWS, GCP, or Azure SDKs — so it runs on any infrastructure you choose.

### Why This Matters for Drone Operations

- **Fleet data** contains GPS coordinates, flight paths, and operational patterns
- **Financial data** reveals operator revenue and business relationships
- **Custody records** create legal chains of accountability
- **User data** includes personal information of operators and staff

All of this should live on infrastructure the cooperative controls.

---

## Option 1: Self-Hosted on NAS (Recommended for Demo/Small Scale)

### Synology NAS Setup

SkyHarmony runs on a Synology NAS with Docker support (DS220+, DS920+, DS1621+, or similar).

**Requirements:**
- Synology NAS with Docker/Container Manager package
- 4GB+ RAM
- 10GB+ storage
- Network access on port 50080

**Steps:**

1. Install **Container Manager** from Synology Package Center

2. Create a project directory:
   ```
   /volume1/docker/skyharmony/
   ```

3. Upload the repository files (or clone via SSH):
   ```bash
   ssh admin@your-nas-ip
   cd /volume1/docker
   git clone <repo-url> skyharmony
   cd skyharmony/skyharmony-drone-broker
   ```

4. Start the stack:
   ```bash
   docker compose up -d
   ```

5. Access at `http://your-nas-ip:50080`

**Synology-specific notes:**
- Use Container Manager's "Project" feature for a GUI experience
- Set the project to auto-restart on NAS reboot
- PostgreSQL data persists in a Docker volume (`pgdata`)
- Backup the volume via Hyper Backup

### Other NAS Platforms

- **QNAP:** Install Container Station, same Docker Compose workflow
- **Unraid:** Use Docker Compose plugin or Portainer
- **TrueNAS SCALE:** Native Docker Compose support

---

## Option 2: Indigenous-Operated Cloud

### Aotearoa / New Zealand

- **Catalyst Cloud** (catalyst.net.nz) — NZ-owned and operated, data stays in NZ, Maori data sovereignty aligned. Run Docker on their compute instances.

- **2degrees Cloud** — NZ-headquartered, domestic data centers

### Australia

- **AUCloud** (aucloud.com.au) — Australian sovereign cloud, government-certified, indigenous data sovereignty focus

- **Vault Cloud** — Canberra-based, security-cleared

### North America

- **Indigenous-owned hosting cooperatives** — Contact First Nations Technology Council (FNTC) or National Digital Inclusion Alliance for referrals

- **Community networks** — Many tribal communities operate their own data centers. The U.S. Department of the Interior's Tribal Broadband Connectivity Program supports indigenous infrastructure.

### General Cloud-Agnostic Deployment

Any VPS or bare metal server with Docker works:

```bash
# On any Ubuntu/Debian server
sudo apt update && sudo apt install docker.io docker-compose-plugin
git clone <repo-url>
cd skyharmony-drone-broker
docker compose up -d
```

---

## Option 3: Bare Metal / Community Server

For cooperatives that want to run on their own hardware.

### Minimum Hardware

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB SSD | 100 GB SSD |
| Network | 10 Mbps | 100 Mbps |
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

### Installation

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone and start
git clone <repo-url>
cd skyharmony-drone-broker
docker compose up -d
```

### HTTPS with Let's Encrypt

For production, add a reverse proxy with TLS:

```bash
# Install Caddy (automatic HTTPS)
sudo apt install caddy

# /etc/caddy/Caddyfile
skyharmony.yourdomain.com {
    reverse_proxy localhost:50080
}

sudo systemctl reload caddy
```

---

## Production Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://skyharmony:skyharmony_dev@db:5432/skyharmony` | PostgreSQL connection string |
| `JWT_SECRET` | `skyharmony-dev-secret` | **Change this in production!** Use a 64+ character random string |
| `PORT` | `4000` | API server port |
| `NODE_ENV` | `development` | Set to `production` for production |

### Generating a Secure JWT Secret

```bash
openssl rand -base64 64
```

### Production docker-compose.override.yml

Create this file next to `docker-compose.yml`:

```yaml
services:
  db:
    environment:
      POSTGRES_PASSWORD: <generate-a-strong-password>
    volumes:
      - /path/to/persistent/storage:/var/lib/postgresql/data

  api:
    environment:
      DATABASE_URL: postgres://skyharmony:<strong-password>@db:5432/skyharmony
      JWT_SECRET: <your-64-char-secret>
      NODE_ENV: production
    restart: always

  app:
    restart: always
```

### Backup Strategy

```bash
# Daily database backup (add to cron)
0 2 * * * docker compose exec -T db pg_dump -U skyharmony skyharmony | gzip > /backups/skyharmony-$(date +\%Y\%m\%d).sql.gz

# Keep 30 days of backups
find /backups -name "skyharmony-*.sql.gz" -mtime +30 -delete
```

### Health Monitoring

```bash
# Simple health check script
#!/bin/bash
STATUS=$(curl -s http://localhost:4000/api/health | python3 -c "import json,sys; print(json.load(sys.stdin)['data']['status'])" 2>/dev/null)
if [ "$STATUS" != "ok" ]; then
  echo "SkyHarmony is DOWN" | mail -s "Alert" admin@yourdomain.com
  docker compose restart api
fi
```

---

## Data Sovereignty Checklist

Before deploying, verify:

- [ ] **Data location:** Do you know which country/territory your data physically resides in?
- [ ] **Access control:** Only authorized cooperative members can access the server
- [ ] **Encryption:** HTTPS enabled for all external access (Caddy, nginx, or NAS built-in)
- [ ] **Backups:** Automated daily backups stored in a location you control
- [ ] **JWT secret:** Changed from default; stored securely, not in version control
- [ ] **Database password:** Changed from default `skyharmony_dev`
- [ ] **No external dependencies:** SkyHarmony makes zero external API calls — all data is self-contained
- [ ] **Governance agreement:** Cooperative governance document defines data ownership, access rights, and deletion procedures
- [ ] **Indigenous data principles:** Reviewed against local indigenous data sovereignty frameworks (e.g., Te Mana Raraunga in NZ, CARE Principles internationally)

### CARE Principles for Indigenous Data Governance

SkyHarmony's architecture supports the [CARE Principles](https://www.gida-global.org/care):

| Principle | How SkyHarmony Supports It |
|-----------|---------------------------|
| **Collective Benefit** | Revenue is transparently calculated and split across the cooperative |
| **Authority to Control** | Self-hosted — no cloud vendor has access to your data |
| **Responsibility** | RBAC ensures only authorized roles access sensitive data |
| **Ethics** | Audit trail records all asset status changes and custody events |

---

## Network Architecture

```
Internet
    │
    ├── HTTPS (443) ──→ Reverse Proxy (Caddy/nginx)
    │                        │
    │                        ├── :50080 → Frontend (React SPA)
    │                        └── :4000  → API (Express)
    │                                        │
    │                                        └── :5432 → PostgreSQL
    │
    └── No outbound calls (fully self-contained)
```

**Important:** SkyHarmony makes **zero outbound network calls**. No analytics, no telemetry, no CDN, no external fonts. Everything runs locally. This is by design for data sovereignty.

---

## Support

For help with indigenous-friendly hosting:

- **Island Pitch LLC** — hosting@skyharmony.dev
- **First Nations Technology Council** — fntc.info
- **Te Mana Raraunga** (NZ Maori Data Sovereignty Network) — temanararaunga.maori.nz
- **Global Indigenous Data Alliance** — gida-global.org
