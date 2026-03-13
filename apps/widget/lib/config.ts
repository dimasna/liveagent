/**
 * Widget configuration derived from environment variables.
 *
 * NEXT_PUBLIC_AGENT_WS_URL - WebSocket URL for the agent service
 *   e.g., wss://agent.liveagent.com or ws://localhost:3005
 *
 * NEXT_PUBLIC_WIDGET_API_URL - HTTP API URL for widget config/metadata
 *   e.g., https://api.liveagent.com or http://localhost:3005
 */

export const AGENT_WS_URL =
  process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:3005";

export const WIDGET_API_URL =
  process.env.NEXT_PUBLIC_WIDGET_API_URL || "http://localhost:3005";

/** Audio configuration for voice streaming */
export const AUDIO_CONFIG = {
  sampleRate: 16000,
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
  BOOKING_CONFIRMED: "booking_confirmed",
  ERROR: "error",
  SESSION_READY: "session_ready",
} as const;
