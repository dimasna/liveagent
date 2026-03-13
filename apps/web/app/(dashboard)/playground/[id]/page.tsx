"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";

type ConnectionState = "idle" | "connecting" | "connected" | "error";

interface LogEntry {
  text: string;
  timestamp: Date;
}

export default function PlaygroundPage() {
  const { id: agentId } = useParams<{ id: string }>();
  const [state, setState] = useState<ConnectionState>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const captureWorkletRef = useRef<AudioWorkletNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackWorkletRef = useRef<AudioWorkletNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const isMutedRef = useRef(false);

  const sessionId = useRef(
    `test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  function addLog(text: string) {
    setLogs((prev) => [...prev, { text, timestamp: new Date() }]);
  }

  // Convert Float32 [-1,1] to Int16 PCM bytes
  function float32ToPcm16(float32: Float32Array): ArrayBuffer {
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16.buffer;
  }

  const startCall = useCallback(async () => {
    try {
      setState("connecting");
      setLogs([]);

      // --- Microphone capture via AudioWorklet ---
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const captureCtx = new AudioContext({ sampleRate: 16000 });
      captureContextRef.current = captureCtx;
      await captureCtx.audioWorklet.addModule("/audio-processors/capture.worklet.js");
      const captureWorklet = new AudioWorkletNode(captureCtx, "audio-capture-processor");
      captureWorkletRef.current = captureWorklet;

      const micSource = captureCtx.createMediaStreamSource(stream);
      micSource.connect(captureWorklet);
      // Do NOT connect captureWorklet to destination — that would echo mic audio to speakers

      // --- Playback via AudioWorklet at 24kHz (Gemini output rate) ---
      const playbackCtx = new AudioContext({ sampleRate: 24000 });
      playbackContextRef.current = playbackCtx;
      await playbackCtx.audioWorklet.addModule("/audio-processors/playback.worklet.js");
      const playbackWorklet = new AudioWorkletNode(playbackCtx, "pcm-processor");
      playbackWorkletRef.current = playbackWorklet;

      // Gain node for volume control (matches reference: worklet → gain → destination)
      const gainNode = playbackCtx.createGain();
      gainNode.gain.value = 1.0;
      gainNodeRef.current = gainNode;
      playbackWorklet.connect(gainNode);
      gainNode.connect(playbackCtx.destination);

      // --- WebSocket ---
      const wsUrl = `${process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:8080"}/ws/${agentId}/${sessionId.current}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setState("connected");
        addLog("Connected to agent");

        // Send captured audio as binary PCM
        captureWorklet.port.onmessage = (event) => {
          if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;
          if (event.data.type === "audio") {
            const pcmBuffer = float32ToPcm16(event.data.data);
            ws.send(new Uint8Array(pcmBuffer));
          }
        };
      };

      ws.binaryType = "arraybuffer";

      ws.onmessage = (event) => {
        // Binary frame = raw PCM audio from Gemini (fastest path)
        if (event.data instanceof ArrayBuffer) {
          playAudioBuffer(event.data);
          return;
        }

        // Text frame = JSON control message
        try {
          const data = JSON.parse(event.data);

          if (data.type === "interrupted") {
            console.log("[Playground] Interrupt received — clearing playback queue");
            playbackWorklet.port.postMessage("interrupt");
            addLog("Agent interrupted");
          }

          if (data.type === "agent_message") {
            addLog(data.text);
          }

          if (data.type === "error") {
            addLog(`Error: ${data.message}`);
          }

          if (data.type === "session_ready") {
            addLog("Session ready — speak now");
          }
        } catch {
          // ignore malformed text
        }
      };

      ws.onerror = () => {
        setState("error");
        addLog("Connection error");
      };
      ws.onclose = () => {
        setState("idle");
        addLog("Disconnected");
        cleanup();
      };
    } catch (err) {
      console.error("Failed to start call:", err);
      setState("error");
    }
  }, [agentId]);

  function playAudioBuffer(buffer: ArrayBuffer) {
    if (!playbackWorkletRef.current || !playbackContextRef.current) return;

    // Resume audio context if suspended (browser autoplay policy)
    if (playbackContextRef.current.state === "suspended") {
      playbackContextRef.current.resume();
    }

    // Convert Int16 PCM to Float32 and post to playback worklet
    const int16 = new Int16Array(buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }
    playbackWorkletRef.current.port.postMessage(float32);
  }

  function cleanup() {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    captureWorkletRef.current?.disconnect();
    captureWorkletRef.current = null;
    if (captureContextRef.current && captureContextRef.current.state !== "closed") {
      captureContextRef.current.close();
    }
    captureContextRef.current = null;
    playbackWorkletRef.current?.port.postMessage("interrupt");
    playbackWorkletRef.current?.disconnect();
    playbackWorkletRef.current = null;
    gainNodeRef.current?.disconnect();
    gainNodeRef.current = null;
    if (playbackContextRef.current && playbackContextRef.current.state !== "closed") {
      playbackContextRef.current.close();
    }
    playbackContextRef.current = null;
  }

  function endCall() {
    wsRef.current?.close();
    cleanup();
    setState("idle");
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Voice Playground</h1>
        <p className="text-sm text-muted-foreground">
          Test your agent with a live voice conversation
        </p>
      </div>

      <div className="flex flex-1 gap-6">
        {/* Call controls */}
        <div className="flex w-80 flex-col items-center justify-center rounded-xl border border-border p-8">
          <div
            className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full ${
              state === "connected"
                ? "animate-pulse bg-green-100 dark:bg-green-900"
                : state === "connecting"
                  ? "animate-pulse bg-yellow-100 dark:bg-yellow-900"
                  : "bg-muted"
            }`}
          >
            <svg
              className={`h-10 w-10 ${
                state === "connected"
                  ? "text-green-600"
                  : state === "connecting"
                    ? "text-yellow-600"
                    : "text-muted-foreground"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          </div>

          <p className="mb-6 text-sm font-medium capitalize">{state}</p>

          <div className="flex gap-3">
            {state === "idle" || state === "error" ? (
              <button
                onClick={startCall}
                className="rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"
              >
                Start Call
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsMuted(!isMuted);
                    isMutedRef.current = !isMutedRef.current;
                    if (mediaStreamRef.current) {
                      mediaStreamRef.current.getAudioTracks().forEach((t) => {
                        t.enabled = isMutedRef.current ? false : true;
                      });
                    }
                  }}
                  className={`rounded-full px-4 py-3 text-sm font-medium ${
                    isMuted
                      ? "bg-red-100 text-red-600 dark:bg-red-900"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isMuted ? "Unmute" : "Mute"}
                </button>
                <button
                  onClick={endCall}
                  className="rounded-full bg-red-600 px-6 py-3 text-sm font-medium text-white hover:bg-red-700"
                >
                  End Call
                </button>
              </>
            )}
          </div>
        </div>

        {/* Activity log */}
        <div className="flex flex-1 flex-col rounded-xl border border-border">
          <div className="border-b border-border px-6 py-4">
            <h2 className="font-semibold">Activity</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {logs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Start a call to begin
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((entry, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                    <span>{entry.text}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
