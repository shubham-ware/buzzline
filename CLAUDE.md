# Buzzline

Embeddable video calling widget SaaS. Customers add 3 lines of code to get video calls in their app.

## Project Structure

Turborepo monorepo with npm workspaces.

```
buzzline/
├── apps/
│   ├── api/          # NestJS backend (signaling + REST API) — port 4000
│   ├── widget/       # Embeddable JS widget built with esbuild — port 3002
│   └── dashboard/    # Next.js dashboard (placeholder, not started)
├── packages/
│   ├── shared/       # Shared TypeScript types & constants
│   └── tsconfig/     # Shared TS configs (base, node, react)
└── turbo.json
```

## Commands

- `npm run dev` — Start all apps in dev mode
- `npm run api:dev` — Start only the API
- `npm run widget:dev` — Start only the widget dev server
- `npm run widget:build` — Build widget to `apps/widget/dist/buzzline.min.js`
- `npm run build` — Build everything
- `npm run clean` — Clean all dist folders

## Tech Stack

- **API:** NestJS 10, Socket.IO, TypeScript
- **Widget:** Vanilla TypeScript, esbuild (zero framework — must stay lightweight)
- **Dashboard:** Next.js (not started yet)
- **Shared types:** `@buzzline/shared` package
- **Database:** PostgreSQL (local dev) via Prisma v7 with `@prisma/adapter-pg`
- **Auth:** bcryptjs + jsonwebtoken (JWT), dual guard system (JwtAuthGuard + ApiKeyGuard)
- **WebRTC:** Basic peer-to-peer relay now → MediaSoup SFU in Phase 2

## Architecture

### API (`apps/api`)
- `main.ts` — Bootstrap, CORS, global prefix `/api/v1`
- `auth/` — Authentication module
  - `auth.service.ts` — signup, login, JWT sign/verify (bcryptjs + jsonwebtoken)
  - `auth.controller.ts` — POST `/auth/signup`, POST `/auth/login`
  - `jwt-auth.guard.ts` — Bearer JWT validation, injects `req.user`
  - `api-key.guard.ts` — `bz_` API key validation, origin check, injects `req.project`
- `rooms/` — Room CRUD + WebSocket signaling gateway
  - Prisma-backed room store, in-memory peer tracking (Redis later)
  - Socket.IO gateway at `/signaling` namespace
  - Relays WebRTC offer/answer/ICE between peers
  - `POST /rooms` protected by ApiKeyGuard
- `projects/` — Project CRUD, API key generation (`bz_` prefix), key rotation
  - `POST /projects`, `GET /projects/me`, `POST /:id/rotate-key` protected by JwtAuthGuard
- `prisma.service.ts` — Prisma client wrapper using composition pattern (Prisma v7)
- `health.controller.ts` — GET `/api/v1/health`

### Widget (`apps/widget`)
- `index.ts` — Global `Buzzline` SDK object exposed on `window`
- `widget.ts` — UI rendering (floating FAB button → call window)
- `call-manager.ts` — WebRTC peer connection + Socket.IO signaling
- `styles.ts` — CSS injection with customizable brand color
- Bundles to single IIFE file via esbuild

### Shared (`packages/shared`)
- All TypeScript interfaces: Room, Project, User, Plan, SignalingEvent, etc.
- Plan limits constants (free: 100 min, starter: 1K, growth: 5K, enterprise: unlimited)
- Widget config interface

## Key Design Decisions

- Widget must be vanilla JS — no React/framework dependency. Customers embed via `<script>` tag.
- API keys use `bz_` prefix for easy identification.
- Prisma v7 uses `prisma-client` provider with `@prisma/adapter-pg` driver adapter (composition pattern, not extends).
- In-memory `roomPeers` Map kept for ephemeral peer tracking (swap to Redis later).
- WebSocket gateway handles both signaling AND will later handle MediaSoup transport negotiation.
- Widget CSS is scoped with `.buzzline-` prefix to avoid conflicts with host sites.

## Current Phase: Sprint 6 In Progress (Deploy & Launch)

Completed: 1:1 video calls, PostgreSQL via Prisma, JWT auth, API key guard, Dashboard MVP, usage tracking, plan limits, Stripe billing, Dockerfile, docker-compose, nginx, landing page, request logging, widget error boundary.
Remaining: Infrastructure setup (DigitalOcean droplet, managed DB, domain, Vercel), E2E production test.

### Upcoming
- MediaSoup SFU integration (post-launch)
- Redis for room state + pub/sub (post-launch)

## Pricing Tiers
- Free: 100 min/mo, 1 project, 2 participants
- Starter ($29/mo): 1K min, 3 projects, 4 participants
- Growth ($79/mo): 5K min, unlimited projects, 10 participants, recording
- Enterprise: Custom

## Environment Variables
See `.env.example` — copy to `apps/api/.env` for local dev.

## Conventions
- All API responses use `ApiResponse<T>` wrapper: `{ success: boolean, data?: T, error?: { code, message } }`
- Room tokens are UUID v4, expire in 1 hour by default
- Socket events use the `SignalingEvent` enum from `@buzzline/shared`
- Keep widget bundle size under 50KB minified