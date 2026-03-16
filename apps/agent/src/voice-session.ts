import {
  GoogleGenAI,
  Modality,
  StartSensitivity,
  EndSensitivity,
  ActivityHandling,
  type LiveServerMessage,
  type FunctionCall,
} from "@google/genai";
import type { Agent } from "@liveagent/db";
import { db } from "@liveagent/db";
import type { WebSocket } from "ws";
import { setActiveAgent } from "./tools/index.js";
import { buildSystemPrompt } from "./lib/build-prompt.js";
import {
  calendarToolDeclarations,
  executeCalendarTool,
} from "./tools/live-tools.js";

// ---------------------------------------------------------------------------
// Types: Client <-> Server WebSocket protocol
// ---------------------------------------------------------------------------

interface ClientAudioMessage {
  type: "audio";
  /** Base64-encoded PCM 16kHz 16-bit audio */
  data: string;
}

interface ClientTextMessage {
  type: "text";
  text: string;
}

interface ClientControlMessage {
  type: "control";
  action: "end" | "interrupt";
}

type ClientMessage =
  | ClientAudioMessage
  | ClientTextMessage
  | ClientControlMessage;

interface ServerAudioMessage {
  type: "audio_response";
  audio: string;
}

interface ServerToolCallMessage {
  type: "agent_message";
  text: string;
}

interface ServerErrorMessage {
  type: "error";
  message: string;
}

interface ServerBookingConfirming {
  type: "booking_confirming";
  booking: {
    summary: unknown;
    startTime: unknown;
    endTime: unknown;
  };
}

interface ServerBookingConfirmed {
  type: "booking_confirmed";
  booking: {
    id: unknown;
    summary: unknown;
    start: unknown;
    end: unknown;
    resourceName: unknown;
    attendeeEmail: unknown;
    callerPhone: unknown;
    description: unknown;
    htmlLink: unknown;
  };
}

type ServerMessage =
  | ServerAudioMessage
  | { type: "session_ready" }
  | { type: "interrupted" }
  | ServerToolCallMessage
  | ServerErrorMessage
  | ServerBookingConfirming
  | ServerBookingConfirmed
  | { type: "invite_sent"; email: unknown };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AUDIO_MIME_TYPE = "audio/pcm;rate=16000";
const LIVE_MODEL = "gemini-live-2.5-flash-native-audio";

// ---------------------------------------------------------------------------
// VoiceSession — uses @google/genai Live API for bidi audio streaming
// ---------------------------------------------------------------------------

interface VoiceSessionConfig {
  agent: Agent;
  sessionId: string;
  conversationId: string;
  socket: WebSocket;
  logger: {
    info: (obj: unknown, msg?: string) => void;
    error: (obj: unknown, msg?: string) => void;
    warn: (obj: unknown, msg?: string) => void;
  };
}

export class VoiceSession {
  private readonly config: VoiceSessionConfig;
  private liveSession: import("@google/genai").Session | null = null;
  private closed = false;
  private audioChunksSent = 0;
  private pendingEndCall = false;
  private lastAudioSentAt = 0;

  constructor(config: VoiceSessionConfig) {
    this.config = config;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Establish a Gemini Live session for bidi audio streaming */
  async connect(): Promise<void> {
    const { agent, sessionId } = this.config;

    // Set the active agent so calendar tools can access credentials
    setActiveAgent(agent);

    const systemPrompt = buildSystemPrompt(agent);
    const model = agent.model || LIVE_MODEL;

    this.config.logger.info(
      { model, sessionId, voice: agent.voice || "Puck" },
      "Connecting to Gemini Live API"
    );

    const ai = new GoogleGenAI({
      vertexai: true,
      project: process.env.GOOGLE_CLOUD_PROJECT,
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
    });

    this.liveSession = await ai.live.connect({
      model,
      callbacks: {
        onopen: () => {
          this.config.logger.info({ sessionId }, "Gemini Live session opened");
        },
        onmessage: (msg: LiveServerMessage) => {
          // Debug: log non-audio messages to trace interrupt flow
          if (msg.serverContent) {
            const sc = msg.serverContent;
            if (sc.interrupted || sc.turnComplete) {
              this.config.logger.info(
                { interrupted: sc.interrupted, turnComplete: sc.turnComplete },
                "Gemini serverContent event"
              );
            }
          }
          if (msg.setupComplete) {
            this.config.logger.info("Gemini setup complete");
          }
          this.handleServerMessage(msg);
        },
        onerror: (e: ErrorEvent) => {
          this.config.logger.error(
            { error: e.message },
            "Gemini Live session error"
          );
          if (!this.closed) {
            this.sendToClient({
              type: "error",
              message: "Voice AI encountered an error",
            });
          }
        },
        onclose: () => {
          this.config.logger.info({ sessionId }, "Gemini Live session closed");
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: systemPrompt,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: agent.voice || "Puck",
            },
          },
        },
        // VAD config for real-time conversation
        realtimeInputConfig: {
          activityHandling: ActivityHandling.START_OF_ACTIVITY_INTERRUPTS,
          automaticActivityDetection: {
            startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
            silenceDurationMs: 300,
            prefixPaddingMs: 100,
          },
        },
        tools: calendarToolDeclarations.length > 0
          ? [{ functionDeclarations: calendarToolDeclarations }]
          : undefined,
      },
    });

