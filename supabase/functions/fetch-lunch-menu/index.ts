const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Brunswick moved to Finalsite's new calendar; the old .ics feed no longer works.
// We read the Upper School dining calendar element and each event's detail.
const BASE = "https://my.brunswickschool.org";
const US_ELEMENT_ID = "10094"; // Upper School tab grid (calendar 351)
const TITLE = "US Lunch Menu";

interface MenuEvent {
  date: string; // YYYY-MM-DD
  items: string[];
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

async function listMonth(year: number, month0: number): Promise<{ date: string; id: string }[]> {
  const url = `${BASE}/fs/elements/${US_ELEMENT_ID}?cal_date=${year}-${pad(month0 + 1)}-01`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const html = await res.text();
  const out: { date: string; id: string }[] = [];
  const dayboxes = html.split('class="fsCalendarDaybox');
  for (const box of dayboxes) {
    const d = box.match(/data-day="(\d+)" data-year="(\d+)" data-month="(\d+)"/);
    if (!d) continue;
    const date = `${d[2]}-${pad(Number(d[3]) + 1)}-${pad(Number(d[1]))}`;
    const re = /title="([^"]*)" data-occur-id="(\d+)"/g;
    let m;
    while ((m = re.exec(box))) {
      if (decode(m[1]).trim() === TITLE) out.push({ date, id: m[2] });
    }
  }
  return out;
}

async function fetchItems(id: string): Promise<string[]> {
  const res = await fetch(`${BASE}/fs/elements/${US_ELEMENT_ID}?occur_id=${id}&show_event=true`);
  if (!res.ok) return [];
  const html = await res.text();
  const m = html.match(/class="fsDescription">([\s\S]*?)<\/div>/);
  if (!m) return [];
  return m[1]
    .split(/<br\s*\/?>|<\/p>|<\/li>/i)
    .map((l) => decode(l.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 0 && l.toLowerCase() !== "lunch");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const now = new Date();
    const months = [-1, 0, 1].map((o) => {
      const d = new Date(now.getFullYear(), now.getMonth() + o, 1);
      return [d.getFullYear(), d.getMonth()] as const;
    });
    const lists = await Promise.all(months.map(([y, m]) => listMonth(y, m)));
    const seen = new Map<string, string>();
    for (const l of lists) for (const e of l) if (!seen.has(e.date)) seen.set(e.date, e.id);

    const entries = [...seen.entries()];
    const events: MenuEvent[] = [];
    // limited concurrency
    for (let i = 0; i < entries.length; i += 8) {
      const chunk = entries.slice(i, i + 8);
      const results = await Promise.all(chunk.map(([, id]) => fetchItems(id).catch(() => [])));
      chunk.forEach(([date], j) => events.push({ date, items: results[j] }));
    }

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=900" },
    });
  } catch (error) {
    console.error("Error fetching lunch menu:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
