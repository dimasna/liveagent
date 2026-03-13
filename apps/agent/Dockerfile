FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.4.1 --activate

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/agent/package.json ./apps/agent/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/agent/node_modules ./apps/agent/node_modules
COPY --from=deps /app/packages/ ./packages/
COPY . .
RUN pnpm --filter @liveagent/db db:generate
RUN pnpm --filter @liveagent/agent build

# Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/agent/dist ./dist
COPY --from=builder /app/apps/agent/node_modules ./node_modules
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/packages/db/node_modules/.prisma ./node_modules/.prisma

EXPOSE 8080
ENV PORT=8080

CMD ["node", "dist/server.js"]
