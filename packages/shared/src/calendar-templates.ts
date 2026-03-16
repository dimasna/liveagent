import type { BusinessType } from "./constants";

// ---------------------------------------------------------------------------
// Google Calendar templates — used when creating a dedicated booking calendar
// ---------------------------------------------------------------------------

export interface CalendarTemplate {
  summaryTemplate: string;
  descriptionTemplate: string;
  colorId: string; // Google Calendar colorId (1–24)
}

export const CALENDAR_TEMPLATES: Record<string, CalendarTemplate> = {
  restaurant: {
    summaryTemplate: "Reservations - {businessName}",
    descriptionTemplate:
      "Reservation calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "9", // blueberry
  },
  salon: {
    summaryTemplate: "Appointments - {businessName}",
    descriptionTemplate:
      "Appointment calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "5", // banana
  },
  barbershop: {
    summaryTemplate: "Appointments - {businessName}",
    descriptionTemplate:
      "Appointment calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "6", // tangerine
  },
  clinic: {
    summaryTemplate: "Patient Appointments - {businessName}",
    descriptionTemplate:
      "Patient appointment calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "7", // peacock
  },
  dental_office: {
    summaryTemplate: "Dental Appointments - {businessName}",
    descriptionTemplate:
      "Dental appointment calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "7", // peacock
  },
  spa: {
    summaryTemplate: "Spa Bookings - {businessName}",
    descriptionTemplate:
      "Spa booking calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "3", // grape
  },
  fitness_studio: {
    summaryTemplate: "Class Bookings - {businessName}",
    descriptionTemplate:
      "Class booking calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "11", // tomato
  },
  consulting: {
    summaryTemplate: "Consultations - {businessName}",
    descriptionTemplate:
      "Consultation calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "1", // lavender
  },
  auto_service: {
    summaryTemplate: "Service Appointments - {businessName}",
    descriptionTemplate:
      "Service appointment calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "6", // tangerine
  },
  veterinary: {
    summaryTemplate: "Vet Appointments - {businessName}",
    descriptionTemplate:
      "Veterinary appointment calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "2", // sage
  },
  photography: {
    summaryTemplate: "Photo Sessions - {businessName}",
    descriptionTemplate:
      "Photo session calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "4", // flamingo
  },
  tutoring: {
    summaryTemplate: "Tutoring Sessions - {businessName}",
    descriptionTemplate:
      "Tutoring session calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "8", // graphite
  },
  coworking: {
    summaryTemplate: "Space Bookings - {businessName}",
    descriptionTemplate:
      "Space booking calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "10", // basil
  },
  saas: {
    summaryTemplate: "Demo Bookings - {businessName}",
    descriptionTemplate:
      "Product demo calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "7", // peacock
  },
  other: {
    summaryTemplate: "Bookings - {businessName}",
    descriptionTemplate:
      "Booking calendar for {businessName}. Managed by Liveagent.dev.",
    colorId: "1", // lavender
  },
};

export function getCalendarTemplate(
  businessType: string
): CalendarTemplate {
  return CALENDAR_TEMPLATES[businessType] ?? CALENDAR_TEMPLATES.other;
}

export function resolveTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

// ---------------------------------------------------------------------------
// Resource type config — defines resource naming per business type
// ---------------------------------------------------------------------------

export interface ResourceTypeConfig {
  type: string;        // DB value: "table", "room", "chair", etc.
  label: string;       // Display label: "Table", "Room", "Chair"
  nameTemplate: string; // Name template: "Table {n}", "Room {n}"
  defaultCapacity: number; // Default per-unit capacity (e.g., 4 seats/table)
}

export const RESOURCE_TYPE_CONFIGS: Record<string, ResourceTypeConfig> = {
  restaurant: {
    type: "table",
    label: "Table",
    nameTemplate: "Table {n}",
    defaultCapacity: 4,
  },
  salon: {
    type: "chair",
    label: "Chair",
    nameTemplate: "Chair {n}",
    defaultCapacity: 1,
  },
  barbershop: {
    type: "chair",
    label: "Chair",
    nameTemplate: "Chair {n}",
    defaultCapacity: 1,
  },
  clinic: {
    type: "room",
    label: "Room",
    nameTemplate: "Room {n}",
    defaultCapacity: 1,
  },
  dental_office: {
    type: "chair",
    label: "Dental Chair",
    nameTemplate: "Dental Chair {n}",
    defaultCapacity: 1,
  },
  spa: {
    type: "room",
    label: "Treatment Room",
    nameTemplate: "Treatment Room {n}",
    defaultCapacity: 1,
  },
  fitness_studio: {
    type: "slot",
    label: "Class Slot",
    nameTemplate: "Class Slot {n}",
    defaultCapacity: 20,
  },
  consulting: {
    type: "slot",
    label: "Consultation Slot",
    nameTemplate: "Slot {n}",
    defaultCapacity: 1,
  },
  auto_service: {
    type: "bay",
    label: "Service Bay",
    nameTemplate: "Bay {n}",
    defaultCapacity: 1,
  },
  veterinary: {
    type: "room",
    label: "Exam Room",
    nameTemplate: "Exam Room {n}",
    defaultCapacity: 1,
  },
  photography: {
    type: "slot",
    label: "Session Slot",
    nameTemplate: "Slot {n}",
    defaultCapacity: 1,
  },
  tutoring: {
    type: "slot",
    label: "Session Slot",
    nameTemplate: "Slot {n}",
    defaultCapacity: 1,
  },
  coworking: {
    type: "room",
    label: "Space",
    nameTemplate: "Space {n}",
    defaultCapacity: 1,
  },
  other: {
    type: "slot",
    label: "Slot",
    nameTemplate: "Slot {n}",
    defaultCapacity: 1,
  },
};

export function getResourceTypeConfig(
  businessType: string
): ResourceTypeConfig {
  return RESOURCE_TYPE_CONFIGS[businessType] ?? RESOURCE_TYPE_CONFIGS.other;
}
