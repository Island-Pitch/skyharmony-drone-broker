# SkyHarmony Developer Guide

## Architecture Overview

SkyHarmony is a full-stack TypeScript application with a clear separation between frontend and backend:

```
Browser ←→ Vite Dev Server (:3000) ←→ Express API (:4000) ←→ PostgreSQL (:5432)
                 └── /api proxy ──────────┘
```

### Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Data layer | Repository pattern (interface → implementation) | Swap InMemory for HTTP without changing services |
| Validation | Zod schemas shared between frontend models and API validation | Single source of truth for data shapes |
| Auth | JWT with bcrypt | Stateless, cloud-agnostic, no session store needed |
| ORM | Drizzle | Type-safe SQL, lightweight, PostgreSQL-native |
| State management | React Context + hooks | No external deps needed at this scale |
| Styling | CSS custom properties | No build-time CSS framework dependency |
| Testing | Vitest (unit) + Playwright (E2E) | Fast unit tests + real browser verification |

---

## Setting Up Development

### Prerequisites

- Node.js 22+
- Docker Desktop (for PostgreSQL)
- Git

### First-Time Setup

```bash
git clone <repo-url>
cd skyharmony-drone-broker

# Frontend deps
npm install

# Backend deps
cd api && npm install && cd ..

# Start PostgreSQL
docker compose up db -d

# Run migrations + seed
cd api
DATABASE_URL=postgres://skyharmony:skyharmony_dev@localhost:5432/skyharmony npx drizzle-kit migrate
DATABASE_URL=postgres://skyharmony:skyharmony_dev@localhost:5432/skyharmony npx tsx src/db/seed.ts
cd ..
```

### Daily Development

Terminal 1 — API:
```bash
cd api
DATABASE_URL=postgres://skyharmony:skyharmony_dev@localhost:5432/skyharmony JWT_SECRET=skyharmony-dev-secret npm run dev
```

Terminal 2 — Frontend:
```bash
npm run dev
```

### Running Tests

```bash
# Unit tests (385 tests, ~3 seconds)
npm run test

# Watch mode
npm run test:watch

# E2E tests (19 tests, requires dev server running)
npx playwright test

# Full CI pipeline
npm run test && npm run lint && npm run type-check && npm run build
```

---

## Project Structure

### Frontend (`src/`)

```
src/
├── auth/                   # RBAC system
│   ├── roles.ts            # Role + Permission enums, permission matrix
│   ├── AuthContext.tsx      # React context, loads user from /api/auth/me
│   ├── useAuth.ts          # Hook: { user, role, hasPermission }
│   ├── authService.ts      # login/signup/logout + token management
│   └── RouteGuard.tsx      # Permission-checking wrapper component
│
├── data/
│   ├── models/             # Zod schemas (Asset, Booking, Incident, CustodyEvent, AuditEvent)
│   ├── repositories/
│   │   ├── interfaces.ts   # IAssetRepository contract
│   │   ├── InMemory*.ts    # In-memory implementations (for tests/demo)
│   │   └── http/           # HTTP implementations (call real API)
│   ├── store.ts            # In-memory Map store (test/demo only)
│   └── seed.ts             # Demo seed data generator
│
├── services/               # Business logic (validation, aggregation)
├── hooks/                  # React hooks wrapping services
├── providers/
│   └── DataProvider.tsx    # Auto-detects API, creates repos + services
│
├── features/               # Feature modules
│   ├── dashboard/          # Admin KPIs, widgets
│   ├── fleet/              # Asset table, filters, accessories, audit log
│   ├── bookings/           # Form, My Bookings, Admin Queue
│   ├── billing/            # Revenue dashboard
│   ├── scan/               # QR scanner, check-in/out, manifest
│   ├── allocation/         # Availability + allocation panel
│   ├── incidents/          # Report form + queue
│   ├── landing/            # Marketing homepage
│   ├── auth/               # Login + Onboarding wizard
│   └── legal/              # Privacy, Terms, Accessibility pages
│
├── routing/
│   ├── appRoutes.ts        # Route registry with permission requirements
│   └── routeComponents.ts  # Maps path → React component
│
├── components/             # Shared components (AppLayout, NavIcon, RequireAuth)
└── theme/global.css        # Maori-inspired design system (CSS variables)
```

### Backend (`api/src/`)

