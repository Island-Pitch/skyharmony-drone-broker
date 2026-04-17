# SkyHarmony Drone Broker

## Project Overview

Drone coordination and brokerage demo platform. Cloud-agnostic scaffold — no AWS/GCP/Azure-specific services.

## Tech Stack

- **Frontend:** React 19 / TypeScript / Vite
- **Routing:** React Router v7 with registry pattern
- **Testing:** Vitest + React Testing Library
- **Deployment:** Docker (universal — any host)
- **API:** REST proxy at `/api` → `localhost:4000`

## Build & Run

```bash
npm install              # Install deps
npm run dev              # Vite dev server on :3000
npm run build            # Production build
npm run test             # Vitest
npm run type-check       # TypeScript check
npm run docker:build     # Build container
npm run docker:run       # Run container on :3000
docker compose up        # Full stack (app + api)
```

## Architecture

### Route Registry Pattern

To add a new feature:
1. Add route to `src/routing/appRoutes.ts`
2. Create component in `src/features/<name>/`
3. Map component in `src/routing/routeComponents.ts`
4. Navigation appears automatically

### Directory Layout

```
src/
├── routing/         # Route registry + component map
├── features/        # Feature modules (dashboard, fleet, missions, marketplace)
├── components/      # Shared layout + UI components
├── hooks/           # Custom React hooks
├── theme/           # CSS variables + global styles
└── test/            # Test setup
```

## Standards

Read and follow `../ip-bot-os/CLAUDE.md` and `../ip-bot-os/standards/`.

## Hosting Constraints

- Cloud-agnostic: Docker containers, universal APIs only
- No provider-specific SDKs (no AWS SDK, no GCP client libs)
- Auth: use standard OAuth 2.0 / OIDC (provider TBD)
- Database: use standard SQL or document DB (provider TBD)
- Storage: use S3-compatible API (works with any provider)
