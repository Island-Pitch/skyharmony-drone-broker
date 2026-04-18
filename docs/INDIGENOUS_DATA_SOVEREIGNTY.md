# SkyHarmony — Indigenous Data Sovereignty Adoption Plan

## Te Mana Raraunga Alignment

SkyHarmony formally adopts the principles of **Te Mana Raraunga** (Maori Data Sovereignty Network) as our data governance framework.

> *"Our data, our sovereignty, our future."*
> — Te Mana Raraunga

### What is Maori Data Sovereignty?

- **Data Sovereignty** — Data is subject to the laws of the nation where it is stored
- **Indigenous Data Sovereignty** — Data remains subject to the laws of the nation from which it originates
- **Maori Data Sovereignty** — Maori data should be subject to Maori governance, supporting tribal sovereignty and iwi aspirations

Data is a living taonga (treasure) of strategic value. It tells the story of whakapapa (genealogy and origins). SkyHarmony treats all cooperative data — fleet records, custody chains, billing, operator relationships — as taonga held in trust.

### Te Mana Raraunga Core Principles Applied to SkyHarmony

| TMR Principle | SkyHarmony Implementation |
|--------------|--------------------------|
| **Assert Maori rights and interests in data** | Operators own their data. RBAC ensures each operator controls access to their fleet, bookings, and billing. No operator can see another's data. |
| **Safeguard and protect data** | Zero outbound network calls. Self-hosted on operator-controlled infrastructure. Encrypted at rest (PostgreSQL) and in transit (HTTPS). |
| **Ensure quality and integrity** | Audit trail on every asset status change, custody event, and terms modification. Immutable event log. |
| **Advocate for governance involvement** | Uniform Terms Enforcement — all cooperative decisions are transparent, versioned, and auditable. No hidden per-partner deals. |
| **Support data infrastructure and security** | Cloud-agnostic Docker deployment. Can run on NAS, bare metal, or sovereign cloud. No vendor lock-in. |
| **Advance sustainable digital businesses** | Transparent billing from real data. Fair allocation. Cooperative economics where every operator contributes and benefits. |

---

## CARE Principles Compliance

SkyHarmony also aligns with the **CARE Principles for Indigenous Data Governance** (Global Indigenous Data Alliance):

### C — Collective Benefit

- Revenue is transparently calculated from real booking data and split across the cooperative
- Allocation engine enforces fair, uniform distribution — no favoritism
- Insurance pool (7%) protects all operators collectively
- Demand forecasting benefits the entire cooperative, not individual actors

### A — Authority to Control

- **Self-hosted infrastructure** — no cloud vendor has access to cooperative data
- **Operator-scoped RBAC** — each operator controls their own fleet, bookings, billing
- **Data portability** — PostgreSQL with standard SQL, exportable via pg_dump at any time
- **No external dependencies** — zero outbound API calls, no telemetry, no analytics sent to third parties

### R — Responsibility

- **Audit trail** — every status change, custody event, terms modification, and incident is logged with actor, timestamp, and old/new values
- **Uniform Terms** — cooperative governance applied equally to all partners, changes audited
- **Incident reporting** — critical damage auto-grounds equipment for safety, creates maintenance ticket
- **Maintenance triggers** — rule-based thresholds protect equipment and operators from unsafe operations

### E — Ethics

- **Transparent billing** — allocation fees, standby fees, and insurance calculated from real data, visible to all parties
- **No hidden data collection** — platform collects only what's needed for fleet coordination
- **Privacy by design** — legal pages (Privacy Policy, Terms, Accessibility) built into the platform
- **Cultural respect** — Maori design elements (koru, kowhaiwhai) used with intention, not decoration

---

## Sovereign Infrastructure Options

### Recommended: Self-Hosted (Current Default)

SkyHarmony runs on **Docker Compose** with zero cloud dependencies:

```
PostgreSQL 16 (data) → Express API (logic) → React SPA (UI)
```

All three containers run on a single machine. Data never leaves the operator's network.

**Deployment options:**
- Synology/QNAP NAS (current demo: port 50080)
- Bare metal server (Ubuntu 22.04+)
- Any VPS with Docker support

### Sovereign Cloud Providers (Evaluated)

