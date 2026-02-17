# Buzzline Development Plan

> Track progress by marking tasks: `[ ]` → `[x]`
> Each task is independent, testable, and has clear acceptance criteria.
> Estimated total: ~60-70 hours across 6 sprints.

---

## Sprint 1: Boot & Smoke Test (3-4 hours)

**Goal:** Everything runs locally, health check passes, demo page loads.

### Task 1.1: Environment Setup
- [x] Extract tarball, run `npm install`
- [x] Copy `.env.example` → `apps/api/.env`
- [x] `git init && git add -A && git commit -m "init: buzzline monorepo"`
- **Verify:** `node -v` >= 18, `npm -v` >= 10, all deps installed without errors

### Task 1.2: Boot API Server
- [x] Run `npm run api:dev`
- [x] Fix any NestJS boot errors (missing deps, import paths)
- **Verify:** `curl http://localhost:4000/api/v1/health` returns `{ "status": "ok", "service": "buzzline-api" }`

### Task 1.3: Boot Widget Dev Server
- [x] Run `npm run widget:dev`
- [x] Fix any esbuild errors (import resolution, missing modules)
- **Verify:** Open `http://localhost:3002` — see the purple gradient demo page with floating video button in bottom-right

### Task 1.4: API Smoke Test — Room Creation
- [x] Test room creation endpoint via curl:
  ```bash
  curl -X POST http://localhost:4000/api/v1/rooms \
    -H "Content-Type: application/json" \
    -d '{"projectId": "test", "maxParticipants": 2}'
  ```
- **Verify:** Response contains `{ success: true, data: { roomId: "uuid", token: "uuid", expiresAt: "..." } }`

### Task 1.5: API Smoke Test — Project Creation
- [x] Test project creation:
  ```bash
  curl -X POST http://localhost:4000/api/v1/projects \
    -H "Content-Type: application/json" \
    -d '{"userId": "user1", "name": "My App"}'
  ```
- **Verify:** Response contains API key starting with `bz_`

### Task 1.6: WebSocket Connection Test
- [x] Open browser console on `localhost:3002`
- [x] Check for `[Buzzline] Widget initialized 🐝` in console
- [x] Click the floating video button — should request camera/mic permission
- **Verify:** Camera permission prompt appears. If denied gracefully, error callback fires.

**Sprint 1 Deliverable:** API running, widget loading, endpoints responding. Commit: `feat: sprint 1 — boot and smoke test passing`

---

## Sprint 2: End-to-End 1:1 Video Call (8-10 hours)

**Goal:** Two browser tabs can have a live video call via localhost.

### Task 2.1: Fix Signaling Flow — Room Join
- [x] Widget creates room via REST → gets roomId + token
- [x] Widget connects to Socket.IO at `/signaling`
- [x] Widget emits `join-room` with roomId + token
- [x] Server validates token, adds peer, emits `room-joined` back
- **Verify:** Console logs `🔌 Connected` and `👤 joined room` on server, `room-joined` event received on client

### Task 2.2: Fix ICE Candidate Routing
- [x] Current code sends ICE to `"broadcast"` — fix to route to specific peer
- [x] In `rooms.gateway.ts`: route ICE candidates to all other peers in the room (not by peerId)
- [x] Use Socket.IO room broadcasting: `client.to(roomId).emit("ice-candidate", ...)`
- **Verify:** ICE candidates flow between both tabs (check Network/WS tab in DevTools)

### Task 2.3: Fix Offer/Answer Flow
- [x] Tab A joins room → waits
- [x] Tab B joins room → server emits `peer-joined` to Tab A
- [x] Tab A creates offer → sends via signaling → Tab B receives
- [x] Tab B creates answer → sends via signaling → Tab A receives
- [x] Both set remote descriptions
- **Verify:** `RTCPeerConnection.connectionState` reaches `"connected"` on both tabs

### Task 2.4: Create Test Page for Two Participants
- [x] Create `apps/widget/public/test-call.html` with:
  - "Create Room" button → creates room, shows roomId + shareable link
  - "Join Room" input + button → joins existing room by ID
  - Local video preview before joining
  - Status indicator (connecting/connected/disconnected)
