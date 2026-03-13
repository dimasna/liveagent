"use client";

import { useCallback, useRef, useState } from "react";
import { useAudio } from "./use-audio";
import { AGENT_WS_URL, WS_MESSAGE_TYPES } from "@/lib/config";

export type ConnectionState = "idle" | "connecting" | "connected" | "error";

export interface TranscriptEntry {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface BookingConfirmation {
  id: string;
  service: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
}

interface UseVoiceSessionReturn {
  connect: (agentId: string) => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => void;
  state: ConnectionState;
  transcript: TranscriptEntry[];
  bookingConfirmation: BookingConfirmation | null;
  isMuted: boolean;
  toggleMute: () => void;
  error: string | null;
}

/**
 * Custom hook that encapsulates the full voice session:
 * WebSocket connection, audio capture/playback, transcript management.
 */
export function useVoiceSession(): UseVoiceSessionReturn {
  const [state, setState] = useState<ConnectionState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [bookingConfirmation, setBookingConfirmation] =
    useState<BookingConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const {
    startCapture,
    stopCapture,
    playAudio,
    stopPlayback,
    isMuted,
    toggleMute,
  } = useAudio();

  const addTranscriptEntry = useCallback(
    (role: "user" | "agent", text: string, isFinal: boolean) => {
      setTranscript((prev) => {
        // For interim transcripts, update the last entry of the same role if not final
        if (!isFinal) {
          const lastIdx = prev.findLastIndex(
            (e) => e.role === role && !e.isFinal,
          );
          if (lastIdx >= 0) {
            const updated = [...prev];
            updated[lastIdx] = { ...updated[lastIdx]!, text, isFinal };
            return updated;
          }
        }

        return [
          ...prev,
          {
            id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            role,
            text,
            timestamp: Date.now(),
            isFinal,
          },
        ];
      });
    },
    [],
  );

  const handleWsMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case WS_MESSAGE_TYPES.SESSION_READY:
            setState("connected");
            break;

          case WS_MESSAGE_TYPES.AUDIO_RESPONSE:
            if (data.audio) {
              playAudio(data.audio);
            }
            break;

          case WS_MESSAGE_TYPES.TRANSCRIPT:
            addTranscriptEntry(
              data.role || "agent",
              data.text,
              data.isFinal ?? true,
            );
            break;

          case WS_MESSAGE_TYPES.AGENT_MESSAGE:
            addTranscriptEntry("agent", data.text, true);
            break;

          case WS_MESSAGE_TYPES.BOOKING_CONFIRMED:
            setBookingConfirmation(data.booking);
            addTranscriptEntry(
              "agent",
              `Booking confirmed! ${data.booking.service} on ${data.booking.date} at ${data.booking.time}.`,
              true,
            );
            break;

          case WS_MESSAGE_TYPES.ERROR:
            console.error("Agent error:", data.message);
            setError(data.message);
            break;

          default:
            console.log("Unknown WS message type:", data.type);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    },
    [playAudio, addTranscriptEntry],
  );

  const connect = useCallback(
    async (agentId: string) => {
      if (wsRef.current) {
        disconnect();
      }

      setState("connecting");
      setError(null);
      setTranscript([]);
      setBookingConfirmation(null);

      const sessionId = crypto.randomUUID();
      sessionIdRef.current = sessionId;

      try {
        const wsUrl = `${AGENT_WS_URL}/ws/voice?agentId=${encodeURIComponent(agentId)}&sessionId=${encodeURIComponent(sessionId)}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: WS_MESSAGE_TYPES.SESSION_START,
              agentId,
              sessionId,
            }),
          );

          // Start microphone capture once WebSocket is open
          startCapture((base64Audio) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: WS_MESSAGE_TYPES.AUDIO_DATA,
                  audio: base64Audio,
                  sessionId,
                }),
              );
            }
          }).catch((err) => {
            console.error("Microphone access denied:", err);
            setError(
              "Microphone access is required for voice calls. Please allow microphone access and try again.",
            );
            setState("error");
          });
        };

        ws.onmessage = handleWsMessage;

        ws.onerror = () => {
          setError("Connection error. Please try again.");
          setState("error");
        };

        ws.onclose = (event) => {
          if (state === "connected" || state === "connecting") {
            if (!event.wasClean) {
              setError("Connection lost. Please try again.");
            }
            setState("idle");
          }
          stopCapture();
          stopPlayback();
          wsRef.current = null;
        };
      } catch (err) {
        console.error("Failed to connect:", err);
        setError("Failed to connect to agent. Please try again.");
        setState("error");
      }
    },
    [handleWsMessage, startCapture, stopCapture, stopPlayback, state],
  );

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: WS_MESSAGE_TYPES.SESSION_END,
            sessionId: sessionIdRef.current,
          }),
        );
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    stopCapture();
    stopPlayback();
    setState("idle");
    sessionIdRef.current = null;
  }, [stopCapture, stopPlayback]);

  const sendText = useCallback(
    (text: string) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: WS_MESSAGE_TYPES.TEXT_INPUT,
            text,
            sessionId: sessionIdRef.current,
          }),
        );
        addTranscriptEntry("user", text, true);
      }
    },
    [addTranscriptEntry],
  );

  return {
    connect,
    disconnect,
    sendText,
    state,
    transcript,
    bookingConfirmation,
    isMuted,
    toggleMute,
    error,
  };
}