| Provider | Region | Sovereignty | Docker Support | Status |
|----------|--------|-------------|---------------|--------|
| **Catalyst Cloud** | Aotearoa NZ | NZ-owned, NZ data centers | Yes (OpenStack) | Recommended for NZ operators |
| **AUCloud → AUCyber** | Australia | AU-sovereign, IRAP certified | Yes | Rebranded to AUCyber, security-focused |
| **Tribal Broadband** | USA | Indigenous community networks | Varies | Infrastructure grants available via NTIA |
| **Okanagan Nation** | Canada | First Nations operated | Custom | Example of indigenous-owned data center |

### Providers to Avoid

Per Te Mana Raraunga principles, avoid providers where:
- Data is stored outside the cooperative's jurisdiction without consent
- The provider has access to unencrypted data
- Terms allow the provider to use data for their own purposes
- No clear data deletion/portability guarantee exists

This typically means avoiding hyperscale cloud (AWS, GCP, Azure) for primary data storage unless the cooperative explicitly consents and understands the jurisdiction implications.

---

## Data Classification

| Data Type | Sensitivity | Sovereignty Requirement |
|-----------|------------|------------------------|
| Fleet asset records | Medium | Must stay in cooperative infrastructure |
| Custody chain events | High | Immutable audit trail, never externally accessible |
| Billing/financial | High | Operator-scoped, encrypted at rest |
| User credentials | Critical | bcrypt hashed, never logged, never exported |
| Booking details | Medium | Operator-scoped, cooperative-visible for allocation |
| Incident reports | High | Linked to assets + operators, privacy-sensitive |
| Telemetry data | Medium | Machine-generated, may be shared with manufacturer (Verge Aero) per agreement |

---

## Implementation Checklist

### Already Implemented

- [x] Zero outbound network calls
- [x] Self-hosted Docker deployment
- [x] Operator-scoped RBAC on every API endpoint
- [x] Audit trail on asset status changes, custody events, terms changes
- [x] Uniform Terms Enforcement (no per-partner overrides)
- [x] JWT auth with bcrypt password hashing
- [x] Privacy Policy, Terms of Service, Accessibility pages
- [x] Data exportable via pg_dump
- [x] No external analytics, telemetry, or tracking

### To Implement (Phase 2)

- [ ] **Data retention policy** — configurable per data type (e.g., audit logs 7 years, sessions 90 days)
- [ ] **Data deletion workflow** — operator can request full account + data deletion
- [ ] **Encryption at rest** — PostgreSQL TDE or filesystem encryption
- [ ] **Data export API** — GET /api/operator/export returns all operator data as JSON/CSV
- [ ] **Consent management** — explicit consent for data sharing between operators in the cooperative
- [ ] **Annual sovereignty audit** — checklist reviewed yearly against Te Mana Raraunga principles

### To Implement (Phase 3)

- [ ] **Federated deployment** — each operator runs their own instance, federated via API for cooperative booking
- [ ] **End-to-end encryption** — sensitive fields encrypted with operator-held keys
- [ ] **Sovereign DNS** — cooperative-owned domain with DNSSEC
- [ ] **Indigenous advisory board** — governance body reviewing data practices

---

## References

- **Te Mana Raraunga** — [temanararaunga.maori.nz](https://www.temanararaunga.maori.nz/) — Maori Data Sovereignty Network, est. 2015
- **CARE Principles** — [gida-global.org/care](https://www.gida-global.org/care) — Collective Benefit, Authority to Control, Responsibility, Ethics
- **UN Declaration on the Rights of Indigenous Peoples** (UNDRIP) — Articles 3, 4, 5, 15, 31 (self-determination, cultural heritage, data rights)
- **Treaty of Waitangi / Te Tiriti o Waitangi** — Partnership, participation, and protection principles
- **Catalyst Cloud** — [catalyst.net.nz](https://catalyst.net.nz) — NZ-sovereign cloud
- **Tribal Broadband Connectivity Program** — [ntia.gov](https://broadbandusa.ntia.gov/tribal-broadband-connectivity-program) — US indigenous infrastructure grants

---

*This document is a living commitment. It will be reviewed annually and updated as the cooperative's data governance practices mature.*

*Prepared in the spirit of manaakitanga — caring for the data as we care for each other.*
