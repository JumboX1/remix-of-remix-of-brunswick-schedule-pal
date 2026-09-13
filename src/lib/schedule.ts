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

// The printed 2026–27 planner resets Day 1 on Monday, September 14.
const EPOCH = new Date(2026, 8, 14);

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

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function standardMondayOrTuesday(
  blocks: Block[],
  lunchType: ClassType,
  openingLabel: "Morning Meeting" | "Advisory",
  midmorningLabel = "Flex"
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [
    { label: openingLabel, start: "7:45", end: "8:00", type: "advisory" },
    { label: blocks[0], start: "8:10", end: "9:10", type: "class", block: blocks[0] },
    { label: blocks[1], start: "9:20", end: "10:20", type: "class", block: blocks[1] },
    { label: midmorningLabel, start: "10:30", end: "10:55", type: "advisory" },
    { label: blocks[2], start: "11:05", end: "11:55", type: "class", block: blocks[2] },
  ];
  if (lunchType === "underclassman") {
    slots.push({ label: blocks[3], start: "12:05", end: "1:05", type: "class", block: blocks[3] });
    slots.push({ label: "Lunch", start: "1:05", end: "1:30", type: "lunch" });
  } else {
    slots.push({ label: "Lunch", start: "11:55", end: "12:20", type: "lunch" });
    slots.push({ label: blocks[3], start: "12:30", end: "1:30", type: "class", block: blocks[3] });
  }
  slots.push({ label: blocks[4], start: "1:40", end: "2:40", type: "class", block: blocks[4] });
  return slots;
}

function standardWednesday(blocks: Block[], lunchType: ClassType): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [
    { label: "Advisory", start: "8:45", end: "9:00", type: "advisory" },
    { label: blocks[0], start: "9:10", end: "10:00", type: "class", block: blocks[0] },
    { label: blocks[1], start: "10:10", end: "11:00", type: "class", block: blocks[1] },
    { label: blocks[2], start: "11:10", end: "12:00", type: "class", block: blocks[2] },
  ];
  if (lunchType === "underclassman") {
    slots.push({ label: blocks[3], start: "12:10", end: "1:00", type: "class", block: blocks[3] });
    slots.push({ label: "Lunch", start: "1:00", end: "1:30", type: "lunch" });
  } else {
    slots.push({ label: "Lunch", start: "12:00", end: "12:30", type: "lunch" });
    slots.push({ label: blocks[3], start: "12:30", end: "1:20", type: "class", block: blocks[3] });
  }
  slots.push({ label: blocks[4], start: "1:30", end: "2:20", type: "class", block: blocks[4] });
  return slots;
}

function standardThursday(blocks: Block[], lunchType: ClassType, adjusted = false, assemblyStart = "10:30"): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [
    { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
    { label: blocks[0], start: "8:10", end: adjusted ? "8:55" : "9:10", type: "class", block: blocks[0] },
    { label: blocks[1], start: adjusted ? "9:05" : "9:20", end: adjusted ? "9:50" : "10:20", type: "class", block: blocks[1] },
    { label: adjusted && assemblyStart === "10:10" ? "Clubs Assembly" : "Assembly", start: assemblyStart, end: "10:55", type: "assembly" },
    { label: blocks[2], start: "11:05", end: "11:55", type: "class", block: blocks[2] },
  ];
  if (lunchType === "underclassman") {
    slots.push({ label: blocks[3], start: "12:05", end: "1:05", type: "class", block: blocks[3] });
    slots.push({ label: "Lunch", start: "1:05", end: "1:30", type: "lunch" });
  } else {
    slots.push({ label: "Lunch", start: "11:55", end: "12:20", type: "lunch" });
    slots.push({ label: blocks[3], start: "12:30", end: "1:30", type: "class", block: blocks[3] });
  }
  slots.push({ label: blocks[4], start: "1:40", end: "2:40", type: "class", block: blocks[4] });
  return slots;
}

