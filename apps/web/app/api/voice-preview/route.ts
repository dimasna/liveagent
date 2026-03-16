import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

/**
 * Wraps raw PCM (16-bit signed, mono) data in a WAV container
 * so browsers can play it with the native Audio element.
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const headerSize = 44;

  const wav = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVE", 8);

  // fmt sub-chunk
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16); // sub-chunk size
  wav.writeUInt16LE(1, 20); // PCM format
  wav.writeUInt16LE(numChannels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(byteRate, 28);
  wav.writeUInt16LE(blockAlign, 32);
  wav.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);
  pcmBuffer.copy(wav, headerSize);

  return wav;
}

const PREVIEW_TEXT: Record<string, string> = {
  Puck: "Hey there! Welcome to our place. How can I help you today?",
  Charon: "Good afternoon. Thank you for calling. How may I assist you?",
  Kore: "Hi! Thanks for calling. I'd love to help you book an appointment.",
  Fenrir: "Hello. Welcome. Let me help you get that reservation set up.",
  Aoede: "Hello, and welcome. How may I help you with your booking today?",
  Leda: "Good day. Thank you for reaching out. How can I assist you?",
  Orus: "Hey, thanks for calling. What can I do for you today?",
  Zephyr: "Hi there! So glad you called. What can I help you with?",
};

// In-memory cache for generated audio (survives across requests in dev)
const audioCache = new Map<string, Buffer>();

/**
 * POST /api/voice-preview
 * Generates a short TTS audio sample for a given Gemini voice using the Gemini API.
 * Returns WAV audio.
 */
export async function POST(req: NextRequest) {
  try {
    const { voice } = await req.json();
    if (!voice || typeof voice !== "string") {
      return NextResponse.json({ error: "voice is required" }, { status: 400 });
    }

    // Check cache
    if (audioCache.has(voice)) {
      const cached = audioCache.get(voice)!;
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          "Content-Type": "audio/wav",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    const text = PREVIEW_TEXT[voice] || "Hello! Thanks for calling. How can I help you today?";

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
    });

    // Use Gemini TTS model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voice,
            },
          },
        },
      },
    });

    // Extract audio data from response
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts;

    if (!parts || parts.length === 0) {
      return NextResponse.json({ error: "No audio generated" }, { status: 500 });
    }

    const audioPart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("audio/"));
    if (!audioPart?.inlineData?.data) {
      return NextResponse.json({ error: "No audio data in response" }, { status: 500 });
    }

    const rawBuffer = Buffer.from(audioPart.inlineData.data, "base64");
    const mimeType: string = audioPart.inlineData.mimeType || "";

    // Gemini TTS returns raw PCM (audio/L16;rate=24000). Browsers can't play
    // raw PCM, so wrap it in a WAV container.
    let audioBuffer: Buffer;
    if (mimeType.startsWith("audio/L16") || mimeType.startsWith("audio/pcm")) {
      const rateMatch = mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
      audioBuffer = pcmToWav(rawBuffer, sampleRate);
    } else if (!mimeType.includes("wav") && !mimeType.includes("mp3") && !mimeType.includes("ogg")) {
      // Unknown format — assume raw PCM at 24kHz (Gemini default)
      audioBuffer = pcmToWav(rawBuffer, 24000);
    } else {
      audioBuffer = rawBuffer;
    }

    // Cache it
    audioCache.set(voice, audioBuffer);

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Voice preview error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate preview" },
      { status: 500 },
    );
  }
}
