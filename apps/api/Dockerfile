# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json turbo.json ./

# Copy workspace package.json files for install
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/tsconfig/ packages/tsconfig/

# Install all dependencies
RUN npm ci

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Build shared package first, then generate Prisma client, then build API
RUN cd packages/shared && npm run build
RUN cd apps/api && npx prisma generate
RUN cd apps/api && npx nest build

# --- Stage 2: Runtime ---
FROM node:18-alpine

WORKDIR /app

# Copy workspace root for module resolution
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/apps/api/dist apps/api/dist
COPY --from=builder /app/apps/api/src/generated apps/api/src/generated
COPY --from=builder /app/apps/api/prisma apps/api/prisma
COPY --from=builder /app/packages/shared/dist packages/shared/dist

# Set working directory to API app
WORKDIR /app/apps/api

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/main.js"]
