import { describe, it, expect } from "vitest";
import { getRotationIndex, getBlocksForDate, getDaySchedule } from "@/lib/schedule";
import { isSchoolDay, getSchoolDayInfo } from "@/lib/schoolCalendar";

describe("School calendar", () => {
  it("Spring Break days are not school days", () => {
    expect(isSchoolDay(new Date(2026, 2, 9))).toBe(false); // March 9 Mon
    expect(isSchoolDay(new Date(2026, 2, 16))).toBe(false); // March 16 Mon
  });

  it("Good Friday is not a school day", () => {
    expect(isSchoolDay(new Date(2026, 3, 3))).toBe(false); // April 3
  });

  it("Early dismissal is still a school day", () => {
    expect(isSchoolDay(new Date(2026, 2, 6))).toBe(true); // March 6
  });

  it("Spring Break has correct info", () => {
    const info = getSchoolDayInfo(new Date(2026, 2, 10));
    expect(info?.reason).toBe("Spring Break");
    expect(info?.type).toBe("break");
  });

  it("Normal school day returns null", () => {
    expect(getSchoolDayInfo(new Date(2026, 2, 23))).toBeNull(); // March 23 Mon
  });
});

describe("Schedule rotation with calendar", () => {
  it("March 23, 2026 (Monday) = D,E,F,G,A", () => {
    const blocks = getBlocksForDate(new Date(2026, 2, 23));
    expect(blocks).toEqual(["D", "E", "F", "G", "A"]);
  });

  it("April 27, 2026 (Monday) = G,A,B,C,D", () => {
    const blocks = getBlocksForDate(new Date(2026, 3, 27));
    expect(blocks).toEqual(["G", "A", "B", "C", "D"]);
  });

  it("Community Service Day (April 24) is not a school day", () => {
    expect(isSchoolDay(new Date(2026, 3, 24))).toBe(false);
    expect(getBlocksForDate(new Date(2026, 3, 24))).toEqual([]);
  });

  it("Spring Break returns no blocks", () => {
    expect(getBlocksForDate(new Date(2026, 2, 10))).toEqual([]);
  });

  it("Spring Break returns no schedule slots", () => {
    expect(getDaySchedule(new Date(2026, 2, 10))).toEqual([]);
  });

  it("rotation skips Spring Break days", () => {
    // March 5 (Thu) and March 6 (Fri) are school days before break
    // March 23 (Mon) is first day back
    // The rotation should skip all break days
    const beforeBreak1 = getBlocksForDate(new Date(2026, 2, 5)); // Thu
    const beforeBreak2 = getBlocksForDate(new Date(2026, 2, 6)); // Fri (early dismissal)
    const afterBreak = getBlocksForDate(new Date(2026, 2, 23)); // Mon

    // All should have blocks
    expect(beforeBreak1.length).toBe(5);
    expect(beforeBreak2.length).toBe(5);
    expect(afterBreak).toEqual(["D", "E", "F", "G", "A"]);
  });

  it("Monday has assembly", () => {
    const slots = getDaySchedule(new Date(2026, 2, 23));
    expect(slots[0].type).toBe("assembly");
  });

  it("Wednesday has advisory then late start", () => {
    const slots = getDaySchedule(new Date(2026, 2, 25));
    expect(slots[0].type).toBe("advisory");
    expect(slots[0].start).toBe("8:45");
    expect(slots[1].start).toBe("9:10");
  });

  it("every school day has 5 class slots", () => {
    for (let d = 23; d <= 27; d++) {
      const date = new Date(2026, 2, d);
      const slots = getDaySchedule(date);
      expect(slots.filter((s) => s.type === "class")).toHaveLength(5);
    }
  });

  it("underclassman and upperclassman lunch differs", () => {
    const mon = new Date(2026, 2, 23);
    const uLunch = getDaySchedule(mon, "underclassman").find((s) => s.type === "lunch");
    const oLunch = getDaySchedule(mon, "upperclassman").find((s) => s.type === "lunch");
    expect(uLunch?.start).not.toBe(oLunch?.start);
  });
});
