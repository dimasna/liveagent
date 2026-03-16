/**
 * Widget configuration derived from environment variables.
 *
 * NEXT_PUBLIC_AGENT_WS_URL - WebSocket URL for the agent service
 *   e.g., wss://agent.liveagent.com or ws://localhost:3005
 *
 * NEXT_PUBLIC_WIDGET_API_URL - HTTP API URL for widget config/metadata
 *   e.g., https://api.liveagent.com or http://localhost:3005
 */

/** Build-time fallbacks (inlined by Next.js, empty in Docker builds) */
export const AGENT_WS_URL =
  process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:3005";

export const WIDGET_API_URL =
  process.env.NEXT_PUBLIC_WIDGET_API_URL || "http://localhost:3005";

/** Runtime config fetched from /api/config (reads actual env vars at runtime) */
let _runtimeConfig: { agentWsUrl: string; widgetApiUrl: string } | null = null;

export async function getRuntimeConfig() {
  if (_runtimeConfig) return _runtimeConfig;
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    _runtimeConfig = {
      agentWsUrl: data.agentWsUrl || AGENT_WS_URL,
      widgetApiUrl: data.widgetApiUrl || WIDGET_API_URL,
    };
  } catch {
    _runtimeConfig = { agentWsUrl: AGENT_WS_URL, widgetApiUrl: WIDGET_API_URL };
  }
  return _runtimeConfig;
}

/** Audio configuration for voice streaming */
export const AUDIO_CONFIG = {
  /** Capture sample rate — must match what the agent server expects (PCM 16kHz) */
  sampleRate: 16000,
  /** Playback sample rate — Gemini Live API returns audio at 24kHz */
  playbackSampleRate: 24000,
  channelCount: 1,
  bitsPerSample: 16,
} as const;

/** WebSocket message types (must match agent service protocol) */
export const WS_MESSAGE_TYPES = {
  // Client -> Server
  AUDIO_DATA: "audio_data",
  TEXT_INPUT: "text_input",
  SESSION_START: "session_start",
  SESSION_END: "session_end",

  // Server -> Client
  AUDIO_RESPONSE: "audio_response",
  TRANSCRIPT: "transcript",
  AGENT_MESSAGE: "agent_message",
  BOOKING_CONFIRMING: "booking_confirming",
  BOOKING_CONFIRMED: "booking_confirmed",
  INVITE_SENT: "invite_sent",
  SESSION_ENDED: "session_ended",
  ERROR: "error",
  SESSION_READY: "session_ready",
  INTERRUPTED: "interrupted",
} as const;