- **Verify:** Can create room in Tab A, copy roomId, paste in Tab B, both see each other's video

### Task 2.5: Handle Edge Cases
- [x] Tab closes → other tab gets `peer-left` event, UI resets to idle
- [x] Camera denied → show friendly error, don't crash widget
- [x] Room full (3rd tab tries to join 2-person room) → show "room full" error
- [x] Invalid token → show "invalid token" error
- **Verify:** Each edge case handled gracefully without console errors or frozen UI

### Task 2.6: Call Timer & Duration Tracking
- [x] Timer starts when remote stream received (not when room joined)
- [x] Timer stops on call end
- [x] Duration passed to `onCallEnd` callback
- **Verify:** Timer shows accurate elapsed time, duration in callback matches

### Task 2.7: Mute/Camera Toggle
- [x] Mute button toggles audio track `enabled`
- [x] Camera button toggles video track `enabled`
- [x] Button UI reflects current state (toggled styling)
- **Verify:** Other tab stops hearing audio / seeing video when toggled

**Sprint 2 Deliverable:** Working 1:1 video call between two browser tabs. Commit: `feat: sprint 2 — working 1:1 video call`

---

## Sprint 3: Database & Auth (10-12 hours)

**Goal:** Persistent storage, user accounts, API key validation.

### Task 3.1: PostgreSQL Setup (Local)
- [x] Set up local PostgreSQL via Homebrew
- [x] Add `DATABASE_URL` to `.env`
- [x] Install Prisma: `npm install prisma @prisma/client`
- [x] Init Prisma: `cd apps/api && npx prisma init`
- **Verify:** `npx prisma db push` connects successfully to local PostgreSQL

### Task 3.2: Database Schema
- [x] Create Prisma schema with models:
  ```prisma
  model User {
    id        String    @id @default(uuid())
    email     String    @unique
    password  String    // bcrypt hash
    name      String
    plan      String    @default("free")
    createdAt DateTime  @default(now())
    projects  Project[]
  }

  model Project {
    id             String   @id @default(uuid())
    name           String
    userId         String
    user           User     @relation(fields: [userId], references: [id])
    apiKey         String   @unique
    allowedOrigins String[] @default(["*"])
    settings       Json     @default("{}")
    createdAt      DateTime @default(now())
    rooms          Room[]
  }

  model Room {
    id              String   @id @default(uuid())
    projectId       String
    project         Project  @relation(fields: [projectId], references: [id])
    status          String   @default("waiting")
    maxParticipants Int      @default(2)
    metadata        Json?
    token           String   @unique
    tokenExpiresAt  DateTime
    createdAt       DateTime @default(now())
    closedAt        DateTime?
    usageRecords    UsageRecord[]
  }

  model UsageRecord {
    id               String   @id @default(uuid())
    roomId           String
    room             Room     @relation(fields: [roomId], references: [id])
    durationSeconds  Int
    participantCount Int
    createdAt        DateTime @default(now())
  }
  ```
- [x] Run `npx prisma db push`
- **Verify:** Tables created in local PostgreSQL, `npx prisma studio` shows empty tables

### Task 3.3: Migrate RoomsService to Prisma
- [x] Replace `Map<string, Room>` with Prisma queries
- [x] `createRoom()` → `prisma.room.create()`
- [x] `getRoom()` → `prisma.room.findUniqueOrThrow()`
- [x] `validateToken()` → `prisma.room.findUnique({ where: { token } })`
- [x] Keep in-memory `roomPeers` Map (peer tracking is ephemeral, Redis later)
- **Verify:** Create room via curl → verify row exists in `npx prisma studio`

### Task 3.4: Migrate ProjectsService to Prisma
- [x] Replace `Map<string, Project>` with Prisma queries
- [x] `createProject()` → `prisma.project.create()`
- [x] `getProjectByApiKey()` → `prisma.project.findUnique({ where: { apiKey } })`
- **Verify:** Create project via curl → verify in Prisma Studio, API key lookup works

### Task 3.5: Auth Module — Signup & Login
- [x] Install: `npm install bcryptjs jsonwebtoken`
- [x] Create `auth/` module with:
  - `POST /api/v1/auth/signup` — email, password, name → create user, return JWT
  - `POST /api/v1/auth/login` — email, password → validate, return JWT
  - JWT payload: `{ userId, email, plan }`
  - JWT secret from env: `JWT_SECRET`
