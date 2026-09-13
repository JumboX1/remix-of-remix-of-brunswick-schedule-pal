import { describe, it, expect } from "vitest";
import { getBlocksForDate, getDaySchedule, getRotationDayNumber, type Block } from "@/lib/schedule";
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

  it("January exam days show their published schedules", () => {
    expect(isSchoolDay(new Date(2027, 0, 12))).toBe(true);
    expect(getDaySchedule(new Date(2027, 0, 12))).toHaveLength(2);
    expect(getSchoolDayInfo(new Date(2027, 5, 2))?.reason).toContain("Exam Week");
  });

  it("Normal school day returns null", () => {
    expect(getSchoolDayInfo(new Date(2026, 8, 15))).toBeNull();
  });
});

describe("Printed planner: Nov 23 through Jan 29", () => {
  it.each([
    [new Date(2026, 10, 23), 7, "C"],
    [new Date(2026, 10, 24), 1, "A"],
    [new Date(2026, 10, 30), 2, "F"],
    [new Date(2026, 11, 1), 3, "D"],
    [new Date(2026, 11, 3), 5, "G"],
    [new Date(2026, 11, 18), 2, "F"],
    [new Date(2027, 0, 4), 3, "D"],
    [new Date(2027, 0, 20), 1, "A"],
    [new Date(2027, 0, 21), 2, "F"],
    [new Date(2027, 0, 29), 1, "A"],
  ] as const)("matches rotation on %s", (date, dayNumber, firstBlock) => {
    expect(getRotationDayNumber(date)).toBe(dayNumber);
    expect(getBlocksForDate(date)[0]).toBe(firstBlock);
  });

  it("keeps Thanksgiving and winter break free of classes", () => {
    for (const date of [new Date(2026, 10, 25), new Date(2026, 10, 26), new Date(2026, 10, 27), new Date(2026, 11, 21), new Date(2027, 0, 1)]) {
      expect(getDaySchedule(date)).toEqual([]);
    }
  });

  it.each([
    [new Date(2026, 10, 24), "Thanksgiving Assembly", "10:25", "11:10"],
    [new Date(2026, 11, 3), "Assembly", "10:00", "10:55"],
    [new Date(2026, 11, 17), "Assembly", "10:00", "10:55"],
    [new Date(2026, 11, 18), "Brunswick All-School Holiday Assembly", "8:15", "9:45"],
    [new Date(2027, 0, 21), "Assembly", "8:15", "9:30"],
    [new Date(2027, 0, 28), "Assembly", "10:00", "11:20"],
  ] as const)("matches the photographed special event on %s", (date, label, start, end) => {
    expect(getDaySchedule(date).find((slot) => slot.label === label)).toMatchObject({ start, end });
  });

  it("matches both exam-review days", () => {
    expect(getBlocksForDate(new Date(2027, 0, 7))).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
    expect(getBlocksForDate(new Date(2027, 0, 8))).toEqual(["G", "F", "E", "D", "C", "B", "A"]);
    expect(getDaySchedule(new Date(2027, 0, 7)).at(-1)).toMatchObject({ label: "G", start: "1:35", end: "2:15" });
    expect(getRotationDayNumber(new Date(2027, 0, 7))).toBeNull();
  });

  it.each([
    [12, "History Exam", "Computer Science Exam"],
    [13, "Modern Language & Classics Exam", "Conflict Exams"],
    [14, "Math Exam", "English Exam"],
    [15, "Science Exam", "Conflict Exams"],
  ] as const)("matches January %i exams", (day, morning, afternoon) => {
    expect(getDaySchedule(new Date(2027, 0, day))).toEqual([
      { label: morning, start: "9:00", end: "11:00", type: "assembly" },
      { label: afternoon, start: "1:00", end: "3:00", type: "assembly" },
    ]);
  });

  it("matches Exam Return Day", () => {
    const schedule = getDaySchedule(new Date(2027, 0, 19));
    expect(schedule.filter((slot) => slot.type === "class")).toHaveLength(7);
    expect(schedule.find((slot) => slot.label === "1-on-1 Advisee Meetings")).toMatchObject({ start: "12:00", end: "2:00" });
  });

  it("matches adjusted lunch splits", () => {
    const jan28Under = getDaySchedule(new Date(2027, 0, 28), "underclassman");
    const jan28Upper = getDaySchedule(new Date(2027, 0, 28), "upperclassman");
    expect(jan28Under.find((slot) => slot.type === "lunch")).toMatchObject({ start: "12:15", end: "12:40" });
    expect(jan28Upper.find((slot) => slot.type === "lunch")).toMatchObject({ start: "11:20", end: "11:45" });
  });
});

