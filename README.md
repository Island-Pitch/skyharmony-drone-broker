# SkyHarmony Drone Broker

**Where Technology Meets Tradition**

SkyHarmony is a cooperative drone fleet coordination and brokerage platform. It enables multiple drone operators to pool, book, allocate, and track drone assets for entertainment shows, commercial operations, and industrial applications.

Built with Maori-inspired design principles — koru (growth), whakarite (coordination), and manaakitanga (hospitality) — SkyHarmony honors indigenous values while delivering enterprise-grade fleet management.

## Quick Start

### Prerequisites

- [Node.js 22+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Development (full stack)

```bash
# 1. Start PostgreSQL
docker compose up db -d

# 2. Start the API server
cd api
npm install
npm run build
DATABASE_URL=postgres://skyharmony:skyharmony_dev@localhost:5432/skyharmony npx drizzle-kit migrate
DATABASE_URL=postgres://skyharmony:skyharmony_dev@localhost:5432/skyharmony npx tsx src/db/seed.ts
DATABASE_URL=postgres://skyharmony:skyharmony_dev@localhost:5432/skyharmony JWT_SECRET=skyharmony-dev-secret npm run dev

# 3. Start the frontend (new terminal)
cd ..
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Login: `admin@skyharmony.dev` / `admin123`

### Docker (one command)

```bash
docker compose up
```

App on port 50080, API on 4000, PostgreSQL on 5432. Auto-migrates and seeds on first boot.

## Architecture

```
skyharmony-drone-broker/
├── api/                    # Express 5 REST API (TypeScript)
│   ├── src/
│   │   ├── routes/         # 8 route modules (auth, fleet, bookings, billing, scan, allocation, incidents, health)
│   │   ├── db/             # Drizzle ORM schema, migrations, seed
│   │   └── middleware/     # JWT auth + Zod validation
│   └── drizzle/            # SQL migrations
├── src/                    # React 19 frontend (TypeScript + Vite)
│   ├── features/           # Feature modules (dashboard, fleet, bookings, billing, scan, allocation, incidents)
│   ├── auth/               # RBAC system (5 roles, 17 permissions)
│   ├── data/               # Data models (Zod), repositories (HTTP + in-memory)
│   ├── services/           # Business logic layer
│   ├── hooks/              # React hooks
│   ├── providers/          # DataProvider (auto-detects API vs demo mode)
│   ├── routing/            # Route registry with permission gating
│   └── theme/              # Maori-inspired CSS design system
├── e2e/                    # Playwright end-to-end tests
├── docs/                   # User, admin, developer, and hosting guides
└── docker-compose.yml      # PostgreSQL + API + App
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, React Router v7 |
| Backend | Express 5, TypeScript, Zod validation |
| Database | PostgreSQL 16, Drizzle ORM |
| Auth | JWT (bcrypt + jsonwebtoken) |
| Testing | Vitest + RTL (385 unit tests), Playwright (19 E2E tests) |
| Deployment | Docker Compose, cloud-agnostic |
| Design | Maori-inspired dark theme, koru iconography |

## User Roles

| Role | Description | Sees |
|------|-------------|------|
| **Platform Admin** | Manages the cooperative | All data, all operators, allocation, billing |
| **Fleet Owner** | Owns drones | Own fleet, own bookings, own billing |
| **Show Operator** | Coordinates drone shows | Own bookings, scan, incidents |
| **Logistics** | Transport & field ops | Scan check-in/out, manifests |

## Features

- **Fleet Management** — 1,500+ assets across operators with polymorphic types (drones, batteries, chargers, base stations)
- **Booking Flow** — Multi-step booking with state machine (pending → allocated → confirmed → completed)
- **Allocation Engine** — Availability checking, conflict detection, alternative date suggestions
- **QR Scan** — Check-in/check-out custody tracking with manifest reconciliation
- **Billing** — DB-calculated revenue: allocation fees ($350/drone), standby fees ($150/drone), 7% insurance pool
- **Incident Reporting** — Severity classification with auto-grounding on critical
- **Onboarding Wizard** — 4-step registration: role → organization → fleet → welcome
- **RBAC** — Operator-scoped data isolation, role-gated navigation, API-level enforcement

## Commands

```bash
# Frontend
npm run dev              # Vite dev server on :3000
npm run build            # Production build
npm run test             # Vitest (385 tests)
npm run lint             # ESLint
npm run type-check       # TypeScript strict mode

# API
cd api
npm run dev              # Express dev server on :4000 (tsx watch)
npm run build            # TypeScript compile
npm run db:generate      # Generate Drizzle migration
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database

# E2E
npx playwright test      # 19 Playwright tests

# Docker
docker compose up        # Full stack
docker compose up db -d  # PostgreSQL only
```

## Documentation

- [User Guide](docs/USER_GUIDE.md) — For operators and staff using the platform
- [Admin Guide](docs/ADMIN_GUIDE.md) — For platform administrators
- [Developer Guide](docs/DEVELOPER_GUIDE.md) — For engineers contributing to the codebase
- [Hosting Guide](docs/HOSTING_GUIDE.md) — For deploying on indigenous-friendly, sovereign infrastructure

## License

Proprietary — Island Pitch LLC. All rights reserved.
