# ─── Stage 1: Build ────────────────────────────────────
FROM node:20-slim AS builder

# Install build tools for better-sqlite3 native addon
RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy package manifests first (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
COPY packages/tui/package.json packages/tui/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/core/ packages/core/
COPY packages/server/ packages/server/
COPY packages/web/ packages/web/
COPY packages/tui/ packages/tui/
COPY tsconfig*.json ./
COPY vitest*.ts ./

# Build all packages
RUN pnpm build

# ─── Stage 2: Production ──────────────────────────────
FROM node:20-slim AS production

RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy package manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json packages/core/
COPY packages/server/package.json packages/server/
COPY packages/web/package.json packages/web/
COPY packages/tui/package.json packages/tui/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from builder (migrations + seeds are bundled by tsup)
COPY --from=builder /app/packages/core/dist packages/core/dist/
COPY --from=builder /app/packages/server/dist packages/server/dist/
COPY --from=builder /app/packages/web/dist packages/web/dist/

# Create data directory
RUN mkdir -p /data

ENV PORT=3456
ENV DB_PATH=/data/inxtone.db
ENV NODE_ENV=production

EXPOSE 3456

CMD ["node", "packages/server/dist/index.js"]
