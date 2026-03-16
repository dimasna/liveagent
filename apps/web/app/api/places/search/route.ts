import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getErrorStatus } from "@lib/auth";

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
    mon: null,
    tue: null,
    wed: null,
    thu: null,
    fri: null,
    sat: null,
    sun: null,
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

    // If multiple periods for same day, use earliest open and latest close
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

// GET /api/places/search?query=...&website=...
export async function GET(req: NextRequest) {
  try {
    await getAuthUser();

    const query = req.nextUrl.searchParams.get("query");
    if (!query) {
      return NextResponse.json(
        { error: "query parameter is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Places API is not configured" },
        { status: 500 }
      );
    }

    const website = req.nextUrl.searchParams.get("website") || "";
    const textQuery = website ? `${query} ${website}` : query;

    const res = await fetch(PLACES_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.regularOpeningHours,places.internationalPhoneNumber,places.websiteUri,places.location",
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 5,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("Google Places API error:", errorBody);
      return NextResponse.json(
        { error: "Failed to search places" },
        { status: 502 }
      );
    }

    const data = await res.json();
    const places = data.places || [];

    const results = places.map(
      (place: {
        displayName?: { text?: string };
        formattedAddress?: string;
        internationalPhoneNumber?: string;
        websiteUri?: string;
        regularOpeningHours?: { periods?: PlacePeriod[] };
        location?: { latitude?: number; longitude?: number };
      }) => ({
        name: place.displayName?.text || "",
        address: place.formattedAddress || "",
        phone: place.internationalPhoneNumber || "",
        website: place.websiteUri || "",
        operatingHours: mapOperatingHours(
          place.regularOpeningHours?.periods
        ),
        lat: place.location?.latitude,
        lng: place.location?.longitude,
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: getErrorStatus(error) }
    );
  }
}
