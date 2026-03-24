import { useState, useEffect, useMemo } from "react";
import { ScheduleSlot, Block } from "@/lib/schedule";

interface WhatsNextTickerProps {
  slots: ScheduleSlot[];
  blockNames: Record<Block, string>;
  selectedDate: Date;
}

function parseTime(t: string, refDate: Date): Date {
  const [h, m] = t.split(":").map(Number);
  const hour = h < 7 ? h + 12 : h;
  const d = new Date(refDate);
  d.setHours(hour, m, 0, 0);
  return d;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getSlotName(slot: ScheduleSlot, blockNames: Record<Block, string>): string {
  return slot.block ? (blockNames[slot.block] || `Block ${slot.block}`) : (slot.label || "");
}

export function WhatsNextTicker({ slots, blockNames, selectedDate }: WhatsNextTickerProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isToday = now.toDateString() === selectedDate.toDateString();

  const tickerInfo = useMemo(() => {
    if (!isToday || slots.length === 0) return null;

    const currentMs = now.getTime();

    for (let i = 0; i < slots.length; i++) {
      const start = parseTime(slots[i].start, selectedDate);
      const end = parseTime(slots[i].end, selectedDate);

      if (currentMs < start.getTime()) {
        // Before school / between slots — show upcoming as "current" with countdown to start
        const upcomingSlot = slots[i];
        const countdownToStart = start.getTime() - currentMs;

        // Also find what comes after
        const afterSlot = slots[i + 1] ?? null;

        return {
          status: "upcoming" as const,
          currentLabel: getSlotName(upcomingSlot, blockNames),
          currentBlock: upcomingSlot.block,
          countdown: formatCountdown(countdownToStart),
          countdownSuffix: "until start",
          progress: 0,
          startTime: upcomingSlot.start,
          nextLabel: afterSlot ? getSlotName(afterSlot, blockNames) : null,
          nextBlock: afterSlot?.block ?? null,
          nextTime: afterSlot?.start ?? null,
        };
      }

      if (currentMs >= start.getTime() && currentMs < end.getTime()) {
        const total = end.getTime() - start.getTime();
        const elapsed = currentMs - start.getTime();
        const remaining = end.getTime() - currentMs;
        const progress = Math.min(1, elapsed / total);

        const nextSlot = slots[i + 1] ?? null;

        return {
          status: "active" as const,
          currentLabel: getSlotName(slots[i], blockNames),
          currentBlock: slots[i].block,
          countdown: formatCountdown(remaining),
          countdownSuffix: "remaining",
          progress,
          startTime: slots[i].start,
          nextLabel: nextSlot ? getSlotName(nextSlot, blockNames) : null,
          nextBlock: nextSlot?.block ?? null,
          nextTime: nextSlot?.start ?? null,
        };
      }
    }

    const lastEnd = parseTime(slots[slots.length - 1].end, selectedDate);
    if (currentMs >= lastEnd.getTime()) {
      return { status: "done" as const };
    }

    return null;
  }, [now, isToday, slots, blockNames, selectedDate]);

  if (!tickerInfo) return null;

  if (tickerInfo.status === "done") {
    return (
      <div className="mx-4 mb-3">
        <div className="rounded-xl bg-secondary px-4 py-3">
          <p className="text-sm font-medium text-foreground">School's done for today</p>
        </div>
      </div>
    );
  }

  const isActive = tickerInfo.status === "active";
  const bgClass = isActive ? "bg-accent" : "bg-primary";
  const fgClass = isActive ? "text-accent-foreground" : "text-primary-foreground";
  const fgMuted = isActive ? "text-accent-foreground/60" : "text-primary-foreground/60";
  const fgSub = isActive ? "text-accent-foreground/70" : "text-primary-foreground/70";
  const fgDim = isActive ? "text-accent-foreground/50" : "text-primary-foreground/50";
  const barBg = isActive ? "bg-accent-foreground/15" : "bg-primary-foreground/15";
  const barFill = isActive ? "bg-accent-foreground/40" : "bg-primary-foreground/40";

  return (
    <div className="mx-4 mb-3">
      <div className={`rounded-xl ${bgClass} px-4 pt-4 pb-3 shadow-sm`}>
        {/* Current block row */}
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-[11px] font-medium uppercase tracking-wider ${fgMuted}`}>
              {isActive ? "Now" : "Up Next"}
            </p>
            <p className={`mt-0.5 text-lg font-semibold ${fgClass}`}>
              {tickerInfo.currentBlock ? `${tickerInfo.currentBlock} Block` : tickerInfo.currentLabel}
            </p>
            {tickerInfo.currentBlock && tickerInfo.currentLabel !== `Block ${tickerInfo.currentBlock}` && (
              <p className={`text-xs ${fgSub}`}>{tickerInfo.currentLabel}</p>
            )}
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold tabular-nums ${fgClass}`}>
              {tickerInfo.countdown}
            </p>
            <p className={`text-[11px] ${fgDim}`}>
              {tickerInfo.countdownSuffix}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`mt-3 h-1.5 w-full rounded-full ${barBg} overflow-hidden`}>
          <div
            className={`h-full rounded-full ${barFill} transition-all duration-1000 ease-linear`}
            style={{ width: `${tickerInfo.progress * 100}%` }}
          />
        </div>

        {/* Up Next divider + row */}
        {tickerInfo.nextLabel && (
          <>
            <div className={`mt-3 border-t ${isActive ? "border-accent-foreground/10" : "border-primary-foreground/10"}`} />
            <div className="mt-2.5 flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium uppercase tracking-wider ${fgMuted}`}>
                  Next
                </span>
                {tickerInfo.nextBlock && (
                  <span className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold ${
                    isActive ? "bg-accent-foreground/15 text-accent-foreground/80" : "bg-primary-foreground/15 text-primary-foreground/80"
                  }`}>
                    {tickerInfo.nextBlock}
                  </span>
                )}
                <span className={`text-sm font-medium ${fgSub}`}>
                  {tickerInfo.nextLabel}
                </span>
              </div>
              {tickerInfo.nextTime && (
                <span className={`text-xs tabular-nums ${fgDim}`}>
                  {tickerInfo.nextTime}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
