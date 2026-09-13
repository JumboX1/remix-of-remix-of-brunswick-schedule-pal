import { describe, it, expect } from "vitest";
import { getBlocksForDate, getDaySchedule, type Block } from "@/lib/schedule";
import { isSchoolDay, getSchoolDayInfo } from "@/lib/schoolCalendar";

describe("School calendar 2026-27", () => {
  it("Labor Day is not a school day", () => {
    expect(isSchoolDay(new Date(2026, 8, 7))).toBe(false);
  });

  it("Opening Day is a school day", () => {
    expect(isSchoolDay(new Date(2026, 8, 8))).toBe(true);
  });

  it("Yom Kippur is not a school day", () => {
    expect(isSchoolDay(new Date(2026, 8, 21))).toBe(false);
  });

  it("Thanksgiving break days are off, Nov 24 is early dismissal", () => {
    expect(isSchoolDay(new Date(2026, 10, 24))).toBe(true);
    expect(isSchoolDay(new Date(2026, 10, 25))).toBe(false);
    expect(isSchoolDay(new Date(2026, 10, 26))).toBe(false);
  });

  it("Winter break is off and classes resume Jan 4", () => {
    expect(isSchoolDay(new Date(2026, 11, 21))).toBe(false);
    expect(isSchoolDay(new Date(2026, 11, 31))).toBe(false);
    expect(isSchoolDay(new Date(2027, 0, 4))).toBe(true);
  });

  it("Spring break is off and classes resume Mar 22", () => {
    expect(isSchoolDay(new Date(2027, 2, 5))).toBe(true);
    expect(isSchoolDay(new Date(2027, 2, 10))).toBe(false);
    expect(isSchoolDay(new Date(2027, 2, 22))).toBe(true);
  });

  it("Good Friday and Memorial Day are off", () => {
    expect(isSchoolDay(new Date(2027, 2, 26))).toBe(false);
    expect(isSchoolDay(new Date(2027, 4, 31))).toBe(false);
  });

  it("Community Service Day has no classes", () => {
    expect(isSchoolDay(new Date(2027, 3, 30))).toBe(false);
    expect(getBlocksForDate(new Date(2027, 3, 30))).toEqual([]);
  });

  it("Exam days have no regular classes", () => {
    expect(isSchoolDay(new Date(2027, 0, 12))).toBe(false);
    expect(getSchoolDayInfo(new Date(2027, 5, 2))?.reason).toContain("Exam Week");
  });

  it("Normal school day returns null", () => {
    expect(getSchoolDayInfo(new Date(2026, 8, 15))).toBeNull();
  });
});

