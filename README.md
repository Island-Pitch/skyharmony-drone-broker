# SkyHarmony Drone Broker

Drone coordination and brokerage demo platform. Cloud-agnostic scaffold.

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
```

## Docker

```bash
docker compose up  # App on :3000, API on :4000
```

## Stack

- React 19 + TypeScript + Vite
- React Router v7 (registry pattern)
- Vitest + React Testing Library
- Docker (universal hosting)

## Adding Features

1. Add route to `src/routing/appRoutes.ts`
2. Create component in `src/features/<name>/`
3. Map in `src/routing/routeComponents.ts`
4. Nav appears automatically
