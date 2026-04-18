# SkyHarmony Admin Guide

## Platform Administration

This guide is for users with the **CentralRepoAdmin** role who manage the SkyHarmony cooperative.

---

## Admin Responsibilities

### 1. Fleet Oversight

As admin, you see **all assets across all operators** — 1,500+ drones, batteries, chargers, and base stations.

**Dashboard KPIs to monitor:**
- **Utilization %** — (Allocated + In Transit) / (Total - Retired). Target: 60-80% for healthy operations.
- **Maintenance rate** — If >10% of fleet is in maintenance, investigate root cause.
- **Firmware drift** — Maintenance alerts flag drones running outdated firmware.

### 2. Booking Management

**Approval workflow:**
1. Operators submit booking requests (status: Pending)
2. Admin reviews in **Bookings → Admin Queue**
3. Click **Approve** → status moves to Allocated
4. After operator confirms → status moves to Confirmed
5. After show completes → status moves to Completed

**What to check before approving:**
- Does the operator have enough fleet contribution to justify the request?
- Are the dates conflict-free? (Allocation engine checks this automatically)
- Is the drone count reasonable for the venue?

### 3. Allocation

Navigate to **Allocation** to run the allocation engine:
- The engine finds available drones for a booking's date range
- Excludes drones already allocated, in maintenance, or retired
- Assigns deterministically (by serial number) for fairness
- If insufficient drones: shows shortfall count + 3 alternative dates

### 4. Incident Resolution

Navigate to **Incidents → Incident Queue**:
- Critical incidents auto-ground the drone (status → Maintenance)
- Review each incident, add resolution notes, click **Resolve**
- Only admins can resolve incidents

### 5. Billing Oversight

Navigate to **Billing** to see cooperative-wide revenue:
- $350/drone allocation fee per booking
- $150/drone standby fee for pending reservations
- 7% insurance pool contribution
- Per-operator revenue breakdown with bar chart visualization

---

## User Management

### Default Accounts (from seed data)

| Email | Password | Role | Organization |
|-------|----------|------|-------------|
| admin@skyharmony.dev | admin123 | CentralRepoAdmin | System |
| nightbrite.drones@skyharmony.dev | operator123 | OperatorAdmin | NightBrite Drones |
| orion.skies@skyharmony.dev | operator123 | OperatorAdmin | Orion Skies |
| vegas.drone.works@skyharmony.dev | operator123 | OperatorAdmin | Vegas Drone Works |
| patriotic.air@skyharmony.dev | operator123 | OperatorAdmin | Patriotic Air |
| sky.harmony.fleet@skyharmony.dev | operator123 | OperatorAdmin | Sky Harmony Fleet |

### Role Permissions Matrix

| Permission | Admin | Fleet Owner | Operator | Logistics |
|-----------|-------|-------------|----------|-----------|
| View all fleet | Yes | Own only | Own only | Own only |
| Create assets | Yes | No | No | No |
| Delete assets | Yes | No | No | No |
| Create bookings | Yes | Yes | Yes | No |
| Approve bookings | Yes | No | No | No |
| View billing | Yes | Own only | No | No |
| Allocate drones | Yes | No | No | No |
| Scan check-in/out | Yes | Yes | Yes | Yes |
| Report incidents | Yes | Yes | Yes | No |
| Resolve incidents | Yes | No | No | No |

### New User Registration

New users self-register at `/login` → Sign up. The onboarding wizard collects:
1. Role selection (determines permissions)
2. Organization name and region
3. Fleet size (fleet owners only)

New users default to **OperatorStaff** role. Admins can update roles via direct database access (API endpoint for user management is planned for a future release).

---

## Database Administration

### Connecting to PostgreSQL

```bash
# Via Docker
docker compose exec db psql -U skyharmony -d skyharmony

# Direct connection
psql postgres://skyharmony:skyharmony_dev@localhost:5432/skyharmony
```

### Useful Queries

```sql
-- Fleet summary by status
SELECT status, COUNT(*) FROM assets GROUP BY status ORDER BY count DESC;

-- Revenue by operator
SELECT operator_name, SUM(drone_count) as total_drones,
       SUM(drone_count * 350) as allocation_revenue
FROM bookings
WHERE status IN ('allocated', 'confirmed', 'completed')
GROUP BY operator_name ORDER BY allocation_revenue DESC;

-- Active users
SELECT name, email, role, organization, created_at
FROM users ORDER BY created_at DESC;

-- Incidents by severity
SELECT severity, status, COUNT(*) FROM incidents
GROUP BY severity, status ORDER BY severity, status;
```

### Backup & Restore

```bash
# Backup
docker compose exec db pg_dump -U skyharmony skyharmony > backup.sql

# Restore
docker compose exec -T db psql -U skyharmony skyharmony < backup.sql
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:4000/api/health
# Returns: { "data": { "status": "ok", "db": "connected", "timestamp": "..." } }
```

### Docker Status

```bash
docker compose ps          # Service status
docker compose logs api    # API logs
docker compose logs db     # PostgreSQL logs
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Loading summary..." on dashboard | API not running or JWT expired | Restart API, re-login |
| "No assets in catalog" | API auth failure or empty DB | Check token, run seed |
| Login returns "Invalid credentials" | Wrong password or user doesn't exist | Check email, reset via DB |
| Docker compose fails | Port conflict | Check 5432, 4000, 50080 are free |
| Migrations fail | DB already has tables | Drop and recreate: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` |
