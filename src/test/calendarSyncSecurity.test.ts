import { describe, expect, it } from "vitest";
import { isAuthorizedCalendarSync } from "../../supabase/functions/sync-calendar/authorize";

const testSecret = "test-only-scheduler-credential";

describe("Privileged calendar synchronization", () => {
  it("denies all requests when the scheduler credential is not configured", () => {
    const request = new Request("https://example.test", { headers: { "x-calendar-sync-secret": testSecret } });
    expect(isAuthorizedCalendarSync(request, undefined)).toBe(false);
  });

  it("does not accept public authorization or a claimed cron source", () => {
    const request = new Request("https://example.test", {
      method: "POST", headers: { Authorization: "Bearer public-anonymous-token" }, body: '{"source":"cron"}',
    });
    expect(isAuthorizedCalendarSync(request, testSecret)).toBe(false);
  });

  it("rejects an incorrect scheduler credential of the same length", () => {
    const request = new Request("https://example.test", { headers: { "x-calendar-sync-secret": "x".repeat(testSecret.length) } });
    expect(isAuthorizedCalendarSync(request, testSecret)).toBe(false);
  });

  it("accepts only the configured scheduler credential", () => {
    const request = new Request("https://example.test", { headers: { "x-calendar-sync-secret": testSecret } });
    expect(isAuthorizedCalendarSync(request, testSecret)).toBe(true);
  });
});