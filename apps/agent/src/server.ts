import "dotenv/config";

import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyCors from "@fastify/cors";
import { db } from "@liveagent/db";
import { VoiceSession } from "./voice-session.js";
import { z } from "zod";

/** Quick check: does this Buffer look like a JSON text frame (starts with '{')? */
function isUtf8Json(buf: Buffer): boolean {
  return buf.length > 0 && buf[0] === 0x7b; // '{'
}

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? "0.0.0.0";

const app = Fastify({ logger: true });

await app.register(fastifyCors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

await app.register(fastifyWebsocket);

// ---------- Health check ----------

app.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// ---------- Create session ----------

const createSessionSchema = z.object({
  agentId: z.string().min(1),
  callerPhone: z.string().optional(),
  callerName: z.string().optional(),
  callerEmail: z.string().email().optional(),
});

app.post("/sessions", async (request, reply) => {
  const parsed = createSessionSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: parsed.error.flatten() });
  }

  const { agentId, callerPhone, callerName, callerEmail } = parsed.data;

  const agent = await db.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    return reply.status(404).send({ error: "Agent not found" });
  }

  if (agent.status !== "ACTIVE") {
    return reply.status(409).send({ error: "Agent is not active" });
  }

  const sessionId = crypto.randomUUID();

  const conversation = await db.conversation.create({
    data: {
      agentId,
      sessionId,
      callerPhone,
      callerName,
      callerEmail,
    },
  });

  return reply.status(201).send({
    sessionId,
    conversationId: conversation.id,
    wsUrl: `/ws/voice?agentId=${encodeURIComponent(agentId)}&sessionId=${encodeURIComponent(sessionId)}`,
  });
});

// ---------- WebSocket voice streaming ----------

/** Track active sessions for cleanup */
const activeSessions = new Map<string, VoiceSession>();

/** Shared WebSocket handler for both route formats */
async function handleVoiceWs(
  agentId: string,
  sessionId: string,
  socket: import("ws").WebSocket,
  log: typeof app.log
) {
  log.info({ agentId, sessionId }, "WebSocket connection opened");

  const agent = await db.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    log.error({ agentId }, "Agent not found");
    socket.send(JSON.stringify({ type: "error", message: "Agent not found" }));
    socket.close(4004, "Agent not found");
    return;
  }

  if (agent.status !== "ACTIVE") {
    socket.send(JSON.stringify({ type: "error", message: "Agent is not active" }));
    socket.close(4009, "Agent not active");
    return;
  }

  let conversation = await db.conversation.findUnique({
    where: { sessionId },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: { agentId, sessionId, status: "IN_PROGRESS" },
    });
  }

  const voiceSession = new VoiceSession({
    agent,
    sessionId,
    conversationId: conversation.id,
    socket,
    logger: log,
  });

  activeSessions.set(sessionId, voiceSession);

  try {
    await voiceSession.connect();
  } catch (err) {
    log.error({ err }, "Failed to establish ADK voice session");
    socket.send(
      JSON.stringify({ type: "error", message: "Failed to connect to voice AI" })
    );
    socket.close(4500, "AI connection failed");
    activeSessions.delete(sessionId);
    return;
  }

  socket.on("message", (raw: Buffer | string, isBinary: boolean) => {
    // Binary frames = raw PCM audio from playground
    if (isBinary || (raw instanceof Buffer && !isUtf8Json(raw))) {
      const buf = raw instanceof Buffer ? raw : Buffer.from(raw);
      const base64 = buf.toString("base64");
      voiceSession.handleClientMessage({ type: "audio", data: base64 });
      return;
    }

    try {
      const data = typeof raw === "string" ? raw : raw.toString("utf-8");
      const message = JSON.parse(data);

      // Map widget protocol types to internal types
      switch (message.type) {
        case "audio_data":
          voiceSession.handleClientMessage({
            type: "audio",
            data: message.audio,
          });
          break;
        case "text_input":
          voiceSession.handleClientMessage({
            type: "text",
            text: message.text,
          });
          break;
        case "session_end":
          voiceSession.handleClientMessage({
            type: "control",
            action: "end",
          });
          break;
        case "session_start":
          log.info({ sessionId }, "Client sent session_start");
          break;
        default:
          // Pass through messages already in internal format (audio/text/control)
          voiceSession.handleClientMessage(message);
      }
    } catch (err) {
      log.error({ err }, "Invalid WebSocket message from client");
    }
  });

  socket.on("close", async (code: number, reason: Buffer) => {
    log.info({ code, reason: reason.toString() }, "WebSocket connection closed");
    await voiceSession.close();
    activeSessions.delete(sessionId);

    try {
      await db.conversation.update({
        where: { id: conversation!.id },
        data: { status: "COMPLETED", endedAt: new Date() },
      });
    } catch (err) {
      log.error({ err }, "Failed to update conversation on close");
    }
  });

  socket.on("error", (err: Error) => {
    log.error({ err }, "WebSocket error");
  });
}

app.register(async (fastify) => {
  // Route 1: Widget format — /ws/voice?agentId=X&sessionId=Y
  fastify.get<{
    Querystring: { agentId: string; sessionId: string };
  }>("/ws/voice", { websocket: true }, async (socket, request) => {
    const { agentId, sessionId } = request.query;
    await handleVoiceWs(agentId, sessionId, socket, request.log);
  });

  // Route 2: Legacy format — /ws/:agentId/:sessionId
  fastify.get<{
    Params: { agentId: string; sessionId: string };
  }>("/ws/:agentId/:sessionId", { websocket: true }, async (socket, request) => {
    const { agentId, sessionId } = request.params;
    await handleVoiceWs(agentId, sessionId, socket, request.log);
  });
});

// ---------- Graceful shutdown ----------

const shutdown = async () => {
  app.log.info("Shutting down, closing active voice sessions...");
  const closePromises: Promise<void>[] = [];
  for (const [sessionId, session] of activeSessions) {
    closePromises.push(session.close());
    activeSessions.delete(sessionId);
  }
  await Promise.allSettled(closePromises);
  await app.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ---------- Start ----------

try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Agent voice server listening on ${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
