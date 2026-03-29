import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, Leaf, Loader2, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DINING_URL = "https://my.brunswickschool.org/calendars/dining";

// Expanded emoji map with many more keywords for better coverage
const ITEM_EMOJIS: Record<string, string> = {
  soup: "🍜", chowder: "🍜", bisque: "🍜", stew: "🍜",
  chicken: "🍗", wings: "🍗", nugget: "🍗", tender: "🍗", francese: "🍗",
  rice: "🍚",
  pizza: "🍕", flatbread: "🍕",
  pasta: "🍝", penne: "🍝", spaghetti: "🍝", rigatoni: "🍝", mac: "🍝", marinara: "🍝", alfredo: "🍝",
  salmon: "🐟", fish: "🐟", tuna: "🐟", cod: "🐟", shrimp: "🦐", seafood: "🦐",
  steak: "🥩", beef: "🥩", meatball: "🥩", pork: "🥩", lamb: "🥩", roast: "🥩",
  sandwich: "🥪", sub: "🥪", panini: "🥪", hoagie: "🥪",
  burger: "🍔", slider: "🍔",
  fries: "🍟", potato: "🥔", mashed: "🥔",
  salad: "🥗", caesar: "🥗", grain: "🥗", greens: "🥗", slaw: "🥗",
  fruit: "🍎", apple: "🍎", berry: "🍓",
  bread: "🍞", roll: "🍞", biscuit: "🍞", toast: "🍞",
  naan: "🫓", pita: "🫓", tortilla: "🫓",
  taco: "🌮", burrito: "🌯", wrap: "🌯", quesadilla: "🌮",
  yogurt: "🥛", smoothie: "🥛", milk: "🥛",
  granola: "🥣", cereal: "🥣", oatmeal: "🥣",
  cheese: "🧀", parmesan: "🧀",
  egg: "🍳", omelet: "🍳", frittata: "🍳",
  corn: "🌽", broccoli: "🥦", broccolini: "🥦", zucchini: "🥒", vegetable: "🥬",
  carrot: "🥕", beans: "🫘", lentil: "🫘",
  cake: "🍰", cookie: "🍪", dessert: "🍰", brownie: "🍫",
  polenta: "🧈", risotto: "🍚",
  curry: "🍛", tikka: "🍛", teriyaki: "🍛",
  dumpling: "🥟", gyoza: "🥟", wonton: "🥟",
  sushi: "🍣",
  sausage: "🌭",
  pancake: "🥞", waffle: "🧇",
  pretzel: "🥨",
  pie: "🥧",
};

