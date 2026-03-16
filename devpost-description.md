## Inspiration

I've experienced this frustration firsthand — trying to book a table at a restaurant over WhatsApp, waiting hours for a reply that never comes, and eventually just picking another place. I had the same thing happen trying to book a dentist appointment to check my teeth — slow replies, no confirmation, and eventually giving up and finding a different clinic. In both cases, the businesses lost a paying customer not because of bad service, but because no one was available to answer.

These aren't edge cases — they're everyday frustrations that cost businesses real customers. Staff are busy serving existing customers, phone lines go to voicemail, and chat messages pile up unanswered.

I realized that the Gemini Live API's native bidirectional audio streaming could solve this problem in a way that text-based chatbots never could: a voice agent that sounds natural, understands context, and can actually **do** things — like check real-time availability and create bookings on Google Calendar — all through a seamless voice conversation. No more waiting for a text reply. No more phone tag. Just click, talk, and book. I wanted to move beyond the "text box" paradigm and build something that feels like talking to a real, competent receptionist — one that's available 24/7 and never puts you on hold.

## What it does

**Liveagent.dev** is a platform that lets any business create and deploy an AI-powered voice agent that handles booking and reservation calls in real-time. Here's how it works:

- **Business owners** sign in to a dashboard, configure their agent (business type, operating hours, voice persona, booking rules, resource capacity), and connect their Google Calendar via OAuth.
- **Customers** interact with the agent through an embeddable voice widget on the business's website. They simply click a button and start talking — no forms, no typing, no hold music, no waiting for a chat reply.
- **The agent** carries on a natural voice conversation powered by Gemini 2.5 Flash Live (native audio). It checks real-time availability, suggests open time slots, creates bookings, handles rescheduling and cancellations, and sends calendar invites — all mid-conversation using Gemini's function calling.
- **After the call**, the business owner can review full conversation transcripts, analytics (call volume, booking rates, average duration), and manage upcoming reservations — all from the dashboard.

It supports 8 different voice personas, configurable operating hours per day, resource management (tables, rooms, courts, chairs), and works for a wide range of business types including restaurants, salons, medical clinics, spas, fitness studios, and more.

## How I built it

I built Liveagent entirely solo, architecting it as a **monorepo** with three services, all deployed on **Google Cloud Run**:

1. **Agent Service** (Fastify 5) — The core voice engine. It manages WebSocket connections from clients, streams PCM audio bidirectionally with the **Gemini 2.5 Flash Live API** using the `@google/genai` SDK, and executes function calls (check availability, create/reschedule/cancel bookings, send calendar invites) against the **Google Calendar API** via OAuth 2.0.

2. **Web Dashboard** (Next.js 15 / React 19) — Where business owners configure agents, connect Google Calendar, view conversation transcripts, and monitor analytics. Uses iron-session for auth, TanStack Query for data fetching, and shadcn/ui for the interface.

3. **Embeddable Widget** (Next.js 15) — A lightweight voice widget that any website can embed with a single `<script>` tag. It captures microphone audio via the Web Audio API, encodes it to PCM 16kHz, and streams it over WebSocket to the agent service. It also renders a live transcript and booking confirmation cards.

All three services share a **PostgreSQL** database (Cloud SQL) via **Prisma ORM**, and common code lives in shared packages (UI components, constants, DB client). Infrastructure is provisioned with **Terraform** and deployed via **Cloud Build** to **Google Artifact Registry** and **Cloud Run**.

The voice pipeline works like this: Widget captures audio → WebSocket → Agent service → Gemini Live API (bidirectional streaming) → Function calling for calendar operations → Audio response streamed back → Widget plays audio. The entire round-trip feels conversational, with support for barge-in (interruption) via Gemini's built-in Voice Activity Detection.

## Challenges I ran into

