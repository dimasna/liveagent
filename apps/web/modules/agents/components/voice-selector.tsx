"use client";

import { useState, useRef, useCallback } from "react";
import { VOICE_PERSONAS } from "@liveagent/shared";
import { PlayIcon, Loader2Icon, PauseIcon } from "lucide-react";

interface VoiceSelectorProps {
  value: string;
  onChange: (voice: string) => void;
}

// Each voice gets a unique metallic orb gradient palette
const ORB_STYLES: Record<string, { conic: string; radial: string; shadow: string }> = {
  Puck: {
    conic: "conic-gradient(from 220deg, #3b82f6, #93c5fd, #1d4ed8, #60a5fa, #2563eb, #7dd3fc, #3b82f6)",
    radial: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.45) 0%, transparent 50%)",
    shadow: "0 4px 16px rgba(59,130,246,0.35)",
  },
  Charon: {
    conic: "conic-gradient(from 180deg, #334155, #94a3b8, #1e293b, #64748b, #475569, #cbd5e1, #334155)",
    radial: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)",
    shadow: "0 4px 16px rgba(51,65,85,0.4)",
  },
  Kore: {
    conic: "conic-gradient(from 200deg, #ec4899, #f9a8d4, #be185d, #f472b6, #db2777, #fbcfe8, #ec4899)",
    radial: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5) 0%, transparent 50%)",
    shadow: "0 4px 16px rgba(236,72,153,0.35)",
  },
  Fenrir: {
    conic: "conic-gradient(from 160deg, #d97706, #fcd34d, #92400e, #fbbf24, #b45309, #fde68a, #d97706)",
    radial: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.45) 0%, transparent 50%)",
    shadow: "0 4px 16px rgba(217,119,6,0.35)",
  },
  Aoede: {
    conic: "conic-gradient(from 240deg, #8b5cf6, #c4b5fd, #5b21b6, #a78bfa, #7c3aed, #ddd6fe, #8b5cf6)",
    radial: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.5) 0%, transparent 50%)",
    shadow: "0 4px 16px rgba(139,92,246,0.35)",
  },
  Leda: {
    conic: "conic-gradient(from 190deg, #10b981, #6ee7b7, #047857, #34d399, #059669, #a7f3d0, #10b981)",
    radial: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45) 0%, transparent 50%)",
    shadow: "0 4px 16px rgba(16,185,129,0.35)",
  },
  Orus: {
    conic: "conic-gradient(from 210deg, #06b6d4, #67e8f9, #0e7490, #22d3ee, #0891b2, #a5f3fc, #06b6d4)",
    radial: "radial-gradient(circle at 30% 35%, rgba(255,255,255,0.5) 0%, transparent 50%)",
    shadow: "0 4px 16px rgba(6,182,212,0.35)",
  },
  Zephyr: {
    conic: "conic-gradient(from 170deg, #f43f5e, #fda4af, #be123c, #fb7185, #e11d48, #fecdd3, #f43f5e)",
    radial: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5) 0%, transparent 50%)",
    shadow: "0 4px 16px rgba(244,63,94,0.35)",
  },
};

// Client-side audio cache
const audioBlobCache = new Map<string, string>();

export function VoiceSelector({ value, onChange }: VoiceSelectorProps) {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playPreview = useCallback(async (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // If already playing this voice, stop it
    if (playingVoice === voiceId) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingVoice(null);
      return;
    }

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Check cache first
    let blobUrl = audioBlobCache.get(voiceId);

    if (!blobUrl) {
      setLoadingVoice(voiceId);
      try {
        const res = await fetch("/api/voice-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voice: voiceId }),
        });

        if (!res.ok) {
          setLoadingVoice(null);
          return;
        }

        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
        audioBlobCache.set(voiceId, blobUrl);
      } catch {
        setLoadingVoice(null);
        return;
      }
      setLoadingVoice(null);
    }

    // Play the audio
    const audio = new Audio(blobUrl);
    audioRef.current = audio;
    setPlayingVoice(voiceId);

    audio.onended = () => {
      setPlayingVoice(null);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setPlayingVoice(null);
      audioRef.current = null;
    };

    audio.play().catch(() => {
      setPlayingVoice(null);
      audioRef.current = null;
    });
  }, [playingVoice]);

  return (
    <div className="grid grid-cols-2 gap-2">
      {VOICE_PERSONAS.map((voice) => {
        const selected = value === voice.id;
        const orb = ORB_STYLES[voice.id] || ORB_STYLES.Puck;
        const isPlaying = playingVoice === voice.id;
        const isLoading = loadingVoice === voice.id;
        return (
          <div
            key={voice.id}
            role="button"
            tabIndex={0}
            onClick={() => onChange(voice.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(voice.id); } }}
            className={`group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all cursor-pointer ${
              selected
                ? "border-foreground bg-foreground/5 ring-1 ring-foreground/20"
                : "border-border hover:border-foreground/30 hover:bg-accent/50"
            }`}
          >
            {/* Metallic orb avatar */}
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-full transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: orb.conic,
                  boxShadow: selected ? orb.shadow : "none",
                }}
              >
                {/* Glossy highlight overlay */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: orb.radial }}
                />
                {/* Inner ring for depth */}
                <div
                  className="absolute inset-[3px] rounded-full opacity-20"
                  style={{
                    background: orb.conic,
                    filter: "blur(1px)",
                  }}
                />
              </div>
              {/* Play button overlay on orb */}
              <button
                type="button"
                onClick={(e) => playPreview(voice.id, e)}
                className={`absolute inset-0 flex items-center justify-center rounded-full transition-all ${
                  isPlaying || isLoading
                    ? "bg-black/40 opacity-100"
                    : "bg-black/0 opacity-0 group-hover:bg-black/30 group-hover:opacity-100"
                }`}
              >
                {isLoading ? (
                  <Loader2Icon className="h-4 w-4 text-white animate-spin" />
                ) : isPlaying ? (
                  <PauseIcon className="h-4 w-4 text-white fill-white" />
                ) : (
                  <PlayIcon className="h-4 w-4 text-white fill-white" />
                )}
              </button>
              {/* Online indicator */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background transition-colors ${
                  selected ? "bg-green-500" : "bg-muted-foreground/30"
                }`}
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    selected ? "text-foreground" : "text-foreground/80"
                  }`}
                >
                  {voice.name}
                </span>
                <GenderBadge gender={voice.gender} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {voice.tone}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-1">
                {voice.description}
              </p>
            </div>

            {/* Selected checkmark */}
            {selected && (
              <div className="absolute top-2 right-2">
                <svg
                  className="w-4 h-4 text-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GenderBadge({ gender }: { gender: "male" | "female" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0 text-[9px] font-medium ${
        gender === "female"
          ? "bg-pink-500/10 text-pink-400"
          : "bg-blue-500/10 text-blue-400"
      }`}
    >
      {gender === "female" ? "F" : "M"}
    </span>
  );
}
