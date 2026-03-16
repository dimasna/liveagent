# @liveagent/call

Dedicated voice call app for LiveAgent. Provides a clean, WhatsApp-style calling interface accessible via a direct URL per agent.

## URL Structure

```
https://call.liveagent.dev/<agent-username>
```

Each agent can set a unique username in the dashboard. Visitors to that URL get a full-screen call interface to talk to the agent.

## Stack

- **Next.js 15** (App Router, standalone output)
- **Tailwind CSS v4**
- **WebSocket** voice session (connects to `apps/agent`)
- **`@liveagent/shared`** for voice personas and constants

## Development

```bash
# From the monorepo root
pnpm dev --filter @liveagent/call

# Or directly
cd apps/call && pnpm dev
```

Runs on **port 3009** by default.

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_AGENT_WS_URL` | WebSocket URL for the agent service | `ws://localhost:8080` |
| `NEXT_PUBLIC_WEB_APP_URL` | Web app URL (for API calls) | `http://localhost:3005` |

## How It Works

1. User visits `/<username>`
2. Server component fetches agent config from `GET /api/agents/by-username/<username>` (public endpoint on the web app)
3. Renders the call screen with agent name, business name, and voice persona
4. User taps the call button to connect via WebSocket to the agent service
5. During the call, booking cards appear for real-time booking confirmation

## Deployment

The app is deployed to **Google Cloud Run** via Terraform. See `infra/main.tf` for the full configuration.

```bash
cd infra
terraform apply
```

When a custom domain is configured, the call app is available at `call.<domain>` (e.g., `call.liveagent.dev`).

## Project Structure

```
apps/call/
├── app/
│   ├── layout.tsx          # Root layout (dark theme)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Tailwind + waveform animations
│   ├── not-found.tsx       # 404 page
│   ├── [username]/
│   │   └── page.tsx        # Agent call page (server component)
│   └── api/config/
│       └── route.ts        # Runtime env config endpoint
├── components/
│   ├── call-screen.tsx     # Main call UI (waveform, controls, booking card)
│   └── booking-card.tsx    # Booking confirmation overlay
├── hooks/
│   ├── use-voice-session.ts # WebSocket + voice state machine
│   └── use-audio.ts        # Microphone capture + audio playback
├── lib/
│   └── config.ts           # WS message types, audio config
├── Dockerfile              # Multi-stage build for Cloud Run
└── package.json
```
