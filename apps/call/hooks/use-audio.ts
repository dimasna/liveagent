"use client";

import { useCallback, useRef, useState } from "react";
import { AUDIO_CONFIG } from "@/lib/config";

interface UseAudioReturn {
  startCapture: (onAudioData: (base64: string) => void) => Promise<void>;
  stopCapture: () => void;
  playAudio: (base64: string) => void;
  stopPlayback: () => void;
  isMuted: boolean;
  toggleMute: () => void;
  isCapturing: boolean;
}

/**
 * Custom hook for microphone capture (PCM 16kHz 16-bit mono)
 * and audio playback of agent responses (PCM 24kHz from Gemini).
 */
export function useAudio(): UseAudioReturn {
  const [isMuted, setIsMuted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const isMutedRef = useRef(false);
  const onAudioDataRef = useRef<((base64: string) => void) | null>(null);

  // --- Playback helpers (defined first so startCapture can reference them) ---

  const ensurePlaybackContext = useCallback(() => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({
        sampleRate: AUDIO_CONFIG.playbackSampleRate,
      });
    }
    const ctx = playbackContextRef.current;
    // Resume suspended context (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    return ctx;
  }, []);

  const playNextInQueue = useCallback(() => {
    const ctx = playbackContextRef.current;
    if (!ctx || playbackQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      currentSourceRef.current = null;
      return;
    }

    isPlayingRef.current = true;
    const buffer = playbackQueueRef.current.shift()!;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    currentSourceRef.current = source;

    source.onended = () => {
      playNextInQueue();
    };

    source.start();
  }, []);

  const playAudio = useCallback((base64: string) => {
    const ctx = ensurePlaybackContext();
    const pcm16 = base64ToPcm16(base64);
    const float32 = pcm16ToFloat32(pcm16);

    const buffer = ctx.createBuffer(
      1,
      float32.length,
      AUDIO_CONFIG.playbackSampleRate,
    );
    buffer.getChannelData(0).set(float32);

    playbackQueueRef.current.push(buffer);

    if (!isPlayingRef.current) {
      playNextInQueue();
    }
  }, [ensurePlaybackContext, playNextInQueue]);

  const stopPlayback = useCallback(() => {
    playbackQueueRef.current = [];
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // Already stopped
      }
      currentSourceRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  // --- Capture ---

  const startCapture = useCallback(
    async (onAudioData: (base64: string) => void) => {
      onAudioDataRef.current = onAudioData;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: AUDIO_CONFIG.sampleRate,
            channelCount: AUDIO_CONFIG.channelCount,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const audioContext = new AudioContext({
          sampleRate: AUDIO_CONFIG.sampleRate,
        });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceNodeRef.current = source;

        const bufferSize = 4096;
        const scriptNode = audioContext.createScriptProcessor(
          bufferSize,
          1,
          1,
        );

        scriptNode.onaudioprocess = (event) => {
          if (isMutedRef.current) return;

          const inputData = event.inputBuffer.getChannelData(0);
          const pcm16 = float32ToPcm16(inputData);
          const base64 = arrayBufferToBase64(pcm16.buffer as ArrayBuffer);

          onAudioDataRef.current?.(base64);
        };

        source.connect(scriptNode);
        scriptNode.connect(audioContext.destination);

        // Pre-create playback context during user gesture so it starts "running"
        ensurePlaybackContext();

        setIsCapturing(true);
      } catch (err) {
        console.error("Failed to start audio capture:", err);
        throw err;
      }
    },
    [ensurePlaybackContext],
  );

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    onAudioDataRef.current = null;
    setIsCapturing(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newVal = !prev;
      isMutedRef.current = newVal;

      // Also mute the actual media tracks
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !newVal;
        });
      }

      return newVal;
    });
  }, []);

  return {
    startCapture,
    stopCapture,
    playAudio,
    stopPlayback,
    isMuted,
    toggleMute,
    isCapturing,
  };
}

// --- Audio encoding utilities ---

function float32ToPcm16(float32: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]!));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

function pcm16ToFloat32(pcm16: Int16Array): Float32Array {
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i]! / (pcm16[i]! < 0 ? 0x8000 : 0x7fff);
  }
  return float32;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToPcm16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}