function getEmoji(item: string): string | null {
  const lower = item.toLowerCase();
  for (const [key, emoji] of Object.entries(ITEM_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return null;
}

// Categorize items intelligently
type MenuCategory = "main" | "side" | "salad" | "other";

const SIDE_KEYWORDS = ["rice", "bread", "fries", "potato", "polenta", "corn", "zucchini", "broccoli", "broccolini", "vegetable", "garlic bread", "naan", "roll", "steamed", "sauteed", "mashed", "roasted"];
const SALAD_KEYWORDS = ["salad", "caesar", "grain", "greens", "fruit", "yogurt", "granola", "seasonal"];
const MAIN_KEYWORDS = ["chicken", "beef", "steak", "salmon", "fish", "pork", "burger", "pizza", "pasta", "sandwich", "taco", "wrap", "soup", "francese", "tuna"];

function categorize(item: string): MenuCategory {
  const lower = item.toLowerCase();
  if (MAIN_KEYWORDS.some(k => lower.includes(k))) return "main";
  if (SALAD_KEYWORDS.some(k => lower.includes(k))) return "salad";
  if (SIDE_KEYWORDS.some(k => lower.includes(k))) return "side";
  return "other";
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

type MenuMap = Record<string, string[]>;
type ClosedSet = Set<string>;

function MenuItemRow({ item, index }: { item: string; index: number }) {
  const emoji = getEmoji(item);

  return (
    <div
      className="group flex items-center gap-3.5 rounded-2xl bg-card border border-border/60 px-4 py-3.5 transition-all duration-200 hover:shadow-sm hover:border-border"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {emoji ? (
        <span className="text-lg shrink-0 w-7 text-center">{emoji}</span>
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10">
          <UtensilsCrossed className="h-3.5 w-3.5 text-accent" />
        </span>
      )}
      <span className="text-[14px] font-medium leading-snug">{item}</span>
    </div>
  );
}

function MenuSection({ title, items, startIndex }: { title: string; items: string[]; startIndex: number }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
        {title}
      </p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <MenuItemRow key={i} item={item} index={startIndex + i} />
        ))}
      </div>
    </div>
  );
}

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

  // Categorize menu items
  const categorized = useMemo(() => {
    if (!items) return null;
    const mains: string[] = [];
    const sides: string[] = [];
    const salads: string[] = [];
    const others: string[] = [];

    for (const item of items) {
      const cat = categorize(item);
      if (cat === "main") mains.push(item);
      else if (cat === "side") sides.push(item);
      else if (cat === "salad") salads.push(item);
      else others.push(item);
    }

    // If everything ended up in "other", just show as a flat list
    const hasCategories = mains.length > 0 || sides.length > 0 || salads.length > 0;
    return { mains, sides, salads, others, hasCategories };
  }, [items]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="px-5 pb-1 pt-4">
        <h1 className="text-2xl leading-tight font-serif">Lunch</h1>
      </header>

      {/* Day Navigation */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-semibold tracking-tight">{formatDate(selectedDate)}</p>
            {isToday && (
              <p className="text-[10px] text-accent font-bold tracking-widest mt-0.5">TODAY</p>
            )}
          </div>
          <button
            onClick={() => navigate(1)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:bg-secondary transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {!isToday && (
          <div className="mt-1.5 flex justify-center">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="text-xs font-semibold text-accent active:opacity-70 transition-opacity"
            >
              Back to today
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-24 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-accent/60" />
            <p className="text-xs text-muted-foreground">Loading menu…</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-destructive/8 border border-destructive/15 p-5 text-center mt-2">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button
              onClick={fetchMenu}
              className="mt-2.5 text-xs font-semibold text-accent active:opacity-70"
            >
              Try again
            </button>
          </div>
        ) : categorized && items && items.length > 0 ? (
          <div className="space-y-5 mt-1">
            {categorized.hasCategories ? (
              <>
                <MenuSection title="Entrées" items={categorized.mains} startIndex={0} />
                <MenuSection title="Sides" items={categorized.sides} startIndex={categorized.mains.length} />
                <MenuSection title="Salad & Fresh" items={categorized.salads} startIndex={categorized.mains.length + categorized.sides.length} />
                {categorized.others.length > 0 && (
                  <MenuSection title="Also Serving" items={categorized.others} startIndex={categorized.mains.length + categorized.sides.length + categorized.salads.length} />
                )}
              </>
            ) : (
              <div>
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
                  Menu
                </p>
                <div className="space-y-1.5">
                  {items.map((item, i) => (
                    <MenuItemRow key={i} item={item} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-card border border-border/60 p-8 text-center mt-2">
            <span className="text-3xl">
              {selectedDate.getDay() === 0 || selectedDate.getDay() === 6 ? "🛋️" : closedDates.has(dateKey) ? "🏫" : "📋"}
            </span>
            <p className="mt-3 text-sm font-semibold">No Menu Available</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {selectedDate.getDay() === 0 || selectedDate.getDay() === 6
                ? "No lunch on weekends"
                : closedDates.has(dateKey)
                ? "School closed — no lunch today"
                : "Menu not posted yet for this day"}
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="h-4" />

        {/* Full calendar link */}
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
              <p className="text-xs opacity-50 mt-0.5">Opens in browser</p>
            </div>
          </div>
          <ExternalLink className="h-4 w-4 opacity-50" />
        </a>

        {/* Note */}
        <div className="mt-3 rounded-2xl bg-secondary/50 p-4">
          <div className="flex items-start gap-2.5">
            <Leaf className="mt-0.5 h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
              Menu sourced from Brunswick dining calendar. Gluten-free &amp; allergy meals available daily.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
