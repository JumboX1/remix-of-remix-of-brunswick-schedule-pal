/**
 * Brunswick School Calendar 2025-2026
 * No-school dates and special schedule days.
 * 
 * Sourced from: https://my.brunswickschool.org/calendars/main-calendar
 * The edge function "sync-calendar" runs daily at 4 AM ET to refresh
 * data in the school_calendar table. This file provides a local fallback.
 */

export interface SchoolDayInfo {
  reason: string;
  type: "break" | "holiday" | "noschool" | "early_dismissal";
}

const CALENDAR_DATA: Record<string, SchoolDayInfo> = {
  // --- Labor Day ---
  "2025-09-01": { reason: "Labor Day", type: "holiday" },

  // --- Rosh Hashanah ---
  "2025-09-22": { reason: "Rosh Hashanah", type: "holiday" },
  "2025-09-23": { reason: "Rosh Hashanah", type: "holiday" },

  // --- Yom Kippur ---
  "2025-10-02": { reason: "Yom Kippur", type: "holiday" },

  // --- Columbus Day ---
  "2025-10-13": { reason: "Columbus Day", type: "holiday" },

  // --- Thanksgiving Break ---
  "2025-11-26": { reason: "Thanksgiving Break", type: "break" },
  "2025-11-27": { reason: "Thanksgiving", type: "holiday" },
  "2025-11-28": { reason: "Thanksgiving Break", type: "break" },

  // --- Winter Break ---
  "2025-12-19": { reason: "Early Dismissal – Winter Break", type: "early_dismissal" },
  "2025-12-22": { reason: "Winter Break", type: "break" },
  "2025-12-23": { reason: "Winter Break", type: "break" },
  "2025-12-24": { reason: "Winter Break", type: "break" },
  "2025-12-25": { reason: "Christmas", type: "holiday" },
  "2025-12-26": { reason: "Winter Break", type: "break" },
  "2025-12-29": { reason: "Winter Break", type: "break" },
  "2025-12-30": { reason: "Winter Break", type: "break" },
  "2025-12-31": { reason: "Winter Break", type: "break" },
  "2026-01-01": { reason: "New Year's Day", type: "holiday" },
  "2026-01-02": { reason: "Winter Break", type: "break" },

  // --- MLK Day ---
  "2026-01-19": { reason: "Martin Luther King Jr. Day", type: "holiday" },

  // --- Presidents' Day ---
  "2026-02-16": { reason: "Presidents' Day", type: "holiday" },

  // --- Spring Break (Mar 6 regular dismissal, Mar 7–22 off) ---
  // Mar 6 is a normal school day with regular dismissal — NOT early dismissal
  "2026-03-07": { reason: "Spring Break", type: "break" },
  "2026-03-08": { reason: "Spring Break", type: "break" },
  "2026-03-09": { reason: "Spring Break", type: "break" },
  "2026-03-10": { reason: "Spring Break", type: "break" },
  "2026-03-11": { reason: "Spring Break", type: "break" },
  "2026-03-12": { reason: "Spring Break", type: "break" },
  "2026-03-13": { reason: "Spring Break", type: "break" },
  "2026-03-14": { reason: "Spring Break", type: "break" },
  "2026-03-15": { reason: "Spring Break", type: "break" },
  "2026-03-16": { reason: "Spring Break", type: "break" },
  "2026-03-17": { reason: "Spring Break", type: "break" },
  "2026-03-18": { reason: "Spring Break", type: "break" },
  "2026-03-19": { reason: "Spring Break", type: "break" },
  "2026-03-20": { reason: "Spring Break", type: "break" },
  "2026-03-21": { reason: "Spring Break", type: "break" },
  "2026-03-22": { reason: "Spring Break", type: "break" },

  // --- Good Friday ---
  "2026-04-03": { reason: "Good Friday – No School", type: "holiday" },

  // --- Memorial Day ---
  "2026-05-25": { reason: "Memorial Day", type: "holiday" },

  // --- US Exams / End of Year (typical Brunswick schedule) ---
  "2026-05-28": { reason: "US Exam Period", type: "noschool" },
  "2026-05-29": { reason: "US Exam Period", type: "noschool" },
  "2026-06-01": { reason: "US Exam Period", type: "noschool" },
  "2026-06-02": { reason: "US Exam Period", type: "noschool" },
  "2026-06-03": { reason: "US Exam Period", type: "noschool" },
  "2026-06-04": { reason: "US Exam Period", type: "noschool" },
  "2026-06-05": { reason: "Last Day of School", type: "noschool" },

  // --- Summer Break (June 6 onwards) ---
  ...generateSummerBreak(),
};

function generateSummerBreak(): Record<string, SchoolDayInfo> {
  const entries: Record<string, SchoolDayInfo> = {};
  // June 8 – August 31, 2026
  const start = new Date(2026, 5, 8); // June 8
  const end = new Date(2026, 7, 31); // Aug 31
  const d = new Date(start);
  while (d <= end) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    entries[key] = { reason: "Summer Break", type: "break" };
    d.setDate(d.getDate() + 1);
  }
  return entries;
}

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

export const CALENDAR_LAST_UPDATED = "2026-03-08";
