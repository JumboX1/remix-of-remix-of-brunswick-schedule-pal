import { useMemo } from "react";
import { getBlocksForDate } from "@/lib/schedule";
import { getSchoolDayInfo } from "@/lib/schoolCalendar";

interface WeekBarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function WeekBar({ selectedDate, onSelectDate }: WeekBarProps) {
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
    <div className="flex items-stretch gap-1.5">
      {weekDates.map((date, i) => {
        const blocks = getBlocksForDate(date);
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const isToday = date.toDateString() === today.toDateString();
        const info = getSchoolDayInfo(date);
        const noSchool = info && info.type !== "early_dismissal";

        return (
          <button
            key={i}
            onClick={() => onSelectDate(date)}
            className={`
              relative flex flex-1 flex-col items-center rounded-2xl py-2.5 transition-all
              ${isSelected && isToday
                ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25"
                : isSelected
                  ? noSchool
                    ? "bg-muted text-foreground ring-2 ring-border"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : isToday
                    ? "bg-accent/12 ring-2 ring-accent"
                    : "hover:bg-secondary active:bg-secondary"
              }
            `}
          >
            {/* Today label replaces day name */}
            <span className={`text-[11px] font-semibold tracking-wide ${
              isSelected && isToday
                ? "text-accent-foreground/80"
                : isSelected
                  ? "opacity-80"
                  : isToday
                    ? "text-accent font-bold"
                    : "text-muted-foreground"
            }`}>
              {isToday ? "Today" : DAY_LABELS[i]}
            </span>

            {/* Date number */}
            <span className={`mt-1 text-lg font-bold leading-none ${
              isSelected
                ? ""
                : isToday
                  ? "text-accent"
                  : noSchool
                    ? "text-muted-foreground/40"
                    : "text-foreground"
            }`}>
              {date.getDate()}
            </span>

            {/* Block letters or OFF indicator */}
            {blocks.length > 0 ? (
              <span className={`mt-1.5 text-[8px] font-bold tracking-[0.08em] leading-none ${
                isSelected ? "opacity-60" : "text-muted-foreground/50"
              }`}>
                {blocks.join("·")}
              </span>
            ) : noSchool ? (
              <span className={`mt-1.5 text-[8px] font-bold leading-none ${
                isSelected ? "opacity-60" : "text-muted-foreground/40"
              }`}>
                OFF
              </span>
            ) : (
              <span className="mt-1.5 text-[8px] leading-none opacity-0">·</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