- **Verify:**
  ```bash
  # Signup
  curl -X POST http://localhost:4000/api/v1/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"pass123","name":"Test"}'
  # Returns: { success: true, data: { token: "eyJ...", user: {...} } }

  # Login
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"pass123"}'
  # Returns: JWT token
  ```

### Task 3.6: JWT Auth Guard
- [x] Create `JwtAuthGuard` — extracts Bearer token, validates, injects `req.user`
- [x] Protect routes: `POST /projects`, `GET /projects/me`, `POST /projects/:id/rotate-key`
- [x] Projects auto-associate with authenticated user (no userId in body)
- **Verify:** Unauthenticated request returns 401, authenticated request creates project tied to user

### Task 3.7: API Key Guard for Widget Routes
- [x] Create `ApiKeyGuard` — extracts `X-API-Key` header or `Authorization: Bearer bz_xxx`
- [x] Looks up project by API key
- [x] Validates `allowedOrigins` against request `Origin` header
- [x] Injects `req.project` into request
- [x] Protect: `POST /rooms` (widget creates rooms with API key, not JWT)
- **Verify:** Room creation with valid `bz_` key works, invalid key returns 401, wrong origin returns 403

**Sprint 3 Deliverable:** Persistent data, user accounts, secured endpoints. Commit: `feat: sprint 3 — database, auth, API key validation`

---

## Sprint 4: Dashboard MVP (10-12 hours)

**Goal:** Users can sign up, create projects, get API key, see usage.

### Task 4.1: Next.js App Setup
- [ ] `cd apps/dashboard && npx create-next-app@latest . --typescript --tailwind --app --no-src-dir`
- [ ] Update `package.json` name to `@buzzline/dashboard`
- [ ] Add dev port: `"dev": "next dev -p 3000"`
- [ ] Configure `tsconfig.json` to extend `@buzzline/tsconfig/react.json`
- **Verify:** `npm run dashboard:dev` → Next.js running on `http://localhost:3000`

### Task 4.2: Auth Pages
- [ ] `/login` — email + password form, calls API `/auth/login`, stores JWT in httpOnly cookie or localStorage
- [ ] `/signup` — email + password + name form, calls API `/auth/signup`
- [ ] Redirect to `/dashboard` on success
- [ ] Auth middleware: redirect unauthenticated users to `/login`
- **Verify:** Can sign up → redirected to dashboard, can log out → redirected to login

### Task 4.3: Dashboard Overview Page
- [ ] `/dashboard` — shows:
  - Welcome message with user name
  - Plan badge (Free / Starter / Growth)
  - Usage this month: X / Y minutes used (progress bar)
  - Quick stats: total rooms created, active rooms
  - "Create Project" CTA if no projects exist
- **Verify:** After login, dashboard shows user info and zero usage

### Task 4.4: Projects Page
- [ ] `/dashboard/projects` — list all projects with:
  - Project name, created date
  - API key (masked, click to reveal/copy)
  - "Rotate Key" button with confirmation dialog
  - Allowed origins list (editable)
- [ ] `/dashboard/projects/new` — create project form (name only for MVP)
- **Verify:** Can create project, see API key, copy it, rotate it

### Task 4.5: Integration Guide Page
- [ ] `/dashboard/projects/[id]/setup` — shows:
  - Step 1: Copy the script tag
  - Step 2: Copy the init snippet with their API key pre-filled
  - Step 3: Test it (link to widget test page)
  - Code snippets with copy button
  - Framework-specific tabs: HTML, React, Next.js
- **Verify:** Code snippets contain the user's actual API key

### Task 4.6: Usage Page
- [ ] `/dashboard/usage` — shows:
  - Current month usage (minutes)
  - Usage by project (bar chart or table)
  - Daily usage chart (last 30 days)
  - Plan limits and upgrade CTA
- **Verify:** Usage data displays (can be mock data initially, wired to real data after Sprint 5)

**Sprint 4 Deliverable:** Functional dashboard where users manage projects and API keys. Commit: `feat: sprint 4 — dashboard MVP`