- **Real-time audio streaming reliability** — Getting bidirectional PCM audio streaming to work smoothly over WebSocket with the Gemini Live API required careful handling of audio encoding, buffering, and playback timing. Dropped frames or encoding mismatches resulted in garbled audio or silence.
- **Voice Activity Detection tuning** — Finding the right balance of start/end sensitivity and silence duration thresholds was critical. Too sensitive and the agent would cut off mid-sentence; too lenient and there'd be awkward pauses before the agent responded.
- **Calendar resource management** — Handling concurrent bookings for limited resources (e.g., 10 tables at a restaurant) required building a resource assignment system on top of Google Calendar's freebusy API, using extended properties to track which resource is assigned to which booking.
- **Function calling mid-conversation** — When Gemini calls a tool (like `check_availability`), the voice stream pauses while the function executes. Making this feel natural — so the agent says something like "Let me check that for you" before the pause — required careful prompt engineering in the system instructions.
- **Doing everything solo** — As a solo developer, I had to wear every hat — frontend, backend, real-time audio engineering, infrastructure, prompt engineering, and UX design. The biggest challenge was managing scope and making tough prioritization decisions to ship a complete product within the hackathon timeline.

## Accomplishments that I'm proud of

- **End-to-end voice booking in under 60 seconds** — A customer can call, check availability, book a time slot, and receive a Google Calendar invite, all through natural conversation, in under a minute.
- **One-script embed** — Any business can add the voice agent to their website with a single `<script>` tag, no technical expertise required.
- **Built entirely solo** — From database schema to Terraform infrastructure to real-time audio streaming to frontend dashboard — every line of code was written by one person.
- **Production-grade infrastructure** — Full Terraform IaC, Cloud Run auto-scaling, Secret Manager integration, and multi-stage Docker builds. This isn't a demo — it's deployable.
- **Seamless Gemini function calling** — The agent naturally weaves tool calls into conversation flow. It checks availability, creates bookings, and sends invites without the user ever feeling like they're interacting with an API.
- **Support for diverse business types** — From restaurants to medical clinics to tennis courts, the system handles different resource types, capacity models, and booking durations.

## What I learned

- **Gemini's native audio mode is a game-changer** — Compared to speech-to-text → LLM → text-to-speech pipelines, Gemini Live's native audio streaming dramatically reduces latency and produces more natural conversations. The model understands tone, pauses, and conversational cues that get lost in transcription.
- **Prompt engineering for voice is fundamentally different** — Voice agents need explicit instructions about conversational flow, confirmation patterns, and graceful handling of misunderstandings that text bots can ignore.
- **Function calling is the bridge between conversation and action** — Gemini's ability to decide *when* to call tools based on conversation context (not rigid decision trees) makes the interaction feel genuinely intelligent.
- **The "last mile" of audio UX matters enormously** — Small details like waveform visualization, barge-in support, and smooth audio playback transitions are what make the experience feel polished vs. prototype-quality.
- **Solo doesn't mean small** — With the right tools (Turborepo, Prisma, Terraform, shadcn/ui) and a clear architecture, a single developer can ship a production-grade, multi-service platform. The key is making smart decisions about what to build vs. what to leverage.

## What's next for Liveagent.dev - Live Voice Agent for Booking and Reservation

- **Telephony integration** — Connect agents to real phone numbers via Twilio/Google Voice so customers can call in, not just use the web widget.
- **Multi-language support** — Leverage Gemini's multilingual capabilities to serve customers in their preferred language.
- **Vision mode** — Allow customers to share images (e.g., photos of a venue setup they want) using Gemini's multimodal capabilities.
- **SMS/WhatsApp follow-ups** — Automated reminders and confirmation messages after bookings.
- **Multi-tenant SaaS** — Scale from single-tenant to a full marketplace where any business can sign up and deploy an agent in minutes.
- **Custom knowledge bases** — Let businesses upload menus, service catalogs, and FAQs that the agent can reference during calls.
- **Analytics AI** — Use Gemini to analyze conversation patterns and suggest improvements to agent configuration.
