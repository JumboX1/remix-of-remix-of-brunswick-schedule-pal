import { describe, expect, it } from "vitest";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

describe("Live anonymous access boundaries", () => {
  it("blocks public reads of private operational logs", async () => {
    const response = await fetch(`${url}/rest/v1/calendar_sync_log?select=id&limit=1`, { headers });
    expect(response.status).toBe(401);
  });

  it("keeps the public school calendar readable without sign-in", async () => {
    const response = await fetch(`${url}/rest/v1/school_calendar?select=date,reason,day_type&limit=1`, { headers });
    expect(response.status).toBe(200);
    expect(Array.isArray(await response.json())).toBe(true);
  });

  it("blocks a public caller claiming to be the calendar scheduler", async () => {
    const response = await fetch(`${url}/functions/v1/sync-calendar`, {
      method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: '{"source":"cron"}',
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });
});