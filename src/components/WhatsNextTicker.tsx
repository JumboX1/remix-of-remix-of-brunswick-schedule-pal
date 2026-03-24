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
        // Next slot hasn't started yet
        const nextSlot = slots[i];
        return {
          status: "upcoming" as const,
          label: getSlotName(nextSlot, blockNames),
          block: nextSlot.block,
          countdown: formatCountdown(start.getTime() - currentMs),
          startTime: nextSlot.start,
          progress: 0,
        };
      }

      if (currentMs >= start.getTime() && currentMs < end.getTime()) {
        const name = getSlotName(slots[i], blockNames);
        const total = end.getTime() - start.getTime();
        const elapsed = currentMs - start.getTime();
        const remaining = end.getTime() - currentMs;
        const progress = Math.min(1, elapsed / total);

        // Next slot
        const nextSlot = slots[i + 1];
        const nextName = nextSlot ? getSlotName(nextSlot, blockNames) : null;
        const nextTime = nextSlot?.start ?? null;

        return {
          status: "active" as const,
          label: name,
          block: slots[i].block,
          countdown: formatCountdown(remaining),
          progress,
          nextLabel: nextName,
          nextTime,
          nextBlock: nextSlot?.block ?? null,
        };
      }
    }

    // All slots done
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

  if (tickerInfo.status === "upcoming") {
    return (
      <div className="mx-4 mb-3 space-y-2">
        {/* Hero card - upcoming */}
        <div className="rounded-xl bg-primary px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-primary-foreground/60">
                Up Next
              </p>
              <p className="mt-0.5 text-lg font-semibold text-primary-foreground">
                {tickerInfo.block ? `${tickerInfo.block} Block` : tickerInfo.label}
              </p>
              {tickerInfo.block && tickerInfo.label !== `Block ${tickerInfo.block}` && (
                <p className="text-xs text-primary-foreground/70">{tickerInfo.label}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-primary-foreground">
                {tickerInfo.countdown}
              </p>
              <p className="text-[11px] text-primary-foreground/50">
                starts at {tickerInfo.startTime}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active
  return (
    <div className="mx-4 mb-3 space-y-2">
      {/* Hero card - current block */}
      <div className="rounded-xl bg-accent px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-accent-foreground/60">
              Current
            </p>
            <p className="mt-0.5 text-lg font-semibold text-accent-foreground">
              {tickerInfo.block ? `${tickerInfo.block} Block` : tickerInfo.label}
            </p>
            {tickerInfo.block && tickerInfo.label !== `Block ${tickerInfo.block}` && (
              <p className="text-xs text-accent-foreground/70">{tickerInfo.label}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold tabular-nums text-accent-foreground">
              {tickerInfo.countdown}
            </p>
            <p className="text-[11px] text-accent-foreground/50">remaining</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full rounded-full bg-accent-foreground/15 overflow-hidden">
          <div
            className="h-full rounded-full bg-accent-foreground/40 transition-all duration-1000 ease-linear"
            style={{ width: `${tickerInfo.progress * 100}%` }}
          />
        </div>
      </div>

      {/* Up Next mini card */}
      {tickerInfo.nextLabel && (
        <div className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Next
            </span>
            {tickerInfo.nextBlock && (
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                {tickerInfo.nextBlock}
              </span>
            )}
            <span className="text-sm font-medium text-foreground">{tickerInfo.nextLabel}</span>
          </div>
          {tickerInfo.nextTime && (
            <span className="text-xs tabular-nums text-muted-foreground">
              at {tickerInfo.nextTime}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