---

## Sprint 5: Usage Tracking & Billing Prep (8-10 hours)

**Goal:** Track call minutes per project, enforce plan limits, prepare Stripe.

### Task 5.1: Usage Recording on Call End
- [ ] When room closes (all peers left), calculate total duration
- [ ] Create `UsageRecord` in database:
  - `roomId`, `durationSeconds`, `participantCount`, `createdAt`
- [ ] Duration = time from first peer join to last peer leave
- **Verify:** After a call ends, `UsageRecord` row exists in database

### Task 5.2: Usage Aggregation API
- [ ] `GET /api/v1/usage/current` — current month's total minutes for authenticated user
- [ ] `GET /api/v1/usage/by-project` — breakdown by project
- [ ] `GET /api/v1/usage/daily?days=30` — daily totals for charting
- **Verify:** Endpoints return correct aggregated data after making test calls

### Task 5.3: Plan Limit Enforcement
- [ ] Before room creation, check user's current month usage against plan limits
- [ ] If over limit → return `{ success: false, error: { code: "USAGE_LIMIT", message: "..." } }`
- [ ] Widget shows friendly "usage limit reached" message instead of crashing
- **Verify:** Free user with 100+ minutes used cannot create new rooms, gets clear error

### Task 5.4: Wire Dashboard to Real Usage Data
- [ ] Dashboard overview → call `/usage/current` API
- [ ] Usage page → call `/usage/daily` and `/usage/by-project` APIs
- [ ] Show real progress bar: used / limit minutes
- **Verify:** After making calls, dashboard reflects accurate usage

### Task 5.5: Stripe Integration — Product Setup
- [ ] Create Stripe account, get test keys
- [ ] Create products in Stripe Dashboard:
  - Starter: $29/mo
  - Growth: $79/mo
- [ ] Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env`
- [ ] Install: `npm install stripe -w @buzzline/api`
- **Verify:** Products visible in Stripe Dashboard

### Task 5.6: Stripe Checkout Flow
- [ ] `POST /api/v1/billing/create-checkout` — creates Stripe Checkout session
- [ ] Returns checkout URL → dashboard redirects user to Stripe
- [ ] Stripe webhook `checkout.session.completed` → update user's plan in database
- [ ] Dashboard "Upgrade" button links to checkout
- **Verify:** Can complete test checkout, user's plan updates to "starter"

### Task 5.7: Stripe Customer Portal
- [ ] `POST /api/v1/billing/portal` — creates Stripe portal session
- [ ] User can manage subscription, update payment, cancel
- [ ] Webhook handles `customer.subscription.updated` and `customer.subscription.deleted`
- **Verify:** Can access portal, cancel subscription → plan reverts to "free"

**Sprint 5 Deliverable:** Metered usage, plan enforcement, payment working. Commit: `feat: sprint 5 — usage tracking and Stripe billing`

---

## Sprint 6: Deploy & Launch Prep (8-10 hours)

**Goal:** Live on the internet, widget served from CDN, landing page exists.

### Task 6.1: API Deployment — Fly.io
- [ ] Create `Dockerfile` for `apps/api`
- [ ] Create `fly.toml` config
- [ ] `fly launch` → deploy to Fly.io
- [ ] Set env vars: `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, etc.
- [ ] Verify health check: `curl https://api.buzzline.dev/api/v1/health`
- **Verify:** API accessible at production URL, health check returns OK

### Task 6.2: Dashboard Deployment — Vercel
- [ ] Connect GitHub repo to Vercel
- [ ] Set root directory to `apps/dashboard`
- [ ] Set env vars: `NEXT_PUBLIC_API_URL`
- [ ] Deploy
- **Verify:** Dashboard accessible at `https://buzzline.dev` or `https://app.buzzline.dev`

### Task 6.3: Widget CDN Deployment
- [ ] Build widget: `npm run widget:build`
- [ ] Upload `buzzline.min.js` to CDN (Cloudflare R2 / S3 + CloudFront)
- [ ] Set up versioned URLs: `cdn.buzzline.dev/v1/widget.js`
- [ ] Set CORS headers to allow any origin
- [ ] Set long cache TTL with versioned filenames
- **Verify:** `<script src="https://cdn.buzzline.dev/v1/widget.js">` loads correctly from any domain

