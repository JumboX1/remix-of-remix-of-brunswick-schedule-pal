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

// The planner resets the rotation after each semester break.
const ROTATION_ANCHORS = [
  new Date(2026, 8, 14),
  new Date(2027, 0, 20),
];

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
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const anchor = [...ROTATION_ANCHORS].reverse().find((candidate) => target >= candidate) ?? ROTATION_ANCHORS[0];
  const start = new Date(anchor);
  start.setHours(0, 0, 0, 0);

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

/** Planner-style day number (1-7) for a school day, or null when there's no school. */
export function getRotationDayNumber(date: Date): number | null {
  const override = DAY_NUMBER_OVERRIDES[dateKey(date)];
  if (override !== undefined) return override;
  if (!isSchoolDay(date)) return null;
  return getRotationIndex(date) + 1;
}

/** The next day with classes, searching up to 60 days ahead. */
export function getNextSchoolDay(from: Date): Date | null {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 60; i++) {
    d.setDate(d.getDate() + 1);
    if (isSchoolDay(d)) return new Date(d);
  }
  return null;
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
    { label: "Assembly", start: assemblyStart, end: "10:55", type: "assembly" },
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

function adjustedMondayOrTuesday(blocks: Block[], lunchType: ClassType, openingLabel: "Morning Meeting" | "Advisory"): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [
    { label: openingLabel, start: "7:45", end: "8:00", type: "advisory" },
    { label: blocks[0], start: "8:10", end: "8:55", type: "class", block: blocks[0] },
    { label: blocks[1], start: "9:05", end: "9:50", type: "class", block: blocks[1] },
    { label: "Flex", start: "10:00", end: "10:55", type: "advisory" },
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

function examReview(blocks: Block[], lunchType: ClassType): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [
    { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
    ...blocks.slice(0, 4).map((block, index) => ({
      label: block,
      start: ["8:10", "9:00", "9:50", "10:40"][index],
      end: ["8:50", "9:40", "10:30", "11:20"][index],
      type: "class" as const,
      block,
    })),
  ];
  if (lunchType === "underclassman") {
    slots.push({ label: blocks[4], start: "11:30", end: "12:10", type: "class", block: blocks[4] });
    slots.push({ label: "Lunch", start: "12:10", end: "12:35", type: "lunch" });
  } else {
    slots.push({ label: "Lunch", start: "11:20", end: "11:45", type: "lunch" });
    slots.push({ label: blocks[4], start: "11:55", end: "12:35", type: "class", block: blocks[4] });
  }
  slots.push({ label: blocks[5], start: "12:45", end: "1:25", type: "class", block: blocks[5] });
  slots.push({ label: blocks[6], start: "1:35", end: "2:15", type: "class", block: blocks[6] });
  return slots;
}

const DAY_NUMBER_OVERRIDES: Record<string, number | null> = {
  "2027-01-07": null,
  "2027-01-08": null,
  "2027-01-12": null,
  "2027-01-13": null,
  "2027-01-14": null,
  "2027-01-15": null,
  "2027-01-19": null,
};

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
  "2026-09-10": {
    blocks: ["D", "E", "F", "G", "A"],
    build: (lunchType) => standardThursday(["D", "E", "F", "G", "A"], lunchType),
  },
  "2026-09-11": {
    blocks: ["B", "C", "D", "E", "F"],
    build: (lunchType) => standardFriday(["B", "C", "D", "E", "F"], lunchType),
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
      { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
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
  "2026-11-24": {
    blocks: ["A", "B", "C", "D", "E"],
    build: (lunchType) => [
      { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
      { label: "A", start: "8:10", end: "8:45", type: "class", block: "A" },
      { label: "B", start: "8:55", end: "9:30", type: "class", block: "B" },
      { label: "C", start: "9:40", end: "10:15", type: "class", block: "C" },
      { label: "Thanksgiving Assembly", start: "10:25", end: "11:10", type: "assembly" },
      ...(lunchType === "underclassman"
        ? [{ label: "D", start: "11:20", end: "11:55", type: "class" as const, block: "D" as const }]
        : [{ label: "D", start: "11:35", end: "12:10", type: "class" as const, block: "D" as const }]),
      { label: "Lunch", start: "11:15", end: "12:15", type: "lunch" },
      { label: "E", start: "12:20", end: "12:55", type: "class", block: "E" },
    ],
  },
  "2026-11-30": {
    blocks: ["F", "G", "A", "B", "C"],
    build: (lunchType) => adjustedMondayOrTuesday(["F", "G", "A", "B", "C"], lunchType, "Morning Meeting"),
  },
  "2026-12-01": {
    blocks: ["D", "E", "F", "G", "A"],
    build: (lunchType) => adjustedMondayOrTuesday(["D", "E", "F", "G", "A"], lunchType, "Advisory"),
  },
  "2026-12-03": {
    blocks: ["G", "A", "B", "C", "D"],
    build: (lunchType) => standardThursday(["G", "A", "B", "C", "D"], lunchType, true, "10:00"),
  },
  "2026-12-17": {
    blocks: ["A", "B", "C", "D", "E"],
    build: (lunchType) => standardThursday(["A", "B", "C", "D", "E"], lunchType, true, "10:00"),
  },
  "2026-12-18": {
    blocks: ["F", "G", "A", "B", "C"],
    build: (lunchType) => [
      { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
      { label: "Brunswick All-School Holiday Assembly", start: "8:15", end: "9:45", type: "assembly" },
      { label: "F", start: "10:00", end: "10:25", type: "class", block: "F" },
      { label: "G", start: "10:35", end: "11:00", type: "class", block: "G" },
      ...(lunchType === "underclassman"
        ? [{ label: "A", start: "11:10", end: "11:35", type: "class" as const, block: "A" as const }]
        : [{ label: "A", start: "11:25", end: "11:50", type: "class" as const, block: "A" as const }]),
      { label: "Lunch", start: "11:00", end: "12:00", type: "lunch" },
      { label: "B", start: "12:00", end: "12:25", type: "class", block: "B" },
      { label: "C", start: "12:35", end: "1:00", type: "class", block: "C" },
    ],
  },
  "2027-01-07": {
    blocks: ["A", "B", "C", "D", "E", "F", "G"],
    build: (lunchType) => examReview(["A", "B", "C", "D", "E", "F", "G"], lunchType),
  },
  "2027-01-08": {
    blocks: ["G", "F", "E", "D", "C", "B", "A"],
    build: (lunchType) => examReview(["G", "F", "E", "D", "C", "B", "A"], lunchType),
  },
  "2027-01-12": {
    blocks: [],
    build: () => [
      { label: "History Exam", start: "9:00", end: "11:00", type: "assembly" },
      { label: "Computer Science Exam", start: "1:00", end: "3:00", type: "assembly" },
    ],
  },
  "2027-01-13": {
    blocks: [],
    build: () => [
      { label: "Modern Language & Classics Exam", start: "9:00", end: "11:00", type: "assembly" },
      { label: "Conflict Exams", start: "1:00", end: "3:00", type: "assembly" },
    ],
  },
  "2027-01-14": {
    blocks: [],
    build: () => [
      { label: "Math Exam", start: "9:00", end: "11:00", type: "assembly" },
      { label: "English Exam", start: "1:00", end: "3:00", type: "assembly" },
    ],
  },
  "2027-01-15": {
    blocks: [],
    build: () => [
      { label: "Science Exam", start: "9:00", end: "11:00", type: "assembly" },
      { label: "Conflict Exams", start: "1:00", end: "3:00", type: "assembly" },
    ],
  },
  "2027-01-19": {
    blocks: ["A", "B", "C", "D", "E", "F", "G"],
    build: () => [
      { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
      ...(["A", "B", "C", "D", "E", "F", "G"] as Block[]).map((block, index) => ({
        label: block,
        start: ["8:10", "8:35", "9:00", "9:25", "9:50", "10:15", "10:40"][index],
        end: ["8:25", "8:50", "9:15", "9:40", "10:05", "10:30", "10:55"][index],
        type: "class" as const,
        block,
      })),
      { label: "Lunch", start: "11:00", end: "11:50", type: "lunch" },
      { label: "1-on-1 Advisee Meetings", start: "12:00", end: "2:00", type: "advisory" },
    ],
  },
  "2027-01-21": {
    blocks: ["F", "G", "A", "B", "C"],
    build: (lunchType) => [
      { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
      { label: "Assembly", start: "8:15", end: "9:30", type: "assembly" },
      { label: "F", start: "9:40", end: "10:25", type: "class", block: "F" },
      { label: "G", start: "10:35", end: "11:20", type: "class", block: "G" },
      ...(lunchType === "underclassman"
        ? [
            { label: "A", start: "11:30", end: "12:15", type: "class" as const, block: "A" as const },
            { label: "Lunch", start: "12:15", end: "12:45", type: "lunch" as const },
          ]
        : [
            { label: "Lunch", start: "11:20", end: "11:50", type: "lunch" as const },
            { label: "A", start: "12:00", end: "12:45", type: "class" as const, block: "A" as const },
          ]),
      { label: "B", start: "12:55", end: "1:40", type: "class", block: "B" },
      { label: "C", start: "1:50", end: "2:35", type: "class", block: "C" },
    ],
  },
  "2027-01-28": {
    blocks: ["C", "D", "E", "F", "G"],
    build: (lunchType) => [
      { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
      { label: "C", start: "8:10", end: "8:55", type: "class", block: "C" },
      { label: "D", start: "9:05", end: "9:50", type: "class", block: "D" },
      { label: "Assembly", start: "10:00", end: "11:20", type: "assembly" },
      ...(lunchType === "underclassman"
        ? [
            { label: "E", start: "11:30", end: "12:15", type: "class" as const, block: "E" as const },
            { label: "Lunch", start: "12:15", end: "12:40", type: "lunch" as const },
          ]
        : [
            { label: "Lunch", start: "11:20", end: "11:45", type: "lunch" as const },
            { label: "E", start: "11:55", end: "12:40", type: "class" as const, block: "E" as const },
          ]),
      { label: "F", start: "12:50", end: "1:30", type: "class", block: "F" },
      { label: "G", start: "1:40", end: "2:40", type: "class", block: "G" },
    ],
  },
  "2027-02-04": {
    blocks: ["G", "A", "B", "C", "D"],
    build: (lunchType) => standardThursday(["G", "A", "B", "C", "D"], lunchType, true, "10:00"),
  },
  "2027-02-25": {
    blocks: ["D", "E", "F", "G", "A"],
    build: (lunchType) => standardThursday(["D", "E", "F", "G", "A"], lunchType, true, "10:10"),
  },
  "2027-04-08": {
    blocks: ["A", "B", "C", "D", "E"],
    build: (lunchType) => standardThursday(["A", "B", "C", "D", "E"], lunchType, true, "10:10"),
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
  const override = DATE_OVERRIDES[dateKey(date)];
  if (override) return override.blocks;
  if (!isSchoolDay(date)) return [];
  return ROTATION_CYCLE[getRotationIndex(date)];
}

export function getDaySchedule(
  date: Date,
  classType: ClassType = "underclassman",
  blockLunchOverrides?: Record<Block, string>
): ScheduleSlot[] {
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

  if (!isSchoolDay(date)) return [];

  const dayOfWeek = date.getDay();
  const blocks = getBlocksForDate(date);

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
