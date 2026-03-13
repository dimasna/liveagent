export const APP_NAME = "liveagent";

export const VOICE_AGENT_PROMPT = `You are a professional voice assistant for {businessName}, a {businessType}.
Your primary role is to help callers make reservations, reschedule, or cancel bookings.

## Key Behaviors:
- Be warm, professional, and concise — this is a phone call, not a chat.
- Always confirm details before making a booking: date, time, party size (if applicable), and caller name.
- Check availability using the calendar tools before confirming any slot.
- If the requested time is unavailable, suggest the nearest available alternatives.
- Respect operating hours: {operatingHours}
- Timezone: {timezone}
- Maximum advance booking: {maxAdvanceDays} days
- Default appointment duration: {bookingDuration} minutes

## Capabilities:
- check_availability: Look up open time slots
- create_booking: Create a new reservation on the calendar
- reschedule_booking: Move an existing booking to a new time
- cancel_booking: Cancel an existing reservation
- list_bookings: Show upcoming bookings for a caller

## Important:
- Never invent availability — always check the calendar first.
- If you cannot help, offer to take a message or suggest calling back.
- End each call politely with a confirmation summary.`;

export const BUSINESS_TYPES = [
  "restaurant",
  "salon",
  "barbershop",
  "clinic",
  "dental_office",
  "spa",
  "fitness_studio",
  "consulting",
  "auto_service",
  "veterinary",
  "photography",
  "tutoring",
  "coworking",
  "other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const PLANS = {
  FREE: {
    name: "Free",
    maxAgents: 1,
    maxMinutesMonth: 100,
    price: 0,
  },
  STARTER: {
    name: "Starter",
    maxAgents: 3,
    maxMinutesMonth: 500,
    price: 29,
  },
  GROWTH: {
    name: "Growth",
    maxAgents: 10,
    maxMinutesMonth: 2000,
    price: 79,
  },
  SCALE: {
    name: "Scale",
    maxAgents: 25,
    maxMinutesMonth: 10000,
    price: 199,
  },
  ENTERPRISE: {
    name: "Enterprise",
    maxAgents: -1,
    maxMinutesMonth: -1,
    price: -1,
  },
} as const;

export const GEMINI_VOICES = [
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Aoede",
  "Leda",
  "Orus",
  "Zephyr",
] as const;

export type GeminiVoice = (typeof GEMINI_VOICES)[number];

export const DEFAULT_OPERATING_HOURS = {
  mon: { open: "09:00", close: "17:00" },
  tue: { open: "09:00", close: "17:00" },
  wed: { open: "09:00", close: "17:00" },
  thu: { open: "09:00", close: "17:00" },
  fri: { open: "09:00", close: "17:00" },
  sat: { open: "10:00", close: "14:00" },
  sun: null,
};
