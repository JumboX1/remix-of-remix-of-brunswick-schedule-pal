export const BLOCKS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type Block = (typeof BLOCKS)[number];

export type ClassType = "upperclassman" | "underclassman";

export interface ScheduleSlot {
  label: string;
  start: string;
  end: string;
  type: "assembly" | "advisory" | "class" | "lunch";
  block?: Block;
}

// The 7-block rotation: each school day picks 5 blocks in order
const ROTATION_CYCLE: Block[][] = [
  ["A", "B", "C", "D", "E"],
  ["F", "G", "A", "B", "C"],
  ["D", "E", "F", "G", "A"],
  ["B", "C", "D", "E", "F"],
  ["G", "A", "B", "C", "D"],
  ["E", "F", "G", "A", "B"],
  ["C", "D", "E", "F", "G"],
];

// Reference: March 5, 2026 (Thu) = rotation index 0
// March 6 (Fri) = index 1, then Spring Break is skipped
// March 23 (Mon) = index 2 → D,E,F,G,A ✓
const EPOCH = new Date(2026, 2, 5); // March 5, 2026

import { isSchoolDay } from "./schoolCalendar";

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Count school days (weekdays that are NOT breaks/holidays) from epoch to date.
 * Returns the rotation index (0-6).
 */
export function getRotationIndex(date: Date): number {
  const start = new Date(EPOCH);
  start.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  let schoolDays = 0;
  const current = new Date(start);

  if (target >= start) {
    while (current < target) {
      if (isSchoolDay(current)) {
        schoolDays++;
      }
      current.setDate(current.getDate() + 1);
    }
  } else {
    const temp = new Date(target);
    while (temp < start) {
      if (isSchoolDay(temp)) {
        schoolDays--;
      }
      temp.setDate(temp.getDate() + 1);
    }
  }

  return ((schoolDays % 7) + 7) % 7;
}

export function getBlocksForDate(date: Date): Block[] {
  if (!isSchoolDay(date)) return [];
  return ROTATION_CYCLE[getRotationIndex(date)];
}

export function getDaySchedule(
  date: Date,
  classType: ClassType = "underclassman"
): ScheduleSlot[] {
  if (!isSchoolDay(date)) return [];

  const dayOfWeek = date.getDay();
  const blocks = getBlocksForDate(date);
  const slots: ScheduleSlot[] = [];

  if (dayOfWeek === 3) {
    // WEDNESDAY — late start, 50-min classes, no advisory
    slots.push({ label: blocks[0], start: "9:10", end: "10:00", type: "class", block: blocks[0] });
    slots.push({ label: blocks[1], start: "10:10", end: "11:00", type: "class", block: blocks[1] });
    slots.push({ label: blocks[2], start: "11:10", end: "12:00", type: "class", block: blocks[2] });

    if (classType === "underclassman") {
      slots.push({ label: "Lunch", start: "12:05", end: "12:30", type: "lunch" });
      slots.push({ label: blocks[3], start: "12:35", end: "1:25", type: "class", block: blocks[3] });
    } else {
      slots.push({ label: blocks[3], start: "12:05", end: "12:55", type: "class", block: blocks[3] });
      slots.push({ label: "Lunch", start: "12:55", end: "1:25", type: "lunch" });
    }

    slots.push({ label: blocks[4], start: "1:35", end: "2:25", type: "class", block: blocks[4] });
  } else if (dayOfWeek === 1) {
    // MONDAY — assembly at start, advisory mid-day
    slots.push({ label: "Assembly", start: "7:45", end: "8:00", type: "assembly" });
    slots.push({ label: blocks[0], start: "8:10", end: "9:10", type: "class", block: blocks[0] });
    slots.push({ label: blocks[1], start: "9:20", end: "10:20", type: "class", block: blocks[1] });
    slots.push({ label: "Advisory", start: "10:30", end: "10:55", type: "advisory" });
    slots.push({ label: blocks[2], start: "11:00", end: "11:55", type: "class", block: blocks[2] });

    if (classType === "underclassman") {
      slots.push({ label: blocks[3], start: "12:05", end: "1:05", type: "class", block: blocks[3] });
      slots.push({ label: "Lunch", start: "1:05", end: "1:35", type: "lunch" });
    } else {
      slots.push({ label: "Lunch", start: "12:00", end: "12:30", type: "lunch" });
      slots.push({ label: blocks[3], start: "12:30", end: "1:30", type: "class", block: blocks[3] });
    }

    slots.push({ label: blocks[4], start: "1:40", end: "2:40", type: "class", block: blocks[4] });
  } else if (dayOfWeek === 5) {
    // FRIDAY — no advisory
    slots.push({ label: blocks[0], start: "8:00", end: "9:00", type: "class", block: blocks[0] });
    slots.push({ label: blocks[1], start: "9:10", end: "10:10", type: "class", block: blocks[1] });
    slots.push({ label: blocks[2], start: "10:20", end: "11:20", type: "class", block: blocks[2] });

    if (classType === "underclassman") {
      slots.push({ label: blocks[3], start: "11:30", end: "12:30", type: "class", block: blocks[3] });
      slots.push({ label: "Lunch", start: "12:30", end: "1:00", type: "lunch" });
    } else {
      slots.push({ label: "Lunch", start: "11:25", end: "11:55", type: "lunch" });
      slots.push({ label: blocks[3], start: "11:55", end: "12:55", type: "class", block: blocks[3] });
    }

    slots.push({ label: blocks[4], start: "1:10", end: "2:10", type: "class", block: blocks[4] });
  } else {
    // TUESDAY, THURSDAY — advisory at start
    slots.push({ label: "Advisory", start: "7:45", end: "8:00", type: "advisory" });
    slots.push({ label: blocks[0], start: "8:10", end: "9:10", type: "class", block: blocks[0] });
    slots.push({ label: blocks[1], start: "9:20", end: "10:20", type: "class", block: blocks[1] });
    slots.push({ label: blocks[2], start: "10:30", end: "11:30", type: "class", block: blocks[2] });

    if (classType === "underclassman") {
      slots.push({ label: blocks[3], start: "11:40", end: "12:40", type: "class", block: blocks[3] });
      slots.push({ label: "Lunch", start: "12:40", end: "1:10", type: "lunch" });
    } else {
      slots.push({ label: "Lunch", start: "11:35", end: "12:05", type: "lunch" });
      slots.push({ label: blocks[3], start: "12:05", end: "1:05", type: "class", block: blocks[3] });
    }

    slots.push({ label: blocks[4], start: "1:20", end: "2:20", type: "class", block: blocks[4] });
  }

  return slots;
}

export function getDayName(dayOfWeek: number): string {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek];
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
