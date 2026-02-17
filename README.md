# 🐝 Buzzline

Embeddable video calls for your app. Three lines of code.

## Monorepo Structure

```
buzzline/
├── apps/
│   ├── api/          # NestJS signaling server & REST API
│   ├── widget/       # Embeddable JS widget (the product)
│   └── dashboard/    # User dashboard (coming soon)
├── packages/
│   ├── shared/       # Shared types & constants
│   └── tsconfig/     # Shared TypeScript configs
└── turbo.json
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env

# Start everything in dev mode
npm run dev

# Or start individually
npm run api:dev       # API on :4000
npm run widget:dev    # Widget dev server on :3002
```

## How It Works

1. Customer signs up, gets an API key
2. Customer adds the widget to their site:

```html
<script src="https://cdn.buzzline.dev/widget.js"></script>
<script>
  Buzzline.init({ apiKey: "bz_xxx" });
</script>
```

3. Their users click the video button → instant 1:1 video call

## Tech Stack

- **API:** NestJS + Socket.IO (→ MediaSoup in Phase 2)
- **Widget:** TypeScript + esbuild (vanilla JS, zero framework deps)
- **Dashboard:** Next.js (Phase 2)
- **Database:** PostgreSQL via Neon (Phase 2)
- **Hosting:** DigitalOcean / Fly.io
- **Payments:** Stripe

## Development Phases

- [x] **Phase 1:** Monorepo setup, basic signaling, widget UI
- [ ] **Phase 2:** PostgreSQL, auth, MediaSoup integration
- [ ] **Phase 3:** Dashboard, Stripe billing, usage tracking
- [ ] **Phase 4:** CDN deployment, landing page, alpha launch
