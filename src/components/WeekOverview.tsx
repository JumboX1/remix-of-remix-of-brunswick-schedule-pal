import { useMemo } from "react";
import { getBlocksForDate } from "@/lib/schedule";

interface WeekOverviewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function WeekOverview({ selectedDate, onSelectDate }: WeekOverviewProps) {
  // Get the Monday of the selected date's week
  const weekDates = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));

    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }, [selectedDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        This Week
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {weekDates.map((date, i) => {
          const blocks = getBlocksForDate(date);
          const isSelected =
            date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === today.toDateString();

          return (
            <button
              key={i}
              onClick={() => onSelectDate(date)}
              className={`rounded-lg p-2 text-center transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:bg-secondary"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide opacity-70">
                {DAY_LABELS[i]}
              </p>
              <p
                className={`text-lg font-bold ${
                  isToday && !isSelected ? "text-accent" : ""
                }`}
              >
                {date.getDate()}
              </p>
              <p className="mt-0.5 text-[10px] font-medium tracking-wider opacity-60">
                {blocks.join("·")}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
