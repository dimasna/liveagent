import type { Agent } from "@liveagent/db";
import { VOICE_AGENT_PROMPT } from "@liveagent/shared";

/**
 * Build the system prompt for a voice agent by interpolating the shared
 * VOICE_AGENT_PROMPT template with agent-specific configuration values.
 */
export function buildSystemPrompt(agent: Agent): string {
  const operatingHours = formatOperatingHours(agent.operatingHours);

  const prompt = VOICE_AGENT_PROMPT.replace("{businessName}", agent.businessName || "the business")
    .replace("{businessType}", agent.businessType || "business")
    .replace("{timezone}", agent.timezone || "America/New_York")
    .replace("{operatingHours}", operatingHours)
    .replace("{maxAdvanceDays}", String(agent.maxAdvanceDays ?? 30))
    .replace("{bookingDuration}", String(agent.bookingDuration ?? 60));

  // Append any custom instructions the business has configured
  const customInstruction = agent.instruction?.trim();
  if (customInstruction) {
    return `${prompt}\n\n## Additional Instructions from the business:\n${customInstruction}`;
  }

  return prompt;
}

/**
 * Format the operating hours JSON into a human-readable string
 * for inclusion in the system prompt.
 */
function formatOperatingHours(hours: unknown): string {
  if (!hours || typeof hours !== "object") {
    return "Monday-Friday 9:00 AM - 5:00 PM, Saturday 10:00 AM - 2:00 PM, Sunday Closed";
  }

  const hoursMap = hours as Record<
    string,
    { open: string; close: string } | null
  >;

  const dayLabels: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };

  const lines: string[] = [];

  for (const [key, label] of Object.entries(dayLabels)) {
    const slot = hoursMap[key];
    if (!slot) {
      lines.push(`${label}: Closed`);
    } else {
      lines.push(`${label}: ${formatTime(slot.open)} - ${formatTime(slot.close)}`);
    }
  }

  return lines.join(", ");
}

/** Convert "HH:MM" (24h) to a more readable "H:MM AM/PM" format. */
function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr!, 10);
  const minute = minuteStr ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}
