/**
 * Plain Gemini function declarations for the Live API.
 *
 * The ADK FunctionTool class cannot be used with the @google/genai Live API
 * because ADK v0.5.0 does not support BIDI streaming (runLive is a TODO).
 * Instead, we declare tools as plain FunctionDeclaration objects and
 * manually dispatch execution via executeCalendarTool().
 */
import type { FunctionDeclaration } from "@google/genai";
import {
  checkAvailabilityTool,
  createBookingTool,
  sendCalendarInviteTool,
  rescheduleBookingTool,
  cancelBookingTool,
  listBookingsTool,
} from "./calendar.js";

// ---------------------------------------------------------------------------
// Gemini Live API function declarations
// ---------------------------------------------------------------------------

export const calendarToolDeclarations: FunctionDeclaration[] = [
  {
    name: "check_availability",
    description:
      "Check available time slots for a given date on the business calendar. Returns busy periods, suggests open slots, and shows resource availability (tables, rooms, chairs, etc.).",
    parameters: {
      type: "object" as any,
      properties: {
        date: { type: "string" as any, description: "Date to check in YYYY-MM-DD format" },
      },
      required: ["date"],
    },
  },
  {
    name: "create_booking",
    description:
      "Create a new booking/reservation on the business calendar. Automatically assigns an available resource (table, room, chair) if resources exist.",
    parameters: {
      type: "object" as any,
      properties: {
        summary: {
          type: "string" as any,
          description: "Title for the booking, e.g. 'Reservation - John Smith'",
        },
        startTime: {
          type: "string" as any,
          description: "Start time in ISO 8601 format, e.g. 2025-03-15T14:00:00",
        },
        endTime: {
          type: "string" as any,
          description: "End time in ISO 8601 format, e.g. 2025-03-15T15:00:00",
        },
        attendeeEmail: {
          type: "string" as any,
          description: "Email address of the person making the reservation",
        },
        description: {
          type: "string" as any,
          description: "Additional notes or details about the booking",
        },
        resourceId: {
          type: "string" as any,
          description:
            "ID of a specific resource to book. If not provided, an available resource will be auto-assigned.",
        },
        callerPhone: {
          type: "string" as any,
          description: "Phone number of the caller",
        },
      },
      required: ["summary", "startTime", "endTime"],
    },
  },
  {
    name: "send_calendar_invite",
    description:
      "Send a Google Calendar invite to the caller's email for an existing booking. Use this AFTER create_booking to deliver the calendar event to their inbox.",
    parameters: {
      type: "object" as any,
      properties: {
        eventId: {
          type: "string" as any,
          description: "The Google Calendar event ID returned from create_booking",
        },
        email: {
          type: "string" as any,
          description: "The caller's email address to send the invite to",
        },
      },
      required: ["eventId", "email"],
    },
  },
  {
    name: "reschedule_booking",
    description:
      "Reschedule an existing booking to a new time. Requires the calendar event ID.",
    parameters: {
      type: "object" as any,
      properties: {
        eventId: {
          type: "string" as any,
          description: "The Google Calendar event ID of the booking to reschedule",
        },
        newStartTime: {
          type: "string" as any,
          description: "New start time in ISO 8601 format",
        },
        newEndTime: {
          type: "string" as any,
          description: "New end time in ISO 8601 format",
        },
      },
      required: ["eventId", "newStartTime", "newEndTime"],
    },
  },
  {
    name: "cancel_booking",
    description: "Cancel an existing booking by deleting the calendar event.",
    parameters: {
      type: "object" as any,
      properties: {
        eventId: {
          type: "string" as any,
          description: "The Google Calendar event ID of the booking to cancel",
        },
      },
      required: ["eventId"],
    },
  },
  {
    name: "list_bookings",
    description:
      "List all bookings/events for a given date on the business calendar.",
    parameters: {
      type: "object" as any,
      properties: {
        date: {
          type: "string" as any,
          description: "Date to list bookings for in YYYY-MM-DD format",
        },
      },
      required: ["date"],
    },
  },
  {
    name: "confirm_email",
    description:
      "Display the caller's email on the booking card so they can visually verify it. Call this BEFORE asking the caller to confirm their email, and BEFORE calling send_calendar_invite. This does NOT send anything — it only shows the email on screen for crosschecking.",
    parameters: {
      type: "object" as any,
      properties: {
        email: {
          type: "string" as any,
          description: "The email address the caller provided",
        },
      },
      required: ["email"],
    },
  },
  {
    name: "end_call",
    description:
      "End the phone call. Use this after saying goodbye to the caller. The call will be terminated immediately.",
    parameters: {
      type: "object" as any,
      properties: {},
    },
  },
];

// ---------------------------------------------------------------------------
// Tool executor — delegates to the existing ADK FunctionTool execute fns
// ---------------------------------------------------------------------------

// Use the ADK FunctionTool.runAsync method to execute tools with validation
const toolMap: Record<string, typeof checkAvailabilityTool> = {
  check_availability: checkAvailabilityTool,
  create_booking: createBookingTool,
  send_calendar_invite: sendCalendarInviteTool,
  reschedule_booking: rescheduleBookingTool,
  cancel_booking: cancelBookingTool,
  list_bookings: listBookingsTool,
};

export async function executeCalendarTool(
  name: string,
  args: Record<string, any>
): Promise<unknown> {
  const tool = toolMap[name];
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  // Call the tool's runAsync which handles Zod validation internally
  return tool.runAsync({ args, toolContext: {} as any });
}
