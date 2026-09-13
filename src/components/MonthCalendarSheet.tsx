import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getBlocksForDate } from "@/lib/schedule";
import { getSchoolDayInfo } from "@/lib/schoolCalendar";

interface MonthCalendarSheetProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function MonthCalendarSheet({ open, onClose, selectedDate, onSelectDate }: MonthCalendarSheetProps) {
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Reset the viewed month to the selected date whenever the sheet opens
  useEffect(() => {
    if (open) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [open, selectedDate]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const grid: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) grid.push(null);
    for (let day = 1; day <= daysInMonth; day++) grid.push(new Date(viewYear, viewMonth, day));
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [viewYear, viewMonth]);

  if (!open) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="month-calendar-title"
        className="relative mt-auto flex max-h-[80dvh] flex-col overscroll-contain rounded-t-3xl bg-card shadow-2xl safe-bottom animate-in slide-in-from-bottom duration-300"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-2">
          <h2 id="month-calendar-title" className="text-lg">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-full active:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-full active:bg-secondary"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close month view"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-secondary active:bg-border"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 no-scrollbar">
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60"
              >
                {label}
              </div>
            ))}
            {cells.map((date, i) => {
              if (!date) return <div key={i} />;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === today.toDateString();
              const info = getSchoolDayInfo(date);
              const noSchool = !isWeekend && info && info.type !== "early_dismissal";
              const blocks = isWeekend || noSchool ? [] : getBlocksForDate(date);

              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    onSelectDate(date);
                    onClose();
                  }}
                  aria-label={date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                  aria-pressed={isSelected}
                  className={`flex min-h-[52px] flex-col items-center justify-start rounded-xl py-1.5 transition-all active:scale-[0.96] ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isToday
                        ? "bg-accent/12 ring-1 ring-accent"
                        : "active:bg-secondary"
                  }`}
                >
                  <span
                    className={`text-sm font-semibold leading-none ${
                      isSelected
                        ? ""
                        : isToday
                          ? "text-accent"
                          : isWeekend || noSchool
                            ? "text-muted-foreground/40"
                            : "text-foreground"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {blocks.length > 0 ? (
                    <span
                      className={`mt-1 max-w-full truncate px-0.5 text-[7px] font-bold tracking-[0.06em] leading-none ${
                        isSelected ? "opacity-70" : "text-muted-foreground/50"
                      }`}
                    >
                      {blocks.join("·")}
                    </span>
                  ) : noSchool ? (
                    <span
                      className={`mt-1 text-[7px] font-bold leading-none ${
                        isSelected ? "opacity-70" : "text-muted-foreground/40"
                      }`}
                    >
                      OFF
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
