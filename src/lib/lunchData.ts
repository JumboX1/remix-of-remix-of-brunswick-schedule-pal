export interface LunchEvent { date: string; items: string[] }

export function parseLunchEvents(value: unknown): LunchEvent[] {
  if (!Array.isArray(value)) throw new Error("Invalid lunch response");
  return value.filter((event): event is LunchEvent => Boolean(event) &&
    typeof event.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(event.date) &&
    Array.isArray(event.items) && event.items.every((item: unknown) => typeof item === "string"));
}

// Imported lazily: the anonymous schedule never initializes an online client.
export async function fetchLiveLunch(signal: AbortSignal) {
  if (!navigator.onLine) throw new Error("offline");
  const { supabase } = await import("@/integrations/supabase/client");
  signal.throwIfAborted();
  const [menu, calendar] = await Promise.all([
    supabase.functions.invoke("fetch-lunch-menu", { signal }),
    supabase.from("school_calendar").select("date, reason, day_type").abortSignal(signal),
  ]);
  signal.throwIfAborted();
  return { menu, calendar };
}