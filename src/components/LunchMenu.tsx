import { useEffect, useState, useCallback, useMemo } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Leaf, Loader2, RefreshCw,
  UtensilsCrossed, Soup, Drumstick, Pizza, Fish, Beef, Sandwich, Salad, Apple, Wheat,
  Carrot, Egg, Cake, Cookie, Coffee, Milk, School, ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSchoolDayInfo, isSchoolDay } from "@/lib/schoolCalendar";

const CACHE_KEY = "brunswick-lunch-cache-v2";
const DINING_URL = "https://my.brunswickschool.org/calendars/dining";

const ICON_RULES: Array<[string[], LucideIcon]> = [
  [["salad"], Salad],
  [["soup", "chowder", "bisque", "stew", "chili", "ramen", "pho"], Soup],
  [["pizza", "flatbread", "calzone"], Pizza],
  [["salmon", "fish", "tuna", "cod", "shrimp", "seafood", "tilapia", "sushi"], Fish],
  [["chicken", "wings", "nugget", "tender", "francese", "turkey"], Drumstick],
  [["steak", "beef", "meatball", "pork", "lamb", "roast", "ribs", "bbq", "burger", "slider", "sausage", "brisket"], Beef],
  [["sandwich", "sub", "panini", "hoagie", "wrap", "burrito", "taco", "quesadilla", "melt"], Sandwich],
  [["salad", "caesar", "greens", "slaw"], Salad],
  [["fruit", "apple", "berry", "melon"], Apple],
  [["rice", "bread", "roll", "biscuit", "naan", "pita", "pasta", "penne", "noodle", "mac", "grain", "polenta", "risotto", "tortilla"], Wheat],
  [["broccoli", "carrot", "zucchini", "vegetable", "veggie", "corn", "beans", "green", "spinach", "potato", "fries"], Carrot],
  [["egg", "omelet", "frittata", "quiche"], Egg],
  [["cookie", "brownie"], Cookie],
  [["cake", "dessert", "pie", "pudding"], Cake],
  [["yogurt", "milk", "smoothie", "parfait"], Milk],
  [["coffee", "tea", "cocoa"], Coffee],
];

function getIcon(item: string): LucideIcon {
  const lower = item.toLowerCase();
  for (const [keys, Icon] of ICON_RULES) if (keys.some((k) => lower.includes(k))) return Icon;
  return UtensilsCrossed;
}

type MenuCategory = "main" | "side" | "salad" | "other";
const MAIN_KEYWORDS = ["chicken", "beef", "steak", "salmon", "fish", "pork", "burger", "pizza", "pasta", "sandwich", "taco", "wrap", "soup", "francese", "tuna", "ribs", "bbq", "panini", "turkey", "meatball", "chili", "burrito", "shrimp", "penne", "mac"];
const SALAD_KEYWORDS = ["salad", "caesar", "greens", "fruit", "yogurt", "granola", "seasonal", "slaw"];
const SIDE_KEYWORDS = ["rice", "bread", "fries", "potato", "polenta", "corn", "zucchini", "broccoli", "vegetable", "naan", "roll", "steamed", "sauteed", "mashed", "roasted", "beans", "chips"];