### Task 6.4: Domain & SSL
- [ ] Register domain (buzzline.dev / buzzline.co / getbuzzline.com)
- [ ] Configure DNS:
  - `api.buzzline.dev` → Fly.io
  - `buzzline.dev` / `app.buzzline.dev` → Vercel
  - `cdn.buzzline.dev` → CDN
- [ ] Verify SSL on all subdomains
- **Verify:** All three subdomains resolve and serve over HTTPS

### Task 6.5: Landing Page
- [ ] Create landing page at `/` (can be part of dashboard or separate):
  - Hero: tagline + code snippet + demo video/gif
  - Features: 3 blocks (easy integration, customizable, usage dashboard)
  - Pricing: 4-tier table (Free, Starter, Growth, Enterprise)
  - CTA: "Get Started Free" → signup
  - Footer: docs link, GitHub, Twitter
- **Verify:** Landing page loads, CTA links to signup, pricing is accurate

### Task 6.6: End-to-End Production Test
- [ ] Sign up on production dashboard
- [ ] Create project, get API key
- [ ] Create test HTML page using CDN widget script + production API key
- [ ] Host test page anywhere (CodePen, Netlify)
- [ ] Make a video call between two devices (phone + laptop)
- **Verify:** Full flow works: signup → API key → embed widget → make call → see usage in dashboard

### Task 6.7: Monitoring & Error Tracking
- [ ] Add basic request logging to API (request ID, duration, status)
- [ ] Set up Fly.io log streaming
- [ ] Add error boundary in widget (catch and report, don't crash host site)
- [ ] Add `window.onerror` handler in widget for uncaught errors
- **Verify:** Can see API logs, widget errors don't break host page

**Sprint 6 Deliverable:** Live product accessible to the public. Commit: `feat: sprint 6 — deployed and live`

---

## Post-Launch Backlog

These are important but come after the core product is live:

### Performance & Scale
- [ ] Redis for room peer state (replace in-memory Map)
- [ ] MediaSoup SFU integration (replace P2P WebRTC for better quality)
- [ ] Connection quality indicator in widget UI
- [ ] Reconnection logic (auto-rejoin on network drop)

### Widget Enhancements
- [ ] Screen sharing support
- [ ] Chat overlay during calls
- [ ] Custom themes (dark/light/auto)
- [ ] React SDK package: `npm install @buzzline/react`
- [ ] Pre-call device selection (choose camera/mic)

### Dashboard Enhancements
- [ ] Team members / collaborators
- [ ] Webhook configuration (call events → customer's server)
- [ ] Call recordings playback
- [ ] Real-time active calls view

### YouTube Channel (Parallel Track)
- [ ] Video 1: "WebRTC in 10 Minutes — How Video Calls Actually Work"
- [ ] Video 2: "Build a Video Call App with MediaSoup (Part 1)"
- [ ] Video 3: "Build a Video Call App with MediaSoup (Part 2)"
- [ ] Video 4: "Zoom vs Twilio vs Daily — When to Build vs Buy"

---

## Task Dependency Map

```
Sprint 1 (Boot)
    └──▶ Sprint 2 (Working Call)
              └──▶ Sprint 3 (DB + Auth)
                        ├──▶ Sprint 4 (Dashboard)
                        │         └──▶ Sprint 5 (Usage + Billing)
                        │                   └──▶ Sprint 6 (Deploy)
                        └──▶ Sprint 5 (can start billing prep in parallel)
```

Sprints 1-3 are strictly sequential.
Sprint 4 and 5 can partially overlap (dashboard UI while billing backend builds).
Sprint 6 requires 4 + 5 complete.

---

## How to Use This Plan

1. **Start each sprint** by reading all tasks, then tackle them in order
2. **One task at a time** — don't jump ahead
3. **Verify before moving on** — each task has acceptance criteria
4. **Commit after each task** with descriptive messages
5. **In Claude Code:** reference this file — `@DEVELOPMENT_PLAN.md` — to stay on track
6. **If stuck on a task:** skip to the next and come back, but note the dependency
