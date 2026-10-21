import { afterEach, describe, expect, it, vi } from "vitest";
import { canRegisterOffline } from "@/lib/offline";
import { CALENDAR_CACHE_KEY, getSchoolDayInfo, isSchoolDay, mergeDbCalendar, restoreCalendarSnapshot, saveCalendarSnapshot } from "@/lib/schoolCalendar";

afterEach(() => { localStorage.clear(); mergeDbCalendar([]); vi.restoreAllMocks(); });

describe("Offline schedule", () => {
  it("keeps the built-in calendar usable without any network calls", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(isSchoolDay(new Date(2026, 8, 8))).toBe(true);
    expect(isSchoolDay(new Date(2026, 8, 7))).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("restores saved exceptions on a later offline opening", () => {
    saveCalendarSnapshot([{ date: "2026-10-22", reason: "Weather closure", day_type: "noschool" }]);
    mergeDbCalendar([]);
    expect(isSchoolDay(new Date(2026, 9, 22))).toBe(true);
    restoreCalendarSnapshot();
    expect(isSchoolDay(new Date(2026, 9, 22))).toBe(false);
    expect(getSchoolDayInfo(new Date(2026, 9, 22))?.reason).toBe("Weather closure");
  });

  it("ignores invalid cached types rather than closing a school day", () => {
    localStorage.setItem(CALENDAR_CACHE_KEY, JSON.stringify([{ date: "2026-10-22", reason: "bad", day_type: "invalid" }]));
    restoreCalendarSnapshot();
    expect(isSchoolDay(new Date(2026, 9, 22))).toBe(true);
  });

  it("an empty successful refresh removes obsolete saved closures", () => {
    saveCalendarSnapshot([{ date: "2026-10-22", reason: "Weather closure", day_type: "noschool" }]);
    saveCalendarSnapshot([]);
    restoreCalendarSnapshot();
    expect(isSchoolDay(new Date(2026, 9, 22))).toBe(true);
  });
});

describe("Published-only offline caching", () => {
  const context = { production: true, framed: false, hostname: "schedule-symphony-75.lovable.app", search: "" };
  it("allows offline support on the published app", () => {
    expect(canRegisterOffline(context)).toBe(true);
  });
  it("never registers in development", () => {
    expect(canRegisterOffline({ ...context, production: false })).toBe(false);
  });
  it("never registers in an iframe", () => {
    expect(canRegisterOffline({ ...context, framed: true })).toBe(false);
  });
  it.each(["id-preview--123.lovable.app", "preview--123.lovable.app", "lovableproject.com", "a.lovableproject.com", "lovableproject-dev.com", "a.lovableproject-dev.com", "beta.lovable.dev", "a.beta.lovable.dev"])("never registers on %s", (hostname) => {
    expect(canRegisterOffline({ ...context, hostname })).toBe(false);
  });
  it("supports the offline-cache kill switch", () => {
    expect(canRegisterOffline({ ...context, search: "?sw=off" })).toBe(false);
  });
});