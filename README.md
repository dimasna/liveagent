# LiveAgent

SaaS platform for creating AI voice call agents that handle reservations and bookings via phone, integrated with Google Calendar. Built with Google ADK (Gemini Live API) for real-time bidirectional voice streaming.

## Architecture

```
apps/
  web/        → Next.js 15 dashboard (port 3005)
  agent/      → Fastify voice agent server with Google ADK bidi streaming (port 8080)
  widget/     → Embeddable booking widget (port 3006)

packages/
  db/         → Prisma schema + client (PostgreSQL)
  shared/     → Shared constants and types
  ui/         → Shared UI components
  typescript-config/
  eslint-config/
```

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10.4
- **PostgreSQL** (local or Cloud SQL)
- **Google Cloud** account with:
  - Gemini API key (for voice agent)
  - Google OAuth 2.0 credentials (for calendar integration)
- **Clerk** account (authentication)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

**`apps/web/.env`**

```env
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/liveagent

# Agent Service
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8080
AGENT_SERVICE_URL=http://localhost:8080

# Google OAuth (for calendar integration)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_API_KEY=your_gemini_api_key

# Billing (optional)
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_WEBHOOK_SECRET=
```

**`apps/agent/.env`**

```env
GOOGLE_API_KEY=your_gemini_api_key
GOOGLE_GENAI_USE_VERTEXAI=FALSE
DATABASE_URL=postgresql://user:password@localhost:5432/liveagent
PORT=8080
```

### 3. Set up the database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Or run migrations (production)
pnpm db:migrate
```

### 4. Set up Google OAuth (for calendar integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (type: Web application)
3. Add authorized redirect URI: `http://localhost:3005/api/agents/[id]/calendar/callback`
   - For production, use your actual domain
4. Enable the **Google Calendar API** in your project
5. Copy Client ID and Client Secret to `apps/web/.env`

### 5. Get a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Add it to both `apps/web/.env` and `apps/agent/.env`

## Running

### Development (all apps)

```bash
pnpm dev
```

This starts all apps concurrently via Turborepo:

| App | URL |
|-----|-----|
| Web dashboard | http://localhost:3005 |
| Agent server | http://localhost:8080 |
| Widget | http://localhost:3006 |

### Run individual apps

```bash
# Web dashboard only
pnpm --filter @liveagent/web dev

# Agent server only
pnpm --filter @liveagent/agent dev

# Widget only
pnpm --filter @liveagent/widget dev
```

### Production build

```bash
pnpm build
```

## Database

```bash
pnpm db:generate   # Regenerate Prisma client after schema changes
pnpm db:push       # Push schema to DB (dev, no migrations)
pnpm db:migrate    # Run migrations (production)
pnpm db:studio     # Open Prisma Studio GUI
```

## How It Works

1. **Create an agent** in the web dashboard — configure business name, type, voice, greeting, and instructions
2. **Connect Google Calendar** — OAuth flow lets users link their own calendar for availability checking and booking
3. **Voice calls** — The agent server uses Google ADK with Gemini Live API for real-time bidirectional audio streaming. Callers speak naturally; the AI agent checks availability and creates bookings via function tools
4. **Widget** — Embed a booking widget on any website with a single `<script>` tag

## Deployment (Google Cloud)

Each app has a `Dockerfile` for deploying to **Cloud Run**:

```bash
# Build and deploy web
gcloud run deploy liveagent-web --source apps/web

# Build and deploy agent
gcloud run deploy liveagent-agent --source apps/agent

# Build and deploy widget
gcloud run deploy liveagent-widget --source apps/widget
```

Use **Cloud SQL** for PostgreSQL and **Secret Manager** for environment variables in production.
