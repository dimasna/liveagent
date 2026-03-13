FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/widget/package.json ./apps/widget/
COPY packages/shared/package.json ./packages/shared/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/widget/node_modules ./apps/widget/node_modules
COPY --from=deps /app/packages/ ./packages/
COPY . .
RUN pnpm --filter @liveagent/widget build

# Run
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/widget/public ./apps/widget/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/widget/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/widget/.next/static ./apps/widget/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/widget/server.js"]
