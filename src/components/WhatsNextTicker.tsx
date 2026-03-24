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

    // Find current or next slot
    for (let i = 0; i < slots.length; i++) {
      const start = parseTime(slots[i].start, selectedDate);
      const end = parseTime(slots[i].end, selectedDate);

      if (currentMs < start.getTime()) {
        // Next slot hasn't started
        const name = slots[i].block ? (blockNames[slots[i].block!] || `Block ${slots[i].block}`) : slots[i].label;
        return {
          status: "upcoming" as const,
          label: name,
          countdown: formatCountdown(start.getTime() - currentMs),
          prefix: "Next up",
        };
      }

      if (currentMs >= start.getTime() && currentMs < end.getTime()) {
        // Currently in this slot
        const name = slots[i].block ? (blockNames[slots[i].block!] || `Block ${slots[i].block}`) : slots[i].label;
        const remaining = end.getTime() - currentMs;

        // Also peek at what's next
        const nextSlot = slots[i + 1];
        const nextName = nextSlot
          ? nextSlot.block
            ? (blockNames[nextSlot.block!] || `Block ${nextSlot.block}`)
            : nextSlot.label
          : "End of day";

        return {
          status: "active" as const,
          label: name,
          countdown: formatCountdown(remaining),
          prefix: "ends in",
          nextLabel: nextName,
        };
      }
    }

    // All slots are done
    const lastEnd = parseTime(slots[slots.length - 1].end, selectedDate);
    if (currentMs >= lastEnd.getTime()) {
      return { status: "done" as const, label: "School's out!", countdown: "", prefix: "" };
    }

    return null;
  }, [now, isToday, slots, blockNames, selectedDate]);

  if (!tickerInfo) return null;

  if (tickerInfo.status === "done") {
    return (
      <div className="mx-5 mb-2 flex items-center gap-3 rounded-2xl bg-secondary px-4 py-3">
        <span className="text-base">🎉</span>
        <p className="text-sm font-medium text-foreground">School's out for today!</p>
      </div>
    );
  }

  return (
    <div className="mx-5 mb-2 flex items-center gap-3 rounded-2xl bg-accent/10 border border-accent/20 px-4 py-3">
      <div className="flex h-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground text-xs font-bold tabular-nums px-3">
        {tickerInfo.countdown}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {tickerInfo.status === "active" ? tickerInfo.label : tickerInfo.label}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          {tickerInfo.status === "active"
            ? `${tickerInfo.prefix} · Then ${tickerInfo.nextLabel}`
            : `starts soon`}
        </p>
      </div>
      {tickerInfo.status === "active" && (
        <div className="h-2 w-2 rounded-full bg-accent animate-pulse shrink-0" />
      )}
    </div>
  );
}