```
api/src/
├── index.ts                # Express server, CORS, route mounting
├── db/
│   ├── connection.ts       # Drizzle + node-postgres pool
│   ├── schema.ts           # 7 tables (users, assets, asset_types, bookings, audit_events, custody_events, incidents)
│   └── seed.ts             # Seeds 1500+ assets, 6 users, 24 bookings
├── middleware/
│   ├── auth.ts             # JWT verify + requireRole() + signToken()
│   └── validate.ts         # Zod validation middleware
└── routes/
    ├── auth.ts             # signup, login, me, onboard
    ├── fleet.ts            # CRUD + summary + types (operator-scoped)
    ├── bookings.ts         # CRUD + transition (operator-scoped)
    ├── billing.ts          # Revenue summary (operator-scoped)
    ├── scan.ts             # Lookup + checkout + checkin
    ├── allocation.ts       # Check + allocate (admin-only)
    ├── incidents.ts        # CRUD + resolve (operator-scoped)
    └── health.ts           # DB connectivity check
```

---

## Adding a New Feature

### 1. Define the Data Model

Create a Zod schema in `src/data/models/`:

```typescript
// src/data/models/myFeature.ts
import { z } from 'zod';

export const MyFeatureSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  created_at: z.string().datetime(),
});

export type MyFeature = z.infer<typeof MyFeatureSchema>;
```

### 2. Add API Route

Create `api/src/routes/myFeature.ts` and register in `api/src/index.ts`.

### 3. Create Frontend Feature

```
src/features/my-feature/
├── MyFeaturePage.tsx
├── __tests__/
│   └── MyFeaturePage.test.tsx
```

### 4. Register Route

```typescript
// src/routing/appRoutes.ts — add entry
{ path: 'my-feature', label: 'My Feature', icon: 'star', nav: ['side'], permission: Permission.SomePermission },

// src/routing/routeComponents.ts — map component
import { MyFeaturePage } from '@/features/my-feature/MyFeaturePage';
// ...
'my-feature': MyFeaturePage,
```

Nav appears automatically, gated by permission.

### 5. Add Database Table

```typescript
// api/src/db/schema.ts — add table
export const myFeatures = pgTable('my_features', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});
```

Generate and run migration:
```bash
cd api
DATABASE_URL=... npx drizzle-kit generate
DATABASE_URL=... npx drizzle-kit migrate
```

---

## RBAC System

### Adding a New Permission

1. Add to `Permission` enum in `src/auth/roles.ts`
2. Assign to roles in `ROLE_PERMISSIONS` matrix
3. Use `RouteGuard` in frontend or `requireRole()` in API

### Operator Scoping Pattern

Backend — filter data by the requesting user:
```typescript
router.get('/my-endpoint', auth, async (req, res) => {
  const isAdmin = req.user!.role === 'CentralRepoAdmin';
  const where = isAdmin ? undefined : eq(table.owner_id, req.user!.userId);
  const rows = await db.select().from(table).where(where);
  res.json({ data: rows });
});
```

Frontend — the nav automatically hides items the user can't access (via `appRoutes` permission field).

---

## Testing Strategy

| Layer | Tool | Location | Count |
|-------|------|----------|-------|
| Data models | Vitest | `src/data/models/__tests__/` | ~50 |
| Repositories | Vitest | `src/data/repositories/__tests__/` | ~30 |
| Services | Vitest | `src/services/__tests__/` | ~60 |
| Hooks | Vitest + RTL | `src/hooks/__tests__/` | ~15 |
| Components | Vitest + RTL | `src/features/*/__tests__/` | ~100 |
| Integration | Vitest + RTL | `src/__tests__/` | ~10 |
| E2E | Playwright | `e2e/` | 19 |

### Test Isolation

- Tests use in-memory repositories (not HTTP) via `DataProvider` jsdom detection
- `store.reset()` in `beforeEach` prevents test pollution
- `src/test/setup.ts` mocks `/api/health` to force demo mode + sets a fake auth token

---

## Code Style

- TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`)
- ESLint with typescript-eslint recommended rules
- No Prettier (ESLint handles formatting concerns)
- Imports use `@/` path alias (→ `src/`)
- Component files: PascalCase (e.g., `FleetFilters.tsx`)
- Non-component files: camelCase (e.g., `useAssets.ts`)
- CSS: BEM-ish class names (`.sidebar-header`, `.stat-card`, `.status-badge`)
