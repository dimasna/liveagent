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

type ServerMessage =
  | ServerAudioMessage
  | { type: "session_ready" }
  | { type: "interrupted" }
  | ServerToolCallMessage
  | ServerErrorMessage;

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
    const model = LIVE_MODEL;

    this.config.logger.info(
      { model, sessionId },
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
            endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
            silenceDurationMs: 500,
            prefixPaddingMs: 200,
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
          }
        }
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
      response: unknown;
    }> = [];

    for (const fc of functionCalls) {
      const name = fc.name ?? "unknown";
      this.config.logger.info({ name, args: fc.args }, "Executing tool call");

      this.sendToClient({
        type: "agent_message",
        text: `Checking ${name}...`,
      });
      this.persistMessage("TOOL", JSON.stringify({ name, args: fc.args }));

      try {
        const result = await executeCalendarTool(name, fc.args ?? {});
        responses.push({
          id: fc.id ?? name,
          name,
          response: result,
        });
        this.persistMessage(
          "TOOL",
          JSON.stringify({ name, response: result })
        );
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
