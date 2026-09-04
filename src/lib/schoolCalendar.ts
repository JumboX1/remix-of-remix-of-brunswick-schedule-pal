/**
 * Brunswick School — Upper School Calendar 2026-2027
 * No-school dates and special schedule days.
 *
 * Sourced from: https://my.brunswickschool.org/calendars/main-calendar (Upper School tab)
 * The edge function "sync-calendar" runs daily at 4 AM ET to refresh
 * data in the school_calendar table. This file provides a local fallback.
 */

export interface SchoolDayInfo {
  reason: string;
  type: "break" | "holiday" | "noschool" | "early_dismissal";
}

function range(
  start: [number, number, number],
  end: [number, number, number],
  info: SchoolDayInfo
): Record<string, SchoolDayInfo> {
  const entries: Record<string, SchoolDayInfo> = {};
  const d = new Date(start[0], start[1] - 1, start[2]);
  const last = new Date(end[0], end[1] - 1, end[2]);
  while (d <= last) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    entries[key] = info;
    d.setDate(d.getDate() + 1);
  }
  return entries;
}

const CALENDAR_DATA: Record<string, SchoolDayInfo> = {
  // --- Before Opening Day (Sept 8, 2026) ---
  ...range([2026, 6, 1], [2026, 9, 7], { reason: "Summer Break", type: "break" }),
  "2026-09-04": { reason: "New Student Orientation", type: "noschool" },
  "2026-09-07": { reason: "Labor Day", type: "holiday" },

  // --- Fall ---
  "2026-09-21": { reason: "Yom Kippur – No School", type: "holiday" },
  "2026-10-12": { reason: "Columbus Day – No School", type: "holiday" },

  // --- Thanksgiving (Nov 24 early dismissal, back Nov 30) ---
  "2026-11-24": { reason: "Early Dismissal for Thanksgiving", type: "early_dismissal" },
  ...range([2026, 11, 25], [2026, 11, 27], { reason: "Thanksgiving Break", type: "break" }),

  // --- Winter Break (Dec 18 early dismissal, classes resume Jan 4) ---
  "2026-12-18": { reason: "Early Dismissal for Holiday Break", type: "early_dismissal" },
  ...range([2026, 12, 21], [2027, 1, 1], { reason: "Winter Break", type: "break" }),
  "2026-12-25": { reason: "Christmas", type: "holiday" },
  "2027-01-01": { reason: "New Year's Day", type: "holiday" },

  // --- Winter ---
  "2027-01-11": { reason: "Exam Study Day – No School", type: "noschool" },
  "2027-01-18": { reason: "Martin Luther King Jr. Day", type: "holiday" },

  // --- Presidents' Weekend (Feb 10 regular dismissal, classes resume Feb 16) ---
  ...range([2027, 2, 11], [2027, 2, 15], { reason: "Presidents' Weekend Break", type: "break" }),

  // --- Spring Break (Mar 5 regular dismissal, classes resume Mar 22) ---
  ...range([2027, 3, 6], [2027, 3, 21], { reason: "Spring Break", type: "break" }),

  "2027-03-26": { reason: "Good Friday – No School", type: "holiday" },
  "2027-04-30": { reason: "Community Service Day", type: "noschool" },
  "2027-05-31": { reason: "Memorial Day", type: "holiday" },

  // --- End of year: exams June 1–4, closing ceremony June 8 ---
  "2027-06-07": { reason: "No School", type: "noschool" },

  // --- Summer Break (June 9, 2027 onwards) ---
  ...range([2027, 6, 9], [2027, 8, 31], { reason: "Summer Break", type: "break" }),
};

// Runtime override from DB
let dbOverrides: Record<string, SchoolDayInfo> = {};

export function mergeDbCalendar(
  rows: Array<{ date: string; reason: string; day_type: string }>
) {
  const overrides: Record<string, SchoolDayInfo> = {};
  for (const row of rows) {
    overrides[row.date] = {
      reason: row.reason,
      type: row.day_type as SchoolDayInfo["type"],
    };
  }
  dbOverrides = overrides;
}

function toKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getSchoolDayInfo(date: Date): SchoolDayInfo | null {
  const key = toKey(date);
  return dbOverrides[key] ?? CALENDAR_DATA[key] ?? null;
}

export function isSchoolDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;

  const info = getSchoolDayInfo(date);
  if (!info) return true;
  if (info.type === "early_dismissal") return true;

  return false;
}

export const CALENDAR_LAST_UPDATED = "2026-09-04";