function categorize(item: string): MenuCategory {
  const lower = item.toLowerCase();
  if (lower.includes("salad")) return "salad";
  if (MAIN_KEYWORDS.some((k) => lower.includes(k))) return "main";
  if (SALAD_KEYWORDS.some((k) => lower.includes(k))) return "salad";
  if (SIDE_KEYWORDS.some((k) => lower.includes(k))) return "side";
  return "other";
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** Today on weekdays; the upcoming Monday on weekends. */
function defaultDate(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (isWeekend(d)) d.setDate(d.getDate() + 1);
  return d;
}

function mondayOf(d: Date): Date {
  const m = new Date(d);
  m.setHours(12, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

type MenuMap = Record<string, string[]>;

function MenuItemRow({ item }: { item: string }) {
  const Icon = getIcon(item);
  return (
    <li className="flex items-center gap-3.5 rounded-xl bg-card border border-border/70 px-4 py-3 shadow-sm transition-transform active:scale-[0.98]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10">
        <Icon aria-hidden="true" className="h-4 w-4 text-accent" />
      </span>
      <span className="text-[14px] font-medium leading-snug">{item}</span>
    </li>
  );
}

function MenuSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">{title}</h2>
      <ul className="space-y-1.5">
        {items.map((item, i) => <MenuItemRow key={`${item}-${i}`} item={item} />)}
      </ul>
    </section>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="mt-2 rounded-xl border border-border/60 bg-card p-8 text-center shadow-sm">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
        <Icon aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
      </span>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

export function LunchMenu() {
  const [menuData, setMenuData] = useState<MenuMap>({});
  const [closedDates, setClosedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyEvents = useCallback((events: Array<{ date: string; items: string[] }>) => {
    const map: MenuMap = {};
    const closed = new Set<string>();
    for (const evt of events ?? []) {
      if (!evt?.date || !Array.isArray(evt.items)) continue;
      const isClosed = evt.items.length === 1 && evt.items[0].toUpperCase().includes("CLOSED");
      if (isClosed) closed.add(evt.date);
      else if (evt.items.length > 0) map[evt.date] = evt.items;
    }
    setMenuData(map);
    setClosedDates(closed);
  }, []);

  const fetchMenu = useCallback(async () => {
    setError(null);
    let hadCache = false;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        applyEvents(JSON.parse(cached));
        hadCache = true;
        setLoading(false);
      }
    } catch { /* ignore bad cache */ }
    if (!hadCache) setLoading(true);
    setRefreshing(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-lunch-menu");
      if (fnError) throw fnError;
      const events = data?.events ?? [];
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(events)); } catch { /* storage full */ }
      applyEvents(events);
    } catch (e) {
      console.error("Failed to fetch lunch menu:", e);
      if (!hadCache) setError("Couldn't load the menu");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyEvents]);

  useEffect(() => { fetchMenu(); }, [fetchMenu]);

  // Step by school weekday, skipping Saturdays & Sundays
  const step = useCallback((delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      do next.setDate(next.getDate() + delta); while (isWeekend(next));
      return next;
    });
    navigator.vibrate?.(8);
  }, []);

  const dateKey = toKey(selectedDate);
  const items = menuData[dateKey];
  const todayKey = toKey(defaultDate());
  const isDefault = dateKey === todayKey;
  const realToday = toKey(new Date()) === dateKey;

  const week = useMemo(() => {
    const mon = mondayOf(selectedDate);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const categorized = useMemo(() => {
    if (!items) return null;
    const groups = { main: [] as string[], side: [] as string[], salad: [] as string[], other: [] as string[] };
    for (const item of items) groups[categorize(item)].push(item);
    const hasCategories = groups.main.length + groups.side.length + groups.salad.length > 0;
    return { ...groups, hasCategories };
  }, [items]);

  const weekHasAnyMenu = week.some((d) => menuData[toKey(d)]);

  function renderEmpty() {
    const info = getSchoolDayInfo(selectedDate);
    if (closedDates.has(dateKey) || !isSchoolDay(selectedDate)) {
      return <EmptyState icon={School} title="No School" body={info?.reason ? `${info.reason} — no lunch served` : "School is closed — no lunch served"} />;
    }
    if (!weekHasAnyMenu) {
      return <EmptyState icon={ClipboardList} title="Menu Not Posted Yet" body="Brunswick has not posted lunch listings for this week yet" />;
    }
    return <EmptyState icon={ClipboardList} title="No Menu Listed" body="Brunswick hasn't posted a menu for this day" />;
  }

  return (
    <div className="flex flex-1 flex-col animate-page-in">
      <header className="flex items-end justify-between px-5 pb-1 pt-4">
        <div>
          <h1 className="text-[28px] leading-tight">Lunch</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Upper School · Flik Dining</p>
        </div>
        <button
          type="button"
          onClick={fetchMenu}
          aria-label="Refresh menu"
          className="mb-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-transform active:scale-[0.92] active:bg-secondary"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </header>

      {/* Week strip */}
      <div className="px-4 pt-2">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => step(-5)} aria-label="Previous week"
            className="flex h-9 w-7 shrink-0 items-center justify-center rounded-full active:bg-secondary">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="grid flex-1 grid-cols-5 gap-1.5">
            {week.map((d) => {
              const k = toKey(d);
              const selected = k === dateKey;
              const has = !!menuData[k];
              const off = closedDates.has(k) || !isSchoolDay(d);
              const isNow = k === toKey(new Date());
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => { setSelectedDate(d); navigator.vibrate?.(8); }}
                  aria-label={d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  aria-pressed={selected}
                  className={`flex flex-col items-center rounded-xl py-2 transition-all active:scale-[0.96] ${
                    selected ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border border-border/60"
                  } ${off && !selected ? "opacity-40" : ""}`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${selected ? "opacity-70" : "text-muted-foreground"}`}>
                    {d.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className={`text-base font-semibold leading-tight ${isNow && !selected ? "text-accent" : ""}`}>{d.getDate()}</span>
                  <span className={`mt-0.5 h-1 w-1 rounded-full ${has ? (selected ? "bg-primary-foreground" : "bg-accent") : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => step(5)} aria-label="Next week"
            className="flex h-9 w-7 shrink-0 items-center justify-center rounded-full active:bg-secondary">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <p className="text-sm font-semibold tracking-tight">
            {selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {realToday && <span className="ml-2 text-[10px] font-bold tracking-widest text-accent">TODAY</span>}
          </p>
          {!isDefault && (
            <button type="button" onClick={() => setSelectedDate(defaultDate())}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-accent active:bg-accent/10">
              {isWeekend(new Date()) ? "Next week" : "Today"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-3 no-scrollbar">
        {loading ? (
          <div className="space-y-1.5" aria-label="Loading menu">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3.5 rounded-xl border border-border/50 bg-card px-4 py-3">
                <span className="h-8 w-8 animate-pulse rounded-full bg-secondary" />
                <span className="h-3 animate-pulse rounded bg-secondary" style={{ width: `${55 - i * 8}%` }} />
              </div>
            ))}
            <p className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading menu…
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/15 bg-destructive/5 p-5 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button type="button" onClick={fetchMenu} className="mt-2.5 text-xs font-semibold text-accent active:opacity-70">
              Try again
            </button>
          </div>
        ) : categorized && items && items.length > 0 ? (
          <div key={dateKey} className="space-y-5 animate-page-in">
            {categorized.hasCategories ? (
              <>
                <MenuSection title="Entrées" items={categorized.main} />
                <MenuSection title="Sides" items={categorized.side} />
                <MenuSection title="Salad & Fresh" items={categorized.salad} />
                <MenuSection title="Also Serving" items={categorized.other} />
              </>
            ) : (
              <MenuSection title="Menu" items={items} />
            )}
          </div>
        ) : (
          <div key={dateKey} className="animate-page-in">{renderEmpty()}</div>
        )}

        <div className="mt-4 rounded-xl bg-secondary/50 p-4">
          <div className="flex items-start gap-2.5">
            <Leaf className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Allergy meals available.
            </p>
          </div>
        </div>

        <a href={DINING_URL} target="_blank" rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-primary px-5 py-4 text-primary-foreground shadow-sm transition-transform active:scale-[0.98]">
          <div className="flex items-center gap-3.5">
            <CalendarDays aria-hidden="true" className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold tracking-tight">Full Dining Calendar</p>
              <p className="mt-0.5 text-xs opacity-60">Opens in browser</p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 opacity-60" />
        </a>
      </div>
    </div>
  );
}
