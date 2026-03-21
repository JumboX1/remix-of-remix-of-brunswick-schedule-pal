import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Leaf, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DINING_URL = "https://my.brunswickschool.org/calendars/dining";

const ITEM_EMOJIS: Record<string, string> = {
  soup: "🍜", chicken: "🍗", rice: "🍚", pizza: "🍕", pasta: "🍝",
  salmon: "🐟", fish: "🐟", steak: "🥩", beef: "🥩", sandwich: "🥪",
  burger: "🍔", fries: "🍟", salad: "🥗", fruit: "🍎", bread: "🍞",
  naan: "🫓", wings: "🍗", taco: "🌮", wrap: "🌯", caesar: "🥗",
  yogurt: "🥛", granola: "🥣", cheese: "🧀", pork: "🥩",
};

function getEmoji(item: string): string {
  const lower = item.toLowerCase();
  for (const [key, emoji] of Object.entries(ITEM_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return "🍽️";
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

type MenuMap = Record<string, string[]>;
type ClosedSet = Set<string>;

export function LunchMenu() {
  const [menuData, setMenuData] = useState<MenuMap>({});
  const [closedDates, setClosedDates] = useState<ClosedSet>(new Set());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-lunch-menu");
      if (fnError) throw fnError;

      const map: MenuMap = {};
      const closed = new Set<string>();
      for (const evt of (data?.events ?? []) as Array<{ date: string; items: string[] }>) {
        const isClosed = evt.items.length === 1 && evt.items[0].toUpperCase().includes("SCHOOL CLOSED");
        if (isClosed) {
          closed.add(evt.date);
        } else if (evt.items.length > 0) {
          map[evt.date] = evt.items;
        }
      }
      setMenuData(map);
      setClosedDates(closed);
    } catch (e) {
      console.error("Failed to fetch lunch menu:", e);
      setError("Couldn't load menu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const navigate = useCallback((delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
  }, []);

  const dateKey = toKey(selectedDate);
  const items = menuData[dateKey];
  const today = new Date();
  const isToday = toKey(today) === dateKey;

  // Find previous and next dates that have menus
  const sortedDates = useMemo(() => Object.keys(menuData).sort(), [menuData]);
  const hasPrev = sortedDates.some((d) => d < dateKey);
  const hasNext = sortedDates.some((d) => d > dateKey);

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pb-1 pt-4">
        <h1 className="text-2xl leading-tight">Lunch</h1>
      </header>

      {/* Day Navigation */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-medium">{formatDate(selectedDate)}</p>
            {isToday && (
              <p className="text-[10px] text-accent font-semibold tracking-wide">TODAY</p>
            )}
          </div>
          <button
            onClick={() => navigate(1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:bg-secondary"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {!isToday && (
          <div className="mt-1.5 flex justify-center">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="text-xs font-medium text-accent active:opacity-70"
            >
              Back to today
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-24 no-scrollbar space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-destructive/10 p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={fetchMenu}
              className="mt-2 text-xs font-medium text-accent active:opacity-70"
            >
              Try again
            </button>
          </div>
        ) : items && items.length > 0 ? (
          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </p>
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl bg-card border border-border px-4 py-3"
                >
                  <span className="text-base">{getEmoji(item)}</span>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-secondary p-6 text-center">
            <span className="text-3xl">
              {selectedDate.getDay() === 0 || selectedDate.getDay() === 6 ? "🛋️" : closedDates.has(dateKey) ? "🏫" : "📋"}
            </span>
            <p className="mt-2 text-sm font-medium">No Menu Available</p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedDate.getDay() === 0 || selectedDate.getDay() === 6
                ? "No lunch on weekends"
                : closedDates.has(dateKey)
                ? "School closed — no lunch today"
                : "Menu not posted yet for this day"}
            </p>
          </div>
        )}

        {/* Open full menu in browser */}
        <a
          href={DINING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4 text-primary-foreground active:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-3.5">
            <span className="text-xl">📅</span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Full Calendar</p>
              <p className="text-xs opacity-60 mt-0.5">Opens in browser</p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 opacity-70" />
        </a>

        {/* Note */}
        <div className="rounded-2xl bg-secondary/60 p-4">
          <div className="flex items-start gap-2">
            <Leaf className="mt-0.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Menu sourced from Brunswick dining calendar. Gluten-free items available daily.
            </p>
          </div>
        </div>


      </div>
    </div>
  );
}
