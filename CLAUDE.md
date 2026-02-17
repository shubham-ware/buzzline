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
- **Database:** In-memory Maps for now → PostgreSQL (Neon) in Phase 2
- **WebRTC:** Basic peer-to-peer relay now → MediaSoup SFU in Phase 2

## Architecture

### API (`apps/api`)
- `main.ts` — Bootstrap, CORS, global prefix `/api/v1`
- `rooms/` — Room CRUD + WebSocket signaling gateway
  - In-memory room store, peer tracking, token validation
  - Socket.IO gateway at `/signaling` namespace
  - Relays WebRTC offer/answer/ICE between peers
- `projects/` — Project CRUD, API key generation (`bz_` prefix), key rotation
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
- In-memory stores are intentional for Phase 1 — swap to PostgreSQL without changing service interfaces.
- WebSocket gateway handles both signaling AND will later handle MediaSoup transport negotiation.
- Widget CSS is scoped with `.buzzline-` prefix to avoid conflicts with host sites.

## Current Phase: Phase 1 (MVP)

Working on: Basic 1:1 video calls via WebRTC with Socket.IO signaling.

### Phase 2 (Next)
- PostgreSQL via Neon (replace in-memory stores)
- Auth (email/password + OAuth)
- MediaSoup integration (replace basic WebRTC relay)
- Redis for room state + pub/sub

### Phase 3
- Next.js dashboard with usage analytics
- Stripe billing integration
- CDN deployment for widget script

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