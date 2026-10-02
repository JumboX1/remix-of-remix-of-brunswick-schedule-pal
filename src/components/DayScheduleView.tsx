import { useEffect, useState } from "react";
import { ScheduleSlot, Block, getDaySchedule, getBlocksForDate, ClassType } from "@/lib/schedule";
import { getSchoolDayInfo, isSchoolDay } from "@/lib/schoolCalendar";

interface DayScheduleViewProps {
  slots: ScheduleSlot[];
  blockNames: Record<Block, string>;
  isWeekend: boolean;
  selectedDate: Date;
  classType?: ClassType;
  blockLunchOverrides?: Record<Block, string>;
}

export function DayScheduleView({ slots, blockNames, isWeekend, selectedDate, classType = "underclassman", blockLunchOverrides }: DayScheduleViewProps) {
  const schoolInfo = getSchoolDayInfo(selectedDate);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // No school (non-weekend)
  if (!isWeekend && slots.length === 0 && schoolInfo && schoolInfo.type !== "early_dismissal") {
    return (
      <div className="mt-2 flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card px-6 py-14 text-center shadow-sm animate-page-in">
        <p className="font-serif text-2xl text-foreground">{schoolInfo.reason}</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {schoolInfo.type === "break" ? "Enjoy your break" : "No classes today"}
        </p>
      </div>
    );
  }

  // Weekend → show next week preview
  if (isWeekend) {
    return <WeekendPreview selectedDate={selectedDate} blockNames={blockNames} classType={classType} blockLunchOverrides={blockLunchOverrides} />;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isSameDay = now.toDateString() === selectedDate.toDateString();

  function parseTime(t: string): number {
    const [h, m] = t.split(":").map(Number);
    const hour = h < 7 ? h + 12 : h;
    return hour * 60 + m;
  }

  return (
    <div key={selectedDate.toDateString()} className="space-y-2 animate-page-in">
      {schoolInfo?.type === "early_dismissal" && (
        <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/10 px-4 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <p className="text-xs font-semibold text-accent">{schoolInfo.reason}</p>
        </div>
      )}

      {slots.map((slot) => {
        const className = slot.block ? blockNames[slot.block] : "";
        const isClass = slot.type === "class";
        const isFilled = slot.type === "assembly" || slot.type === "advisory";
        const startMin = parseTime(slot.start);
        const endMin = parseTime(slot.end);
        const duration = endMin - startMin;
        const isActive = isSameDay && currentMinutes >= startMin && currentMinutes < endMin;
        const isPast = isSameDay && currentMinutes >= endMin;
        const progress = isActive ? Math.min(1, (currentMinutes - startMin) / Math.max(1, duration)) : 0;

        return (
          <div
            key={`${slot.label}-${slot.start}-${slot.end}`}
            className={`relative flex items-stretch overflow-hidden rounded-xl transition-all duration-300 active:scale-[0.98] ${
              slot.type === "assembly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : slot.type === "advisory"
                ? "bg-accent text-accent-foreground shadow-sm"
                : slot.type === "lunch"
                ? "border border-dashed border-border bg-secondary/70"
                : "border border-border/70 bg-card shadow-sm"
            } ${isActive ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""} ${
              isPast && !isActive ? "opacity-40" : ""
            }`}
          >
            <div className={`flex w-[4.25rem] shrink-0 flex-col items-center justify-center py-3 ${isClass ? "border-r border-border/70" : ""}`}>
              <span className={`text-xs font-semibold tabular-nums ${isFilled ? "opacity-90" : "text-foreground/80"}`}>
                {slot.start}
              </span>
              <span className={`text-[10px] tabular-nums ${isFilled ? "opacity-60" : "text-muted-foreground"}`}>
                {slot.end}
              </span>
            </div>

            <div className="flex flex-1 items-center gap-3 px-3 py-3">
              {slot.block && (
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                  isFilled ? "bg-primary-foreground/15" : isActive ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary"
                }`}>
                  {slot.block}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-tight">{className || slot.label}</p>
                <p className={`mt-0.5 text-[11px] ${isFilled ? "opacity-70" : "text-muted-foreground"}`}>
                  {className && isClass ? `Block ${slot.block} · ` : ""}
                  {duration} min
                </p>
              </div>
              {isActive && (
                <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-2 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-bold tracking-wider text-accent">NOW</span>
                </span>
              )}
            </div>

            {isActive && (
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-[3px] bg-accent transition-all duration-1000"
                style={{ width: `${progress * 100}%` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function WeekendPreview({
  selectedDate,
  blockNames,
  classType,
  blockLunchOverrides,
}: {
  selectedDate: Date;
  blockNames: Record<Block, string>;
  classType: ClassType;
  blockLunchOverrides?: Record<Block, string>;
}) {
  // Find next Monday
  const monday = new Date(selectedDate);
  const dayOfWeek = monday.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  monday.setDate(monday.getDate() + daysUntilMonday);

  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-4">
      <div className="text-center py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Next week</p>
      </div>

      {weekDays.map((date, i) => {
        const dayInfo = getSchoolDayInfo(date);
        const noSchool = dayInfo && dayInfo.type !== "early_dismissal";
        const blocks = getBlocksForDate(date);
        const daySlots = getDaySchedule(date, classType, blockLunchOverrides);

        const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        if (noSchool || !isSchoolDay(date)) {
          return (
          <div key={toDateKey(date)} className="rounded-xl border border-dashed border-border bg-secondary/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{DAY_NAMES[date.getDay()]}</p>
                  <p className="text-xs text-muted-foreground">{dateLabel}</p>
                </div>
                <p className="text-xs text-muted-foreground/60">{dayInfo?.reason ?? "No school"}</p>
              </div>
            </div>
          );
        }

        return (
          <div key={toDateKey(date)} className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-secondary/30">
              <div>
                <p className="text-sm font-semibold text-foreground">{DAY_NAMES[date.getDay()]}</p>
                <p className="text-xs text-muted-foreground">{dateLabel}</p>
              </div>
              <p className="text-[10px] font-medium tracking-wider text-muted-foreground/70 uppercase">
                {blocks.join(" · ")}
              </p>
            </div>

            <div className="divide-y divide-border">
              {daySlots.map((slot, j) => {
                const className = slot.block ? blockNames[slot.block] : "";
                return (
                  <div key={`${slot.label}-${slot.start}-${slot.end}`} className="flex items-center gap-3 px-4 py-2">
                    <span className="w-14 shrink-0 text-[11px] tabular-nums text-muted-foreground">{slot.start}</span>
                    {slot.block && (
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                        slot.type === "assembly" || slot.type === "advisory"
                          ? "bg-primary/10 text-primary"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {slot.block}
                      </span>
                    )}
                    <span className="text-sm text-foreground">{className || slot.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