function standardFriday(blocks: Block[], lunchType: ClassType): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [
    { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
    { label: blocks[0], start: "8:10", end: "9:10", type: "class", block: blocks[0] },
    { label: blocks[1], start: "9:20", end: "10:20", type: "class", block: blocks[1] },
    { label: blocks[2], start: "10:30", end: "11:30", type: "class", block: blocks[2] },
  ];
  if (lunchType === "underclassman") {
    slots.push({ label: blocks[3], start: "11:40", end: "12:40", type: "class", block: blocks[3] });
    slots.push({ label: "Lunch", start: "12:40", end: "1:10", type: "lunch" });
  } else {
    slots.push({ label: "Lunch", start: "11:30", end: "11:55", type: "lunch" });
    slots.push({ label: blocks[3], start: "12:05", end: "1:05", type: "class", block: blocks[3] });
  }
  slots.push({ label: blocks[4], start: "1:15", end: "2:15", type: "class", block: blocks[4] });
  return slots;
}

// Special-day overrides transcribed from the printed 2026–27 daily planner.
const DATE_OVERRIDES: Record<string, { blocks: Block[]; build: (lunchType: ClassType) => ScheduleSlot[] }> = {
  "2026-09-08": {
    blocks: ["A", "B", "C", "D", "E"],
    build: (lunchType) => standardMondayOrTuesday(["A", "B", "C", "D", "E"], lunchType, "Advisory"),
  },
  "2026-09-09": {
    blocks: ["F", "G", "A", "B", "C"],
    build: (lunchType) => standardWednesday(["F", "G", "A", "B", "C"], lunchType),
  },
  "2026-09-17": {
    blocks: ["B", "C", "D", "E", "F"],
    build: (lunchType) => {
      const slots: ScheduleSlot[] = [
        { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
        { label: "B", start: "8:10", end: "9:00", type: "class", block: "B" },
        { label: "C", start: "9:10", end: "10:00", type: "class", block: "C" },
        { label: "Clubs Assembly", start: "10:10", end: "10:55", type: "assembly" },
        { label: "D", start: "11:05", end: "11:55", type: "class", block: "D" },
      ];
      if (lunchType === "underclassman") {
        slots.push({ label: "E", start: "12:05", end: "1:05", type: "class", block: "E" });
        slots.push({ label: "Lunch", start: "1:05", end: "1:30", type: "lunch" });
      } else {
        slots.push({ label: "Lunch", start: "11:55", end: "12:20", type: "lunch" });
        slots.push({ label: "E", start: "12:30", end: "1:30", type: "class", block: "E" });
      }
      slots.push({ label: "F", start: "1:40", end: "2:40", type: "class", block: "F" });
      return slots;
    },
  },
  "2026-10-01": {
    blocks: ["E", "F", "G", "A", "B"],
    build: (lunchType) => standardThursday(["E", "F", "G", "A", "B"], lunchType, true, "10:00"),
  },
  "2026-10-13": {
    blocks: ["E", "F", "G", "A", "B"],
    build: (lunchType) => standardThursday(["E", "F", "G", "A", "B"], lunchType, true, "10:00"),
  },
  "2026-10-15": {
    blocks: ["A", "B", "C", "D", "E"],
    build: (lunchType) => standardThursday(["A", "B", "C", "D", "E"], lunchType, true, "10:30"),
  },
  "2026-10-29": {
    blocks: ["B", "C", "D", "E", "F"],
    build: (lunchType) => standardThursday(["B", "C", "D", "E", "F"], lunchType, true, "10:30"),
  },
  "2026-10-30": {
    blocks: ["G", "A", "B", "C", "D"],
    build: () => [
      { label: "Arts Assembly", start: "8:10", end: "9:30", type: "assembly" },
      { label: "G", start: "9:45", end: "10:25", type: "class", block: "G" },
      { label: "A", start: "10:35", end: "11:15", type: "class", block: "A" },
      { label: "B", start: "11:25", end: "12:05", type: "class", block: "B" },
      { label: "Lunch", start: "12:05", end: "12:30", type: "lunch" },
      { label: "C", start: "12:40", end: "1:20", type: "class", block: "C" },
      { label: "D", start: "1:30", end: "2:10", type: "class", block: "D" },
    ],
  },
  "2026-11-02": {
    blocks: ["E", "F", "G", "A", "B"],
    build: (lunchType) => standardMondayOrTuesday(["E", "F", "G", "A", "B"], lunchType, "Morning Meeting", "Advisory"),
  },
  "2026-11-05": {
    blocks: ["F", "G", "A", "B", "C"],
    build: (lunchType) => standardThursday(["F", "G", "A", "B", "C"], lunchType, true, "10:00"),
  },
  "2026-11-09": {
    blocks: ["B", "C", "D", "E", "F"],
    build: (lunchType) => standardMondayOrTuesday(["B", "C", "D", "E", "F"], lunchType, "Morning Meeting", "Advisory"),
  },
  "2026-11-12": {
    blocks: ["C", "D", "E", "F", "G"],
    build: (lunchType) => {
      const slots: ScheduleSlot[] = [
        { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
        { label: "Brunswick Film Trust", start: "8:00", end: "11:00", type: "assembly" },
        { label: "E", start: "11:05", end: "11:55", type: "class", block: "E" },
      ];
      if (lunchType === "underclassman") {
        slots.push({ label: "F", start: "12:05", end: "1:05", type: "class", block: "F" });
        slots.push({ label: "Lunch", start: "1:05", end: "1:30", type: "lunch" });
      } else {
        slots.push({ label: "Lunch", start: "11:55", end: "12:20", type: "lunch" });
        slots.push({ label: "F", start: "12:30", end: "1:30", type: "class", block: "F" });
      }
      slots.push({ label: "G", start: "1:40", end: "2:40", type: "class", block: "G" });
      return slots;
    },
  },
  "2026-11-19": {
    blocks: ["G", "A", "B", "C", "D"],
    build: (lunchType) => {
      const slots = standardThursday(["G", "A", "B", "C", "D"], lunchType);
      return slots.map((slot) => slot.block === "G" ? { ...slot, end: "9:00" } : slot);
    },
  },
  // Tue June 8, 2027 — MS/US Closing Ceremony (last day of school)
  "2027-06-08": {
    blocks: [],
    build: () => [
      { label: "US Closing Ceremony", start: "11:00", end: "12:00", type: "assembly" },
    ],
  },
};

export function getBlocksForDate(date: Date): Block[] {
  if (!isSchoolDay(date)) return [];
  const override = DATE_OVERRIDES[dateKey(date)];
  if (override) return override.blocks;
  return ROTATION_CYCLE[getRotationIndex(date)];
}

export function getDaySchedule(
  date: Date,
  classType: ClassType = "underclassman",
  blockLunchOverrides?: Record<Block, string>
): ScheduleSlot[] {
  if (!isSchoolDay(date)) return [];

  const override = DATE_OVERRIDES[dateKey(date)];
  if (override) {
    // For overrides, use global classType for lunch (per-block override applies if 4th block matches)
    const lunchBlock = override.blocks[3];
    const lunchOverride = lunchBlock && blockLunchOverrides?.[lunchBlock];
    const effectiveLunchType: ClassType =
      lunchOverride && lunchOverride !== "default"
        ? (lunchOverride as ClassType)
        : classType;
    return override.build(effectiveLunchType);
  }

  const dayOfWeek = date.getDay();
  const blocks = getBlocksForDate(date);
  const slots: ScheduleSlot[] = [];

  // Determine effective lunch type: per-block override for the 4th block, or global default
  const lunchBlock = blocks[3];
  const lunchOverride = lunchBlock && blockLunchOverrides?.[lunchBlock];
  const effectiveLunchType: ClassType =
    lunchOverride && lunchOverride !== "default"
      ? (lunchOverride as ClassType)
      : classType;

  if (dayOfWeek === 1) return standardMondayOrTuesday(blocks, effectiveLunchType, "Morning Meeting");
  if (dayOfWeek === 2) return standardMondayOrTuesday(blocks, effectiveLunchType, "Advisory");
  if (dayOfWeek === 3) return standardWednesday(blocks, effectiveLunchType);
  if (dayOfWeek === 4) return standardThursday(blocks, effectiveLunchType);
  return standardFriday(blocks, effectiveLunchType);
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
