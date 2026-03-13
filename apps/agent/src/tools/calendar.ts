import { FunctionTool } from "@google/adk";
import { z } from "zod";
import { google, type calendar_v3 } from "googleapis";
import type { Agent } from "@liveagent/db";
import { db } from "@liveagent/db";

// ---------------------------------------------------------------------------
// Agent context — set before each session so tools can access calendar creds
// ---------------------------------------------------------------------------

let _activeAgent: Agent | null = null;

export function setActiveAgent(agent: Agent) {
  _activeAgent = agent;
}

function getActiveAgent(): Agent {
  if (!_activeAgent) {
    throw new Error("No active agent set — call setActiveAgent() first");
  }
  return _activeAgent;
}

// ---------------------------------------------------------------------------
// OAuth2 Client Helper
// ---------------------------------------------------------------------------

function createOAuth2Client(agent: Agent) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: agent.calendarAccessToken,
    refresh_token: agent.calendarRefreshToken,
    expiry_date: agent.calendarTokenExpiry?.getTime(),
  });

  // Auto-refresh tokens and persist to DB
  oauth2Client.on("tokens", (tokens) => {
    const updateData: Record<string, unknown> = {};
    if (tokens.access_token) {
      updateData.calendarAccessToken = tokens.access_token;
    }
    if (tokens.refresh_token) {
      updateData.calendarRefreshToken = tokens.refresh_token;
    }
    if (tokens.expiry_date) {
      updateData.calendarTokenExpiry = new Date(tokens.expiry_date);
    }

    if (Object.keys(updateData).length > 0) {
      db.agent
        .update({ where: { id: agent.id }, data: updateData })
        .catch((err) => {
          console.error("Failed to persist refreshed OAuth tokens:", err);
        });
    }
  });

  return oauth2Client;
}

function getCalendar(agent: Agent): calendar_v3.Calendar {
  const auth = createOAuth2Client(agent);
  return google.calendar({ version: "v3", auth });
}

function getCalendarId(agent: Agent): string {
  return agent.calendarId || "primary";
}

// ---------------------------------------------------------------------------
// ADK FunctionTool definitions
// ---------------------------------------------------------------------------

export const checkAvailabilityTool = new FunctionTool({
  name: "check_availability",
  description:
    "Check available time slots for a given date on the business calendar. Returns busy periods and suggests open slots.",
  parameters: z.object({
    date: z.string().describe("Date to check in YYYY-MM-DD format"),
  }),
  execute: async ({ date }) => {
    const agent = getActiveAgent();
    const calendar = getCalendar(agent);
    const calendarId = getCalendarId(agent);
    const timezone = agent.timezone || "America/New_York";

    const dateStart = new Date(`${date}T00:00:00`);
    const dateEnd = new Date(`${date}T23:59:59`);

    const freebusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: dateStart.toISOString(),
        timeMax: dateEnd.toISOString(),
        timeZone: timezone,
        items: [{ id: calendarId }],
      },
    });

    const busySlots =
      freebusyResponse.data.calendars?.[calendarId]?.busy ?? [];

    const dayNames = [
      "sun",
      "mon",
      "tue",
      "wed",
      "thu",
      "fri",
      "sat",
    ] as const;
    const dayOfWeek = dayNames[dateStart.getDay()];
    const operatingHours = agent.operatingHours as Record<
      string,
      { open: string; close: string } | null
    > | null;

    const dayHours = operatingHours?.[dayOfWeek];

    if (!dayHours) {
      return {
        date,
        available: false,
        message: "Business is closed on this day.",
        busySlots: [],
      };
    }

    const slotDuration = agent.bookingDuration || 60;
    const availableSlots = computeAvailableSlots(
      date,
      dayHours.open,
      dayHours.close,
      busySlots.map((s) => ({ start: s.start!, end: s.end! })),
      slotDuration
    );

    return {
      date,
      timezone,
      operatingHours: dayHours,
      busySlots: busySlots.map((s) => ({ start: s.start, end: s.end })),
      availableSlots,
      slotDurationMinutes: slotDuration,
    };
  },
});

export const createBookingTool = new FunctionTool({
  name: "create_booking",
  description: "Create a new booking/reservation on the business calendar.",
  parameters: z.object({
    summary: z
      .string()
      .describe("Title for the booking, e.g. 'Reservation - John Smith'"),
    startTime: z
      .string()
      .describe("Start time in ISO 8601 format, e.g. 2025-03-15T14:00:00"),
    endTime: z
      .string()
      .describe("End time in ISO 8601 format, e.g. 2025-03-15T15:00:00"),
    attendeeEmail: z
      .string()
      .optional()
      .describe("Email address of the person making the reservation"),
    description: z
      .string()
      .optional()
      .describe("Additional notes or details about the booking"),
  }),
  execute: async ({ summary, startTime, endTime, attendeeEmail, description }) => {
    const agent = getActiveAgent();
    const calendar = getCalendar(agent);
    const calendarId = getCalendarId(agent);
    const timezone = agent.timezone || "America/New_York";

    const event: calendar_v3.Schema$Event = {
      summary,
      description,
      start: { dateTime: startTime, timeZone: timezone },
      end: { dateTime: endTime, timeZone: timezone },
    };

    if (attendeeEmail) {
      event.attendees = [{ email: attendeeEmail }];
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: attendeeEmail ? "all" : "none",
    });

    return {
      eventId: response.data.id,
      summary: response.data.summary,
      start: response.data.start?.dateTime,
      end: response.data.end?.dateTime,
      htmlLink: response.data.htmlLink,
      message: `Booking created successfully for ${summary}`,
    };
  },
});

