import { describe, it, expect } from "vitest";
import { getBlocksForDate, getDaySchedule } from "@/lib/schedule";
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

  it("Sept 14, 2026 (Mon) = G,A,B,C,D", () => {
    expect(getBlocksForDate(new Date(2026, 8, 14))).toEqual(["G", "A", "B", "C", "D"]);
  });

  it("rotation skips no-school days (Sept 21 Yom Kippur)", () => {
    expect(getBlocksForDate(new Date(2026, 8, 21))).toEqual([]);
    expect(getBlocksForDate(new Date(2026, 8, 22))).toEqual(["D", "E", "F", "G", "A"]);
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
