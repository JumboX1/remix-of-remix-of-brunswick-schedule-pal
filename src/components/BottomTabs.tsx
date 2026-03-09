import { CalendarDays, UtensilsCrossed, MoreHorizontal } from "lucide-react";

export type AppTab = "schedule" | "lunch" | "more";

interface BottomTabsProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; Icon: typeof CalendarDays }[] = [
  { id: "schedule", label: "Schedule", Icon: CalendarDays },
  { id: "lunch", label: "Lunch", Icon: UtensilsCrossed },
  { id: "more", label: "More", Icon: MoreHorizontal },
];

export function BottomTabs({ active, onChange }: BottomTabsProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-lg">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 pb-1 pt-2.5 transition-colors ${
              active === id ? "text-accent" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={active === id ? 2.2 : 1.8} />
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
