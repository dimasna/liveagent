FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/call/package.json ./apps/call/
COPY packages/shared/package.json ./packages/shared/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY apps/call/ ./apps/call/
RUN pnpm --filter @liveagent/call build

# Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/call/public ./apps/call/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/call/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/call/.next/static ./apps/call/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/call/server.js"]