describe("Block rotation 2026-27", () => {
  it("Opening Day Sept 8, 2026 = A,B,C,D,E", () => {
    expect(getBlocksForDate(new Date(2026, 8, 8))).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("Sept 9, 2026 = F,G,A,B,C", () => {
    expect(getBlocksForDate(new Date(2026, 8, 9))).toEqual(["F", "G", "A", "B", "C"]);
  });

  it("preserves the opening-week rotation before the planner resets Day 1", () => {
    expect(getBlocksForDate(new Date(2026, 8, 10))).toEqual(["D", "E", "F", "G", "A"]);
    expect(getBlocksForDate(new Date(2026, 8, 11))).toEqual(["B", "C", "D", "E", "F"]);
  });

  it("Sept 14, 2026 starts the planner cycle at Day 1", () => {
    expect(getBlocksForDate(new Date(2026, 8, 14))).toEqual(["A", "B", "C", "D", "E"]);
  });

  it("rotation skips no-school days (Sept 21 Yom Kippur)", () => {
    expect(getBlocksForDate(new Date(2026, 8, 21))).toEqual([]);
    expect(getBlocksForDate(new Date(2026, 8, 22))).toEqual(["E", "F", "G", "A", "B"]);
  });

  it("first class of Opening Day starts at 8:10", () => {
    const slots = getDaySchedule(new Date(2026, 8, 8));
    const firstClass = slots.find((s) => s.type === "class");
    expect(firstClass?.start).toBe("8:10");
    expect(firstClass?.block).toBe("A");
  });

  it("Wednesday has advisory at 8:45 then 9:10 start", () => {
    const slots = getDaySchedule(new Date(2026, 8, 9));
    expect(slots[0].start).toBe("8:45");
    expect(slots[1].start).toBe("9:10");
  });

  it("every school day has 5 class slots", () => {
    for (const d of [8, 9, 10, 11, 14]) {
      const slots = getDaySchedule(new Date(2026, 8, d));
      expect(slots.filter((s) => s.type === "class")).toHaveLength(5);
    }
  });

  it("underclassman and upperclassman lunch differs", () => {
    const day = new Date(2026, 8, 14);
    const u = getDaySchedule(day, "underclassman").find((s) => s.type === "lunch");
    const o = getDaySchedule(day, "upperclassman").find((s) => s.type === "lunch");
    expect(u?.start).not.toBe(o?.start);
  });
});

describe("Printed planner: Sept 14 through Nov 20", () => {
  const expectedFirstBlocks: Array<[number, number, Block]> = [
    [8, 14, "A"], [8, 15, "F"], [8, 16, "D"], [8, 17, "B"], [8, 18, "G"],
    [8, 22, "E"], [8, 23, "C"], [8, 24, "A"], [8, 25, "F"],
    [8, 28, "D"], [8, 29, "B"], [8, 30, "G"],
    [9, 1, "E"], [9, 2, "C"], [9, 5, "A"], [9, 6, "F"], [9, 7, "D"],
    [9, 8, "B"], [9, 9, "G"], [9, 13, "E"], [9, 14, "C"], [9, 15, "A"],
    [9, 16, "F"], [9, 19, "D"], [9, 20, "B"], [9, 21, "G"], [9, 22, "E"],
    [9, 23, "C"], [9, 26, "A"], [9, 27, "F"], [9, 28, "D"], [9, 29, "B"],
    [9, 30, "G"], [10, 2, "E"], [10, 3, "C"], [10, 4, "A"], [10, 5, "F"],
    [10, 6, "D"], [10, 9, "B"], [10, 10, "G"], [10, 11, "E"], [10, 12, "C"],
    [10, 13, "A"], [10, 16, "F"], [10, 17, "D"], [10, 18, "B"], [10, 19, "G"],
    [10, 20, "E"],
  ];

  it.each(expectedFirstBlocks)("matches the first block for %i/%i", (month, day, block) => {
    expect(getBlocksForDate(new Date(2026, month, day))[0]).toBe(block);
  });

  it.each(expectedFirstBlocks)("keeps five consecutive planner blocks for %i/%i", (month, day, firstBlock) => {
    const start = ["A", "B", "C", "D", "E", "F", "G"].indexOf(firstBlock);
    const expected = Array.from({ length: 5 }, (_, index) => ["A", "B", "C", "D", "E", "F", "G"][(start + index) % 7]);
    expect(getBlocksForDate(new Date(2026, month, day))).toEqual(expected);
  });

  it("does not advance the rotation on photographed no-school days", () => {
    expect(getBlocksForDate(new Date(2026, 8, 21))).toEqual([]);
    expect(getBlocksForDate(new Date(2026, 9, 12))).toEqual([]);
  });

  it("matches the normal weekday opening activities", () => {
    expect(getDaySchedule(new Date(2026, 8, 14))[0]).toMatchObject({ label: "Morning Meeting", start: "7:45", end: "8:00" });
    expect(getDaySchedule(new Date(2026, 8, 15))[0]).toMatchObject({ label: "Advisory", start: "7:45", end: "8:00" });
    expect(getDaySchedule(new Date(2026, 8, 16))[0]).toMatchObject({ label: "Advisory", start: "8:45", end: "9:00" });
    expect(getDaySchedule(new Date(2026, 8, 24))[3]).toMatchObject({ label: "Assembly", start: "10:30", end: "10:55" });
  });

  it("matches the planner lunch splits", () => {
    const mondayUnder = getDaySchedule(new Date(2026, 8, 14), "underclassman");
    const mondayUpper = getDaySchedule(new Date(2026, 8, 14), "upperclassman");
    expect(mondayUnder.find((slot) => slot.type === "lunch")).toMatchObject({ start: "1:05", end: "1:30" });
    expect(mondayUpper.find((slot) => slot.type === "lunch")).toMatchObject({ start: "11:55", end: "12:20" });

    const fridayUnder = getDaySchedule(new Date(2026, 8, 18), "underclassman");
    const fridayUpper = getDaySchedule(new Date(2026, 8, 18), "upperclassman");
    expect(fridayUnder.find((slot) => slot.type === "lunch")).toMatchObject({ start: "12:40", end: "1:10" });
    expect(fridayUpper.find((slot) => slot.type === "lunch")).toMatchObject({ start: "11:30", end: "11:55" });
  });

  it.each([
    [new Date(2026, 8, 17), "Clubs Assembly", "10:10", "10:55"],
    [new Date(2026, 9, 1), "Assembly", "10:00", "10:55"],
    [new Date(2026, 9, 13), "Assembly", "10:00", "10:55"],
    [new Date(2026, 10, 5), "Assembly", "10:00", "10:55"],
    [new Date(2026, 10, 12), "Brunswick Film Trust", "8:00", "11:00"],
  ] as const)("matches special event on %s", (date, label, start, end) => {
    expect(getDaySchedule(date).find((slot) => slot.label === label)).toMatchObject({ start, end });
  });

  it("matches the October 30 end-of-quarter schedule", () => {
    expect(getDaySchedule(new Date(2026, 9, 30))).toEqual([
      { label: "Arts Assembly", start: "8:10", end: "9:30", type: "assembly" },
      { label: "G", start: "9:45", end: "10:25", type: "class", block: "G" },
      { label: "A", start: "10:35", end: "11:15", type: "class", block: "A" },
      { label: "B", start: "11:25", end: "12:05", type: "class", block: "B" },
      { label: "Lunch", start: "12:05", end: "12:30", type: "lunch" },
      { label: "C", start: "12:40", end: "1:20", type: "class", block: "C" },
      { label: "D", start: "1:30", end: "2:10", type: "class", block: "D" },
    ]);
  });
});