    this.sendToClient({ type: "session_ready" });
  }

  /** Handle an incoming message from the client WebSocket */
  handleClientMessage(message: ClientMessage): void {
    if (this.closed || !this.liveSession) {
      this.config.logger.warn(
        { type: message.type },
        "Ignoring client message — session is closed"
      );
      return;
    }

    switch (message.type) {
      case "audio":
        this.sendAudioToGemini(message.data);
        break;

      case "text":
        this.sendTextToGemini(message.text);
        break;

      case "control":
        if (message.action === "end") {
          this.close();
        }
        break;

      default:
        this.config.logger.warn({ message }, "Unknown client message type");
    }
  }

  /** Gracefully close the session */
  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;

    this.config.logger.info(
      { sessionId: this.config.sessionId },
      "Closing voice session"
    );

    if (this.liveSession) {
      try {
        this.liveSession.close();
      } catch {
        // May already be closed
      }
      this.liveSession = null;
    }
  }

  // -----------------------------------------------------------------------
  // Upstream: Client WebSocket -> Gemini Live API
  // -----------------------------------------------------------------------

  private sendAudioToGemini(base64Data: string): void {
    if (!this.liveSession) return;

    try {
      this.liveSession.sendRealtimeInput({
        audio: {
          mimeType: AUDIO_MIME_TYPE,
          data: base64Data,
        },
      });
      this.audioChunksSent++;
      // Log every 50 chunks (~3s of audio) to verify audio is flowing
      if (this.audioChunksSent % 50 === 0) {
        this.config.logger.info(
          { chunks: this.audioChunksSent },
          "Audio chunks sent to Gemini"
        );
      }
    } catch (err) {
      this.config.logger.error({ err }, "Error sending audio to Gemini");
    }
  }

  private sendTextToGemini(text: string): void {
    if (!this.liveSession) return;

    this.config.logger.info({ text }, "Sending text to Gemini Live");
    this.persistMessage("USER", text);

    try {
      this.liveSession.sendClientContent({
        turns: text,
        turnComplete: true,
      });
    } catch (err) {
      this.config.logger.error({ err }, "Error sending text to Gemini");
    }
  }

  // -----------------------------------------------------------------------
  // Downstream: Gemini Live API -> Client WebSocket
  // -----------------------------------------------------------------------

  private handleServerMessage(msg: LiveServerMessage): void {
    if (this.closed) return;

    // Audio / text content from the model
    if (msg.serverContent) {
      const { modelTurn, turnComplete, interrupted } = msg.serverContent;

      // Log all non-audio server content for debugging
      if (turnComplete || interrupted) {
        this.config.logger.info(
          { turnComplete, interrupted },
          "Gemini serverContent flags"
        );
      }

      // Gemini signals that the user interrupted (barge-in)
      if (interrupted) {
        this.config.logger.info("Gemini interrupted — user barge-in detected");
        this.sendToClient({ type: "interrupted" });
        // Don't send any audio from this message — it's stale
        return;
      }

      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          // Audio response — send as raw binary for zero-overhead playback
          if (part.inlineData?.data) {
            this.sendBinaryToClient(part.inlineData.data);
            this.lastAudioSentAt = Date.now();
          }
        }
      }

      // If end_call is pending and the model finished speaking, close after
      // a buffer to let the client play remaining audio
      if (turnComplete && this.pendingEndCall) {
        this.config.logger.info("Turn complete after end_call — scheduling close");
        const timeSinceLastAudio = Date.now() - this.lastAudioSentAt;
        // Wait at least 2s after the last audio chunk to let the client finish playback
        const delay = Math.max(2000 - timeSinceLastAudio, 500);
        setTimeout(() => {
          this.sendToClient({ type: "session_ended" as any });
          this.close();
        }, delay);
      }
    }

    // Tool calls from Gemini
    if (msg.toolCall?.functionCalls) {
      this.handleToolCalls(msg.toolCall.functionCalls);
    }
  }

  private async handleToolCalls(functionCalls: FunctionCall[]): Promise<void> {
    const responses: Array<{
      id: string;
      name: string;
      response: Record<string, unknown> | undefined;
    }> = [];

    for (const fc of functionCalls) {
      const name = fc.name ?? "unknown";
      this.config.logger.info({ name, args: fc.args }, "Executing tool call");

      this.persistMessage("TOOL", JSON.stringify({ name, args: fc.args }));

      // Handle end_call — wait for the model to finish speaking before closing
      if (name === "end_call") {
        this.config.logger.info("Agent initiated end_call — waiting for turn to complete before closing");
        this.pendingEndCall = true;
        responses.push({
          id: fc.id ?? name,
          name,
          response: { success: true, message: "Call ended" } as Record<string, unknown>,
        });
        // Send tool response back to Gemini so it can finish its final utterance
        if (this.liveSession && !this.closed) {
          try {
            this.liveSession.sendToolResponse({
              functionResponses: responses,
            });
          } catch {
            // ignore
          }
        }
        // Safety timeout: if turnComplete never fires, close after 8s max
        setTimeout(() => {
          if (!this.closed) {
            this.config.logger.warn("end_call safety timeout — forcing close");
            this.sendToClient({ type: "session_ended" as any });
            this.close();
          }
        }, 8000);
        return;
      }

      // Send "confirming" phase to client before create_booking executes
      if (name === "create_booking") {
        const args = fc.args as Record<string, unknown> | undefined;
        this.sendToClient({
          type: "booking_confirming",
          booking: {
            summary: args?.summary || null,
            startTime: args?.startTime || null,
            endTime: args?.endTime || null,
          },
        });
      }

      try {
        const result = await executeCalendarTool(name, fc.args ?? {});
        responses.push({
          id: fc.id ?? name,
          name,
          response: result as Record<string, unknown> | undefined,
        });
        this.persistMessage(
          "TOOL",
          JSON.stringify({ name, response: result })
        );

        // Send structured booking confirmation to client + update conversation
        if (name === "create_booking" && result && typeof result === "object" && "eventId" in result) {
          const r = result as Record<string, unknown>;
          const args = fc.args as Record<string, unknown> | undefined;
          this.sendToClient({
            type: "booking_confirmed",
            booking: {
              id: r.eventId,
              summary: r.summary,
              start: r.start,
              end: r.end,
              resourceName: r.resourceName || null,
              attendeeEmail: null,
              callerPhone: args?.callerPhone || null,
              description: args?.description || null,
              htmlLink: r.htmlLink || null,
            },
          });

          // Update conversation with booking data + caller info
          const callerPhone = args?.callerPhone as string | undefined;
          const callerNameFromSummary = (r.summary as string)?.split(" - ").pop()?.trim();
          db.conversation
            .update({
              where: { id: this.config.conversationId },
              data: {
                bookingMade: true,
                bookingStart: r.start ? new Date(r.start as string) : undefined,
                bookingEnd: r.end ? new Date(r.end as string) : undefined,
                calendarEventId: r.eventId as string,
                summary: r.summary as string,
                ...(callerPhone && { callerPhone }),
                ...(callerNameFromSummary && { callerName: callerNameFromSummary }),
              },
            })
            .catch((err) => {
              this.config.logger.error({ err }, "Failed to update conversation with booking data");
            });
        }

        // Reset booking card when a booking is cancelled (user is changing)
        if (name === "cancel_booking" && result && typeof result === "object") {
          this.sendToClient({
            type: "booking_confirming" as any,
            booking: { summary: null, startTime: null, endTime: null },
          });
        }

        // Update booking card when rescheduled
        if (name === "reschedule_booking" && result && typeof result === "object" && "eventId" in result) {
          const r = result as Record<string, unknown>;
          this.sendToClient({
            type: "booking_confirmed",
            booking: {
              id: r.eventId,
              summary: r.summary,
              start: r.newStart,
              end: r.newEnd,
              resourceName: null,
              attendeeEmail: null,
              callerPhone: null,
              description: null,
              htmlLink: null,
            },
          });
        }

        // Send invite-sent update to client so widget can show email
        if (name === "send_calendar_invite" && result && typeof result === "object" && "success" in result) {
          const r = result as Record<string, unknown>;
          this.sendToClient({
            type: "invite_sent",
            email: r.email || null,
          });

          // Save caller email to conversation
          if (r.email) {
            db.conversation
              .update({
                where: { id: this.config.conversationId },
                data: { callerEmail: r.email as string },
              })
              .catch((err) => {
                this.config.logger.error({ err }, "Failed to save caller email");
              });
          }
        }
      } catch (err) {
        this.config.logger.error({ err, name }, "Tool execution failed");
        responses.push({
          id: fc.id ?? name,
          name,
          response: { error: `Tool ${name} failed: ${err}` },
        });
      }
    }

    // Send all function responses back to Gemini
    if (this.liveSession && !this.closed) {
      try {
        this.liveSession.sendToolResponse({
          functionResponses: responses,
        });
      } catch (err) {
        this.config.logger.error({ err }, "Error sending tool responses");
      }
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /** Send JSON control messages (session_ready, interrupted, error, agent_message) */
  private sendToClient(msg: ServerMessage): void {
    const { socket } = this.config;
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(msg));
    }
  }

  /** Send audio as raw binary frame — no base64/JSON overhead */
  private sendBinaryToClient(base64Data: string): void {
    const { socket } = this.config;
    if (socket.readyState === socket.OPEN) {
      const buf = Buffer.from(base64Data, "base64");
      socket.send(buf);
    }
  }

  /** Persist a message to the database (fire-and-forget) */
  private persistMessage(
    role: "USER" | "ASSISTANT" | "SYSTEM" | "TOOL",
    content: string
  ): void {
    db.message
      .create({
        data: {
          conversationId: this.config.conversationId,
          role,
          content,
        },
      })
      .catch((err) => {
        this.config.logger.error({ err, role }, "Failed to persist message");
      });
  }
}
