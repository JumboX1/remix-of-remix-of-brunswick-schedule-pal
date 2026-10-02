import { CalendarDays, UtensilsCrossed, LayoutGrid } from "lucide-react";

export type AppTab = "schedule" | "lunch" | "more";

interface BottomTabsProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; Icon: typeof CalendarDays }[] = [
  { id: "schedule", label: "Schedule", Icon: CalendarDays },
  { id: "lunch", label: "Lunch", Icon: UtensilsCrossed },
  { id: "more", label: "More", Icon: LayoutGrid },
];

export function BottomTabs({ active, onChange }: BottomTabsProps) {
  return (
    <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/90 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex max-w-lg px-3">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = active === id;
          return (
            <button
              type="button"
              key={id}
              onClick={() => {
                if (!isActive && navigator.vibrate) navigator.vibrate(6);
                onChange(id);
              }}
              aria-current={isActive ? "page" : undefined}
              className={`group flex flex-1 flex-col items-center gap-1 pb-1.5 pt-2 transition-colors active:scale-[0.96] ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <span
                className={`flex h-7 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                  isActive ? "bg-primary/10" : "bg-transparent"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={isActive ? 2.3 : 1.8} />
              </span>
              <span className={`text-[10px] tracking-wide ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
