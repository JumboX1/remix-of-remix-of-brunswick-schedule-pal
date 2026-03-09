import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge function: sync-calendar
 * Fetches the Brunswick School main calendar page and extracts
 * no-school events (breaks, holidays, early dismissals).
 * Upserts them into the school_calendar table.
 *
 * Designed to run via pg_cron at 4 AM ET daily.
 */

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch the Brunswick calendar page
    const calendarUrl =
      "https://my.brunswickschool.org/calendars/main-calendar";
    const response = await fetch(calendarUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BrunswickScheduleBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch calendar: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();

    // Parse calendar events from the HTML
    // Brunswick's calendar uses common patterns for event listings
    const events = parseCalendarEvents(html);

    if (events.length === 0) {
      // If we can't parse events, log but don't wipe existing data
      const { error: logError } = await supabase
        .from("calendar_sync_log")
        .insert({ events_count: 0, status: "no_events_parsed" });

      return new Response(
        JSON.stringify({
          success: true,
          message: "No events parsed from calendar page",
          events_count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert events into school_calendar
    const { error: upsertError } = await supabase
      .from("school_calendar")
      .upsert(
        events.map((e) => ({
          date: e.date,
          reason: e.reason,
          day_type: e.type,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "date" }
      );

    if (upsertError) {
      throw new Error(`Upsert failed: ${upsertError.message}`);
    }

    // Log successful sync
    await supabase
      .from("calendar_sync_log")
      .insert({ events_count: events.length, status: "success" });

    return new Response(
      JSON.stringify({
        success: true,
        events_count: events.length,
        events: events.slice(0, 10), // preview
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Calendar sync error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

interface CalendarEvent {
  date: string; // YYYY-MM-DD
  reason: string;
  type: "break" | "holiday" | "noschool" | "early_dismissal";
}

/**
 * Parse calendar events from the Brunswick calendar HTML.
 * Looks for common no-school keywords in event titles.
 */
function parseCalendarEvents(html: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const seen = new Set<string>();

  // Common patterns in school calendar HTML
  // Try to find date + event title pairs
  // Pattern 1: data attributes with dates
  const dateEventRegex =
    /data-date[="]*(\d{4}-\d{2}-\d{2})[^>]*>[\s\S]*?class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\//gi;

  let match;
  while ((match = dateEventRegex.exec(html)) !== null) {
    const date = match[1];
    const title = stripHtml(match[2]).trim();
    if (date && title) {
      addEvent(events, seen, date, title);
    }
  }

  // Pattern 2: Look for event containers with dates in various formats
  // Match month/day patterns near event text
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthPattern = monthNames.join("|");
  const dateTextRegex = new RegExp(
    `(${monthPattern})\\s+(\\d{1,2})(?:,?\\s*(\\d{4}))?[^<]*?([^<]{3,80})`,
    "gi"
  );

  while ((match = dateTextRegex.exec(html)) !== null) {
    const monthStr = match[1];
    const day = parseInt(match[2]);
    const year = match[3] ? parseInt(match[3]) : guessYear(monthStr);
    const title = stripHtml(match[4]).trim();

    const monthIdx = monthNames.findIndex(
      (m) => m.toLowerCase() === monthStr.toLowerCase()
    );
    if (monthIdx >= 0 && day > 0 && day <= 31) {
      const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (title) {
        addEvent(events, seen, dateStr, title);
      }
    }
  }

  // Pattern 3: iCal-style or JSON data embedded in page
  const icalDateRegex =
    /DTSTART[;:][^:]*:(\d{4})(\d{2})(\d{2})[\s\S]*?SUMMARY[;:]([^\r\n]+)/gi;
  while ((match = icalDateRegex.exec(html)) !== null) {
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    const title = match[4].trim();
    addEvent(events, seen, date, title);
  }

  return events;
}

function addEvent(
  events: CalendarEvent[],
  seen: Set<string>,
  date: string,
  title: string
) {
  if (seen.has(date)) return;

  const type = classifyEvent(title);
  if (!type) return; // not a no-school event

  seen.add(date);
  events.push({ date, reason: title, type });
}

function classifyEvent(
  title: string
): "break" | "holiday" | "noschool" | "early_dismissal" | null {
  const lower = title.toLowerCase();

  // Early dismissal
  if (
    lower.includes("early dismissal") ||
    lower.includes("early release") ||
    lower.includes("half day") ||
    lower.includes("half-day")
  ) {
    return "early_dismissal";
  }

  // Breaks
  if (
    lower.includes("break") ||
    lower.includes("recess") ||
    lower.includes("vacation")
  ) {
    return "break";
  }

  // Holidays
  if (
    lower.includes("no school") ||
    lower.includes("no classes") ||
    lower.includes("school closed") ||
    lower.includes("holiday") ||
    lower.includes("memorial day") ||
    lower.includes("labor day") ||
    lower.includes("mlk") ||
    lower.includes("martin luther king") ||
    lower.includes("presidents") ||
    lower.includes("thanksgiving") ||
    lower.includes("christmas") ||
    lower.includes("good friday") ||
    lower.includes("rosh hashanah") ||
    lower.includes("yom kippur") ||
    lower.includes("columbus day") ||
    lower.includes("indigenous peoples")
  ) {
    return "holiday";
  }

  // Faculty/staff only days
  if (
    lower.includes("faculty") ||
    lower.includes("professional development") ||
    lower.includes("teacher") ||
    lower.includes("in-service")
  ) {
    return "noschool";
  }

  return null; // Normal event, not a day off
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

function guessYear(month: string): number {
  const now = new Date();
  const monthIdx = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ].indexOf(month.toLowerCase());

  // School year: Aug-Dec = current year, Jan-Jul = next year if we're past Aug
  if (monthIdx >= 7) return now.getFullYear();
  if (now.getMonth() >= 7) return now.getFullYear() + 1;
  return now.getFullYear();
}
