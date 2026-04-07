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

  // No school (non-weekend)
  if (!isWeekend && schoolInfo && schoolInfo.type !== "early_dismissal") {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-serif text-foreground">{schoolInfo.reason}</p>
        <p className="mt-1 text-sm text-muted-foreground/60">
          {schoolInfo.type === "break" ? "Enjoy your break" : "No school today"}
        </p>
      </div>
    );
  }

  // Weekend → show next week preview
  if (isWeekend) {
    return <WeekendPreview selectedDate={selectedDate} blockNames={blockNames} classType={classType} blockLunchOverrides={blockLunchOverrides} />;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isSameDay = now.toDateString() === selectedDate.toDateString();

  function parseTime(t: string): number {
    const [h, m] = t.split(":").map(Number);
    const hour = h < 7 ? h + 12 : h;
    return hour * 60 + m;
  }

  return (
    <div className="space-y-1.5">
      {/* Early dismissal banner */}
      {schoolInfo?.type === "early_dismissal" && (
        <div className="flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-2.5 mb-1">
          <p className="text-xs font-medium text-accent">{schoolInfo.reason}</p>
        </div>
      )}

      {slots.map((slot, i) => {
        const className = slot.block ? blockNames[slot.block] : "";
        const isClass = slot.type === "class";
        const startMin = parseTime(slot.start);
        const endMin = parseTime(slot.end);
        const isActive = isSameDay && currentMinutes >= startMin && currentMinutes < endMin;
        const isPast = isSameDay && currentMinutes >= endMin;

        return (
          <div
            key={i}
            className={`flex items-stretch rounded-xl transition-all active:scale-[0.98] ${
              slot.type === "assembly"
                ? "bg-primary text-primary-foreground shadow-sm"
                : slot.type === "advisory"
                ? "bg-accent text-accent-foreground shadow-sm"
                : slot.type === "lunch"
                ? "bg-secondary"
                : "bg-card border border-border shadow-sm"
            } ${isActive ? "ring-2 ring-accent ring-offset-1 ring-offset-background scale-[1.01]" : ""} ${
              isPast && !isActive ? "opacity-40" : ""
            }`}
          >
            {/* Time column */}
            <div className={`flex w-16 shrink-0 flex-col items-center justify-center py-3 ${
              isClass ? "border-r border-border" : ""
            }`}>
              <span className={`text-[11px] font-medium tabular-nums ${
                slot.type === "assembly" || slot.type === "advisory"
                  ? "opacity-80"
                  : "text-muted-foreground"
              }`}>
                {slot.start}
              </span>
              <span className={`text-[10px] tabular-nums ${
                slot.type === "assembly" || slot.type === "advisory"
                  ? "opacity-50"
                  : "text-muted-foreground/50"
              }`}>
                {slot.end}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center gap-3 px-3 py-3">
              {slot.block && (
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  slot.type === "assembly" || slot.type === "advisory"
                    ? "bg-white/15 text-inherit"
                    : "bg-primary/10 text-primary"
                }`}>
                  {slot.block}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">
                  {className || slot.label}
                </p>
                {className && isClass && (
                  <p className={`mt-0.5 text-[11px] ${
                    slot.type === "assembly" || slot.type === "advisory"
                      ? "opacity-60"
                      : "text-muted-foreground"
                  }`}>
                    Block {slot.block}
                  </p>
                )}
              </div>
              {isActive && (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-semibold text-accent">NOW</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