describe("Printed planner: Feb 1 through Apr 9", () => {
  const photographedDays: Array<[number, number, number, Block]> = [
    [1, 1, 2, "F"], [1, 2, 3, "D"], [1, 3, 4, "B"], [1, 4, 5, "G"], [1, 5, 6, "E"],
    [1, 8, 7, "C"], [1, 9, 1, "A"], [1, 10, 2, "F"],
    [1, 16, 3, "D"], [1, 17, 4, "B"], [1, 18, 5, "G"], [1, 19, 6, "E"],
    [1, 22, 7, "C"], [1, 23, 1, "A"], [1, 24, 2, "F"], [1, 25, 3, "D"], [1, 26, 4, "B"],
    [2, 1, 5, "G"], [2, 2, 6, "E"], [2, 3, 7, "C"], [2, 4, 1, "A"], [2, 5, 2, "F"],
    [2, 22, 3, "D"], [2, 23, 4, "B"], [2, 24, 5, "G"], [2, 25, 6, "E"],
    [2, 29, 7, "C"], [2, 30, 1, "A"], [2, 31, 2, "F"],
    [3, 1, 3, "D"], [3, 2, 4, "B"], [3, 5, 5, "G"], [3, 6, 6, "E"], [3, 7, 7, "C"],
    [3, 8, 1, "A"], [3, 9, 2, "F"],
  ];

  it.each(photographedDays)("matches rotation for 2027-%i-%i", (month, day, dayNumber, firstBlock) => {
    const date = new Date(2027, month, day);
    expect(getRotationDayNumber(date)).toBe(dayNumber);
    expect(getBlocksForDate(date)[0]).toBe(firstBlock);
  });

  it("keeps the photographed long weekend, winter break, and Good Friday class-free", () => {
    const noSchoolDates = [
      new Date(2027, 1, 11), new Date(2027, 1, 12), new Date(2027, 1, 15),
      new Date(2027, 2, 8), new Date(2027, 2, 12), new Date(2027, 2, 19),
      new Date(2027, 2, 26),
    ];
    for (const date of noSchoolDates) {
      expect(getRotationDayNumber(date)).toBeNull();
      expect(getDaySchedule(date)).toEqual([]);
    }
  });

  it.each([
    [new Date(2027, 1, 4), "10:00"],
    [new Date(2027, 1, 25), "10:10"],
    [new Date(2027, 3, 8), "10:10"],
  ] as const)("matches the adjusted Thursday on %s", (date, assemblyStart) => {
    const schedule = getDaySchedule(date);
    expect(schedule[1]).toMatchObject({ start: "8:10", end: "8:55" });
    expect(schedule[2]).toMatchObject({ start: "9:05", end: "9:50" });
    expect(schedule.find((slot) => slot.label === "Assembly")).toMatchObject({ start: assemblyStart, end: "10:55" });
  });

  it("preserves both grade lunch splits on adjusted days", () => {
    const under = getDaySchedule(new Date(2027, 3, 8), "underclassman");
    const upper = getDaySchedule(new Date(2027, 3, 8), "upperclassman");
    expect(under.find((slot) => slot.type === "lunch")).toMatchObject({ start: "1:05", end: "1:30" });
    expect(upper.find((slot) => slot.type === "lunch")).toMatchObject({ start: "11:55", end: "12:20" });
  });
});

