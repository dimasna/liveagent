FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
RUN pnpm --filter @liveagent/db db:generate

# Verify Prisma engine was generated, fail fast if not
RUN ENGINE=$(find /app/node_modules -name "libquery_engine-linux-musl-openssl-3.0.x.so.node" | head -1) && \
    if [ -z "$ENGINE" ]; then echo "FATAL: Prisma engine binary not found!" && exit 1; fi && \
    echo "Found Prisma engine: $ENGINE" && \
    mkdir -p /prisma-engine && \
    cp "$ENGINE" /prisma-engine/ && \
    find /app/node_modules -path "*/.prisma/client/schema.prisma" -exec cp {} /prisma-engine/ \;

RUN pnpm --filter @liveagent/web build

# Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy Prisma engine to EVERY location Prisma searches at runtime
COPY --from=builder /prisma-engine/libquery_engine-linux-musl-openssl-3.0.x.so.node /prisma-engine/
COPY --from=builder /prisma-engine/schema.prisma /prisma-engine/

RUN mkdir -p ./apps/web/.next/server && \
    cp /prisma-engine/libquery_engine-linux-musl-openssl-3.0.x.so.node ./apps/web/.next/server/ && \
    mkdir -p ./apps/web/.prisma/client && \
    cp /prisma-engine/libquery_engine-linux-musl-openssl-3.0.x.so.node ./apps/web/.prisma/client/ && \
    cp /prisma-engine/schema.prisma ./apps/web/.prisma/client/ && \
    mkdir -p "./node_modules/.pnpm/@prisma+client@6.19.2_prisma@6.19.2_typescript@5.9.3__typescript@5.9.3/node_modules/.prisma/client" && \
    cp /prisma-engine/libquery_engine-linux-musl-openssl-3.0.x.so.node "./node_modules/.pnpm/@prisma+client@6.19.2_prisma@6.19.2_typescript@5.9.3__typescript@5.9.3/node_modules/.prisma/client/" && \
    cp /prisma-engine/schema.prisma "./node_modules/.pnpm/@prisma+client@6.19.2_prisma@6.19.2_typescript@5.9.3__typescript@5.9.3/node_modules/.prisma/client/" && \
    echo "Prisma engine copied to all search paths"

ENV PRISMA_QUERY_ENGINE_LIBRARY=/prisma-engine/libquery_engine-linux-musl-openssl-3.0.x.so.node

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
