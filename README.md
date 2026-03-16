# LiveAgent

AI-powered voice booking agent platform. Businesses create voice agents that handle reservations and bookings via real-time phone conversations, integrated with Google Calendar. Built on Gemini Live API for bidirectional native audio streaming.

## Architecture

```
apps/
  web/        → Next.js 15 dashboard & API (port 3005)
  agent/      → Fastify 5 voice agent server, Gemini Live API (port 8080)
  widget/     → Embeddable voice booking widget (port 3006)

packages/
  db/         → Prisma schema + client (PostgreSQL)
  shared/     → Shared constants and types
  ui/         → Shared UI components (shadcn/ui)
  typescript-config/
  eslint-config/
```

See `architecture.html` for a full visual diagram.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Voice AI | Gemini 2.5 Flash Live API via `@google/genai` SDK |
| Web | Next.js 15 (App Router), React 19, TanStack Query, Tailwind CSS 4 |
| Agent | Fastify 5, WebSocket, `@google/genai` Live API streaming |
| Widget | Next.js 15, Web Audio API, iframe embed |
| Database | PostgreSQL 15 via Prisma ORM |
| Auth | iron-session (encrypted cookies) + bcryptjs |
| Calendar | Google Calendar API via OAuth 2.0 |
| Infra | Google Cloud Run, Cloud SQL, Cloud Build, Terraform |
| Monorepo | Turborepo + pnpm workspaces |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10.4
- **PostgreSQL** (local or Cloud SQL)
- **Google Cloud** account with:
  - Gemini API key (for voice agent + research)
  - Google Places API key (for location search)
  - Google OAuth 2.0 credentials (for calendar integration)

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

```bash
cp apps/web/.env.example apps/web/.env
```

**`apps/web/.env`**

```env
# Auth
SESSION_SECRET=            # At least 32 characters (openssl rand -base64 48)
AUTH_USERNAME=admin         # Default admin username (lazy-seeded on first login)
AUTH_PASSWORD=changeme      # Default admin password (lazy-seeded on first login)
ALLOW_SIGNUP=false          # Set to "true" to allow new user registration

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/liveagent

# Agent Service
NEXT_PUBLIC_AGENT_WS_URL=ws://localhost:8080
AGENT_SERVICE_URL=http://localhost:8080

# Google Cloud
GOOGLE_API_KEY=             # Gemini API key
GOOGLE_PLACES_API_KEY=      # Google Places API key

# Google OAuth (Calendar integration)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Widget
NEXT_PUBLIC_WIDGET_URL=http://localhost:3006
NEXT_PUBLIC_DEMO_AGENT_ID=  # Agent ID for landing page demo
```

**`apps/agent/.env`**

```env
GOOGLE_API_KEY=             # Same Gemini API key
DATABASE_URL=postgresql://user:password@localhost:5432/liveagent
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
PORT=8080
```

### 3. Set up the database

```bash
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Push schema to database
```

### 4. Get API keys

1. **Gemini API key** — [Google AI Studio](https://aistudio.google.com/apikey) — add to both `apps/web/.env` and `apps/agent/.env`
2. **Places API key** — [Google Cloud Console](https://console.cloud.google.com/apis/library/places-backend.googleapis.com) — add to `apps/web/.env`

### 5. Set up Google OAuth (for calendar integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (type: Web application)
3. Add authorized redirect URI: `http://localhost:3005/api/agents/[id]/calendar/callback`
4. Enable the **Google Calendar API** in your project
5. Copy Client ID and Client Secret to both `.env` files

### 6. Run

```bash
pnpm dev
```

| App | URL |
|-----|-----|
| Web dashboard | http://localhost:3005 |
| Agent server | http://localhost:8080 |
| Widget | http://localhost:3006 |

Run individual apps:

```bash
pnpm --filter @liveagent/web dev      # Web dashboard
pnpm --filter @liveagent/agent dev     # Agent server
pnpm --filter @liveagent/widget dev    # Widget
```

## Database

```bash
pnpm db:generate   # Regenerate Prisma client after schema changes
pnpm db:push       # Push schema to DB (dev, no migrations)
pnpm db:migrate    # Run migrations (production)
pnpm db:studio     # Open Prisma Studio GUI
```

## How It Works

1. **Create an agent** in the dashboard — configure business name, type, voice, greeting, and instructions
2. **Connect Google Calendar** — OAuth flow links your calendar for real-time availability checking and booking
3. **Voice calls** — The agent service uses Gemini Live API (`@google/genai`) for real-time bidirectional audio streaming. Callers speak naturally; the AI checks availability and creates bookings via function calling (check_availability, create_booking, reschedule, cancel)
4. **Widget** — Embed a voice booking widget on any website with a single `<script>` tag
5. **Playground** — Test and customize the widget appearance and agent behavior in the dashboard

## Auth

Authentication uses **iron-session** encrypted cookies with credentials stored in PostgreSQL (bcrypt-hashed passwords).

- Default admin user is lazy-seeded on first login using `AUTH_USERNAME` and `AUTH_PASSWORD` env vars
- Signup is disabled by default (`ALLOW_SIGNUP=false`)
- All data is single-tenant with `orgId="default"`

## Deployment (Google Cloud)

A single `terraform apply` builds all Docker images in Cloud Build and deploys everything to Cloud Run. No local Docker required.

### Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- [gcloud CLI](https://cloud.google.com/sdk/docs/install) authenticated (`gcloud auth login && gcloud auth application-default login`)

### Google Cloud APIs

These are enabled automatically by Terraform:

| API | Service ID | Used For |
|-----|-----------|----------|
| Cloud Run | `run.googleapis.com` | Hosting web, agent, and widget services |
| Cloud SQL Admin | `sqladmin.googleapis.com` | Managing PostgreSQL database |
| Artifact Registry | `artifactregistry.googleapis.com` | Storing Docker images |
| Cloud Build | `cloudbuild.googleapis.com` | Building Docker images remotely |
| Secret Manager | `secretmanager.googleapis.com` | Storing credentials |
| VPC Access | `vpcaccess.googleapis.com` | Secure Cloud SQL connectivity |
| Generative Language | `generativelanguage.googleapis.com` | Gemini API for voice streaming, TTS, research |
| Vertex AI | `aiplatform.googleapis.com` | Alternative Gemini endpoint |
| Google Calendar | `calendar-json.googleapis.com` | Booking management |
| Google Places | `places.googleapis.com` | Business location search |

### Deploy

```bash
# 1. Configure
cd infra
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 2. Initialize Terraform
terraform init

# 3. Deploy everything (builds images in Cloud Build + deploys to Cloud Run)
terraform apply
```

That's it. Terraform will:
1. Enable all required GCP APIs
2. Create Artifact Registry repository
3. Build all 3 Docker images in Cloud Build (no local Docker needed)
4. Create Cloud SQL PostgreSQL database
5. Run Prisma schema push via Cloud SQL Proxy (automatic)
6. Deploy 3 Cloud Run services (web, agent, widget)
7. Configure service accounts and IAM

### View service URLs

```bash
cd infra
terraform output web_url      # Dashboard
terraform output agent_url    # Voice agent WebSocket
terraform output widget_url   # Embeddable widget
```

### Demo agent

To show a live voice widget on the landing page:

1. Create an agent in the dashboard
2. Set `demo_agent_id` in `terraform.tfvars` with the agent ID
3. Run `terraform apply` again

### Redeploying

After code changes, just run `terraform apply` again. It rebuilds all images in Cloud Build and updates the Cloud Run services.
