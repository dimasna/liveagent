import { NextRequest } from "next/server";
import { getAuthUser } from "@lib/auth";
import { GoogleGenAI } from "@google/genai";
import { BUSINESS_TYPES } from "@liveagent/shared";

const PLACES_API_URL =
  "https://places.googleapis.com/v1/places:searchText";

const DAY_MAP: Record<number, string> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface PlacePeriod {
  open: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
}

function mapOperatingHours(
  periods: PlacePeriod[] | undefined
): Record<string, { open: string; close: string } | null> {
  const hours: Record<string, { open: string; close: string } | null> = {
    mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null,
  };
  if (!periods || periods.length === 0) return hours;
  for (const period of periods) {
    const dayKey = DAY_MAP[period.open.day];
    if (!dayKey) continue;
    const openTime = `${pad(period.open.hour)}:${pad(period.open.minute)}`;
    let closeTime: string;
    if (!period.close) {
      // No close = open 24 hours
      closeTime = "23:59";
    } else if (period.close.day !== period.open.day) {
      // Cross-midnight: business closes the next day (e.g. 5pm-2am).
      // Cap at end of opening day since our model is per-day.
      closeTime = "23:59";
    } else {
      closeTime = `${pad(period.close.hour)}:${pad(period.close.minute)}`;
    }
    const existing = hours[dayKey];
    if (existing) {
      if (openTime < existing.open) existing.open = openTime;
      if (closeTime > existing.close) existing.close = closeTime;
    } else {
      hours[dayKey] = { open: openTime, close: closeTime };
    }
  }
  return hours;
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// POST /api/agents/research — AI-powered business research with SSE streaming
export async function POST(req: NextRequest) {
  try {
    await getAuthUser();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const { businessName, website } = body as {
    businessName: string;
    website?: string;
  };

  if (!businessName) {
    return new Response(
      JSON.stringify({ error: "businessName is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(new TextEncoder().encode(sseEvent(event, data)));
      };

      // Accumulated result
      const result: Record<string, unknown> = {
        businessName,
        businessType: "other",
        address: "",
        phone: "",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        operatingHours: null,
        pricing: "",
        capacityType: "slots",
        capacityCount: 0,
        capacityLabel: "",
        greeting: "",
        instruction: "",
        voice: "Puck",
        bookingDuration: 60,
        maxAdvanceDays: 30,
      };

      // --- Step 1: Google Places lookup ---
      send("step", {
        task: "places",
        status: "searching",
        message: "Searching Google Places...",
      });

      let placesData: Record<string, unknown> | null = null;

      if (placesApiKey) {
        try {
          const textQuery = website
            ? `${businessName} ${website}`
            : businessName;
          const placesRes = await fetch(PLACES_API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Goog-Api-Key": placesApiKey,
              "X-Goog-FieldMask":
                "places.displayName,places.formattedAddress,places.regularOpeningHours,places.internationalPhoneNumber,places.websiteUri,places.location",
            },
            body: JSON.stringify({ textQuery, maxResultCount: 1 }),
          });

          if (placesRes.ok) {
            const data = await placesRes.json();
            console.log("[Places API] Raw response:", JSON.stringify(data, null, 2));
            const place = data.places?.[0];
            if (place) {
              placesData = {
                name: place.displayName?.text || "",
                address: place.formattedAddress || "",
                phone: place.internationalPhoneNumber || "",
                website: place.websiteUri || "",
                operatingHours: mapOperatingHours(
                  place.regularOpeningHours?.periods
                ),
              };
              result.address = placesData.address;
              result.phone = placesData.phone;
              result.operatingHours = placesData.operatingHours;

              // Resolve business timezone from coordinates
              const lat = place.location?.latitude;
              const lng = place.location?.longitude;
              if (lat && lng && placesApiKey) {
                try {
                  const timestamp = Math.floor(Date.now() / 1000);
                  const tzRes = await fetch(
                    `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${placesApiKey}`
                  );
                  if (tzRes.ok) {
                    const tzData = await tzRes.json();
                    if (tzData.timeZoneId) {
                      result.timezone = tzData.timeZoneId;
                    }
                  }
                } catch {
                  // Keep default timezone if lookup fails
                }
              }

              send("step", {
                task: "places",
                status: "done",
                message: `Found "${placesData.name}" on Google`,
              });
            } else {
              send("step", {
                task: "places",
                status: "done",
                message: "No exact match found on Google Places",
              });
            }
          } else {
            const errorBody = await placesRes.text();
            console.log("[Places API] Error:", placesRes.status, errorBody);
            send("step", {
              task: "places",
              status: "done",
              message: "Google Places lookup skipped",
            });
          }
        } catch {
          send("step", {
            task: "places",
            status: "done",
            message: "Google Places lookup failed",
          });
        }
      } else {
        send("step", {
          task: "places",
          status: "done",
          message: "Google Places not configured — skipped",
        });
      }

      // --- Step 2: AI Analysis with Gemini ---
      if (!apiKey) {
        send("step", {
          task: "analyze",
          status: "done",
          message: "AI analysis skipped — no API key configured",
        });
        send("complete", result);
        controller.close();
        return;
      }

      send("step", {
        task: "analyze",
        status: "searching",
        message: "Analyzing business type...",
      });

      try {
        const ai = new GoogleGenAI({ apiKey });

        const businessTypesStr = BUSINESS_TYPES.join(", ");
        const placesContext = placesData
          ? `\nGoogle Places data:\n- Name: ${placesData.name}\n- Address: ${placesData.address}\n- Phone: ${placesData.phone}\n- Website: ${placesData.website}\n- Operating Hours: ${JSON.stringify(placesData.operatingHours)}`
          : "\nNo Google Places data available.";

        const prompt = `You are a business research assistant helping set up an AI voice agent for a business.

Business Name: ${businessName}
Website: ${website || "Not provided"}
${placesContext}

Research this business and return a JSON object with the following fields. Use the Google search grounding to find real information about this business. If you cannot find specific info, make reasonable assumptions based on the business type.

Required JSON fields:
{
  "businessType": one of [${businessTypesStr}],
  "pricing": brief pricing description (e.g. "$15-30 per person", "$50/hr", "Varies by service"),
  "capacityType": what unit this business books by — one of: "tables", "rooms", "chairs", "courts", "slots", "units" (pick the most appropriate for the business type),
  "capacityCount": estimated total number of that unit (number, e.g. 20 for tables, 10 for rooms, 8 for chairs),
  "capacityLabel": human-readable capacity summary (e.g. "20 tables (~80 seats)", "10 rooms", "6 styling chairs"),
  "greeting": a warm, professional greeting message the voice agent should use when answering calls (1-2 sentences, personalized to this business),
  "instruction": custom instructions for the voice agent that include:
    - Business-specific knowledge (menu items, services offered, specialties)
    - Policies (cancellation policy, deposit requirements, dress code, etc.)
    - Personality/brand voice (formal, casual, friendly, etc.)
    - Any special instructions based on the business type
    Keep it concise but informative (200-400 words),
  "bookingDuration": typical duration per booking in minutes (number). Guidelines by business type:
    - Restaurant: 60-90 min per table
    - Salon/Barbershop: 30-60 min per service
    - Clinic/Dental: 30-60 min per appointment
    - Spa: 60-120 min per treatment
    - Hotel/Room booking: 1440 (1 day = 24hrs)
    - Fitness studio: 45-60 min per class
    - Consulting: 30-60 min per session
    - Photography: 60-120 min per session,
  "maxAdvanceDays": how far in advance bookings should be allowed (number). Guidelines:
    - Restaurant: 30 days
    - Salon/Barbershop: 30 days
    - Hotel/Room booking: 90-180 days
    - Clinic/Dental: 60 days
    - Spa: 30-60 days
    - Consulting: 30 days
    - Event/Photography: 90 days,
  "voice": recommended voice from [Puck, Charon, Kore, Fenrir, Aoede, Leda, Orus, Zephyr] - pick one that matches the business brand
}

Return ONLY valid JSON, no markdown or explanation.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.7,
          },
        });

        send("step", {
          task: "analyze",
          status: "done",
          message: "Business type identified",
        });

        send("step", {
          task: "details",
          status: "searching",
          message: "Researching pricing & capacity...",
        });

        // Parse AI response
        const text = response.text || "";
        // Extract JSON from response (may be wrapped in ```json...```)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);

            if (parsed.businessType && BUSINESS_TYPES.includes(parsed.businessType)) {
              result.businessType = parsed.businessType;
            }
            if (parsed.pricing) result.pricing = parsed.pricing;
            if (parsed.capacityType) result.capacityType = parsed.capacityType;
            if (parsed.capacityCount && typeof parsed.capacityCount === "number") {
              result.capacityCount = parsed.capacityCount;
            }
            if (parsed.capacityLabel) result.capacityLabel = parsed.capacityLabel;
            if (parsed.greeting) result.greeting = parsed.greeting;
            if (parsed.instruction) result.instruction = parsed.instruction;
            if (parsed.bookingDuration && typeof parsed.bookingDuration === "number") {
              result.bookingDuration = parsed.bookingDuration;
            }
            if (parsed.maxAdvanceDays && typeof parsed.maxAdvanceDays === "number") {
              result.maxAdvanceDays = parsed.maxAdvanceDays;
            }
            if (parsed.voice) result.voice = parsed.voice;

            send("step", {
              task: "details",
              status: "done",
              message: "Pricing & capacity researched",
            });

            send("step", {
              task: "prompt",
              status: "done",
              message: "Brand voice & system prompt created",
            });
          } catch {
            send("step", {
              task: "details",
              status: "done",
              message: "Could not parse AI response — using defaults",
            });
          }
        } else {
          send("step", {
            task: "details",
            status: "done",
            message: "AI response was empty — using defaults",
          });
        }
      } catch (err) {
        console.error("Gemini research error:", err);
        send("step", {
          task: "analyze",
          status: "done",
          message: "AI analysis failed — using defaults",
        });
      }

      // --- Done ---
      send("complete", result);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
