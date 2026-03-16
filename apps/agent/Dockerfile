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
COPY packages/eslint-config/package.json ./packages/eslint-config/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS builder
WORKDIR /app
COPY packages/ ./packages/
COPY apps/agent/ ./apps/agent/
RUN pnpm --filter @liveagent/db db:generate

# Run with tsx (handles .ts imports from workspace packages)
FROM builder AS runner
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["pnpm", "--filter", "@liveagent/agent", "start"]