describe("Printed planner: Apr 12 through Jun 8", () => {
  const photographedDays: Array<[number, number, number, Block]> = [
    [3, 12, 3, "D"], [3, 13, 4, "B"], [3, 14, 5, "G"], [3, 15, 6, "E"], [3, 16, 7, "C"],
    [3, 19, 1, "A"], [3, 20, 2, "F"], [3, 21, 3, "D"], [3, 22, 4, "B"], [3, 23, 5, "G"],
    [3, 26, 6, "E"], [3, 27, 7, "C"], [3, 28, 1, "A"], [3, 29, 2, "F"],
    [4, 3, 3, "D"], [4, 4, 4, "B"], [4, 5, 5, "G"], [4, 6, 6, "E"], [4, 7, 7, "C"],
    [4, 10, 1, "A"], [4, 11, 2, "F"], [4, 12, 3, "D"], [4, 13, 4, "B"], [4, 14, 5, "G"],
    [4, 17, 6, "E"], [4, 18, 7, "C"], [4, 19, 1, "A"], [4, 20, 2, "F"], [4, 21, 3, "D"],
    [4, 24, 4, "B"], [4, 25, 5, "G"], [4, 26, 6, "E"],
  ];

  it.each(photographedDays)("matches final-term rotation for 2027-%i-%i", (month, day, dayNumber, firstBlock) => {
    const date = new Date(2027, month, day);
    expect(getRotationDayNumber(date)).toBe(dayNumber);
    expect(getBlocksForDate(date)[0]).toBe(firstBlock);
  });

  it.each([
    [new Date(2027, 3, 15), "10:00"],
    [new Date(2027, 3, 29), "10:10"],
  ] as const)("matches late-April adjusted Thursday on %s", (date, assemblyStart) => {
    const schedule = getDaySchedule(date);
    expect(schedule[1]).toMatchObject({ start: "8:10", end: "8:55" });
    expect(schedule[2]).toMatchObject({ start: "9:05", end: "9:50" });
    expect(schedule.find((slot) => slot.label === "Assembly")).toMatchObject({ start: assemblyStart, end: "10:55" });
  });

  it("keeps Community Service Day, Memorial Day, and June 7 class-free", () => {
    for (const date of [new Date(2027, 3, 30), new Date(2027, 4, 31), new Date(2027, 5, 7)]) {
      expect(getDaySchedule(date)).toEqual([]);
      expect(getRotationDayNumber(date)).toBeNull();
    }
  });

  it("matches the three adjusted May schedules", () => {
    expect(getDaySchedule(new Date(2027, 4, 17)).filter((slot) => slot.type === "class").map((slot) => `${slot.label}:${slot.start}-${slot.end}`))
      .toEqual(["E:8:10-9:10", "F:9:20-10:20", "G:10:30-11:30", "A:11:40-12:40", "B:1:15-2:15"]);
    expect(getDaySchedule(new Date(2027, 4, 19), "underclassman").find((slot) => slot.label === "E")).toMatchObject({ start: "11:50", end: "12:20" });
    expect(getDaySchedule(new Date(2027, 4, 19), "upperclassman").find((slot) => slot.label === "E")).toMatchObject({ start: "12:35", end: "1:05" });
    expect(getDaySchedule(new Date(2027, 4, 20)).find((slot) => slot.label === "GA Graduation")).toMatchObject({ start: "3:00" });
  });

  it("matches both May exam-review days", () => {
    expect(getBlocksForDate(new Date(2027, 4, 27))).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
    expect(getBlocksForDate(new Date(2027, 4, 28))).toEqual(["G", "F", "E", "D", "C", "B", "A"]);
    expect(getDaySchedule(new Date(2027, 4, 28)).at(-1)).toMatchObject({ label: "A", start: "1:35", end: "2:15" });
    expect(getRotationDayNumber(new Date(2027, 4, 27))).toBeNull();
  });

  it.each([
    [1, "Math Exam", "English Exam"],
    [2, "Science Exam", "Conflict Exams"],
    [3, "Modern Languages & Classics Exam", "Computer Science Exam"],
    [4, "History Exam", "Conflict Exams"],
  ] as const)("matches June %i exams", (day, morning, afternoon) => {
    expect(getDaySchedule(new Date(2027, 5, day))).toEqual([
      { label: morning, start: "9:00", end: "11:00", type: "assembly" },
      { label: afternoon, start: "1:00", end: "3:00", type: "assembly" },
    ]);
  });

  it("matches the June 8 Exam Return/Last Day schedule", () => {
    const schedule = getDaySchedule(new Date(2027, 5, 8));
    expect(schedule.filter((slot) => slot.type === "class")).toHaveLength(7);
    expect(schedule.find((slot) => slot.label === "A")).toMatchObject({ start: "8:10", end: "8:20" });
    expect(schedule.find((slot) => slot.label === "G")).toMatchObject({ start: "10:10", end: "10:20" });
    expect(schedule.find((slot) => slot.label === "US Closing Ceremony")).toMatchObject({ start: "11:00", end: "12:00" });
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
      { label: "Advisory", start: "7:45", end: "8:00", type: "advisory" },
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