export const rescheduleBookingTool = new FunctionTool({
  name: "reschedule_booking",
  description:
    "Reschedule an existing booking to a new time. Requires the calendar event ID.",
  parameters: z.object({
    eventId: z
      .string()
      .describe("The Google Calendar event ID of the booking to reschedule"),
    newStartTime: z
      .string()
      .describe("New start time in ISO 8601 format"),
    newEndTime: z.string().describe("New end time in ISO 8601 format"),
  }),
  execute: async ({ eventId, newStartTime, newEndTime }) => {
    const agent = getActiveAgent();
    const calendar = getCalendar(agent);
    const calendarId = getCalendarId(agent);
    const timezone = agent.timezone || "America/New_York";

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: {
        start: { dateTime: newStartTime, timeZone: timezone },
        end: { dateTime: newEndTime, timeZone: timezone },
      },
      sendUpdates: "all",
    });

    return {
      eventId: response.data.id,
      summary: response.data.summary,
      newStart: response.data.start?.dateTime,
      newEnd: response.data.end?.dateTime,
      message: `Booking rescheduled to ${newStartTime}`,
    };
  },
});

export const cancelBookingTool = new FunctionTool({
  name: "cancel_booking",
  description: "Cancel an existing booking by deleting the calendar event.",
  parameters: z.object({
    eventId: z
      .string()
      .describe("The Google Calendar event ID of the booking to cancel"),
  }),
  execute: async ({ eventId }) => {
    const agent = getActiveAgent();
    const calendar = getCalendar(agent);
    const calendarId = getCalendarId(agent);

    const event = await calendar.events.get({ calendarId, eventId });

    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: "all",
    });

    return {
      eventId,
      summary: event.data.summary,
      message: `Booking "${event.data.summary}" has been cancelled.`,
    };
  },
});

export const listBookingsTool = new FunctionTool({
  name: "list_bookings",
  description:
    "List all bookings/events for a given date on the business calendar.",
  parameters: z.object({
    date: z
      .string()
      .describe("Date to list bookings for in YYYY-MM-DD format"),
  }),
  execute: async ({ date }) => {
    const agent = getActiveAgent();
    const calendar = getCalendar(agent);
    const calendarId = getCalendarId(agent);
    const timezone = agent.timezone || "America/New_York";

    const timeMin = new Date(`${date}T00:00:00`);
    const timeMax = new Date(`${date}T23:59:59`);

    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: timezone,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items ?? []).map((e) => ({
      eventId: e.id,
      summary: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      attendees: e.attendees?.map((a) => a.email),
      description: e.description,
    }));

    return { date, timezone, count: events.length, bookings: events };
  },
});

// ---------------------------------------------------------------------------
// Export all tools as array
// ---------------------------------------------------------------------------

export const calendarTools = [
  checkAvailabilityTool,
  createBookingTool,
  rescheduleBookingTool,
  cancelBookingTool,
  listBookingsTool,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TimeSlot {
  start: string;
  end: string;
}

function computeAvailableSlots(
  date: string,
  openTime: string,
  closeTime: string,
  busySlots: TimeSlot[],
  slotDurationMinutes: number
): Array<{ start: string; end: string }> {
  const open = new Date(`${date}T${openTime}:00`);
  const close = new Date(`${date}T${closeTime}:00`);

  const busyPeriods = busySlots
    .map((s) => ({
      start: new Date(s.start).getTime(),
      end: new Date(s.end).getTime(),
    }))
    .sort((a, b) => a.start - b.start);

  const available: Array<{ start: string; end: string }> = [];
  const slotMs = slotDurationMinutes * 60 * 1000;

  let cursor = open.getTime();
  const endBoundary = close.getTime();

  for (const busy of busyPeriods) {
    while (cursor + slotMs <= busy.start && cursor + slotMs <= endBoundary) {
      available.push({
        start: new Date(cursor).toISOString(),
        end: new Date(cursor + slotMs).toISOString(),
      });
      cursor += slotMs;
    }
    if (busy.end > cursor) {
      cursor = busy.end;
    }
  }

  while (cursor + slotMs <= endBoundary) {
    available.push({
      start: new Date(cursor).toISOString(),
      end: new Date(cursor + slotMs).toISOString(),
    });
    cursor += slotMs;
  }

  return available;
}
