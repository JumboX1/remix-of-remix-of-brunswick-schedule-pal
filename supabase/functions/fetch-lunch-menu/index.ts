const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ICAL_URL =
  "https://my.brunswickschool.org/calendar/calendar_351.ics";

interface MenuEvent {
  date: string; // YYYY-MM-DD
  items: string[];
}

function parseIcal(raw: string): MenuEvent[] {
  const events: MenuEvent[] = [];
  const blocks = raw.split("BEGIN:VEVENT");

  for (const block of blocks) {
    const dtMatch = block.match(/DTSTART;VALUE=DATE:(\d{4})(\d{2})(\d{2})/);
    const descMatch = block.match(/DESCRIPTION:([\s\S]*?)(?:\r?\nPRIORITY|\r?\nEND:VEVENT)/);

    if (!dtMatch || !descMatch) continue;

    const date = `${dtMatch[1]}-${dtMatch[2]}-${dtMatch[3]}`;
    const descRaw = descMatch[1]
      .replace(/\\n/g, "\n")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/&amp;/g, "&");

    const items = descRaw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l !== "Lunch");

    events.push({ date, items });
  }

  return events;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const res = await fetch(ICAL_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch iCal: ${res.status}`);
    }

    const text = await res.text();
    const events = parseIcal(text);

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching lunch menu:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
