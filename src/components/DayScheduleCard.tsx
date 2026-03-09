import { ScheduleSlot } from "@/lib/schedule";

const TYPE_STYLES: Record<string, string> = {
  assembly: "bg-primary text-primary-foreground",
  advisory: "bg-accent text-accent-foreground",
  class: "bg-card text-card-foreground border border-border",
  lunch: "bg-secondary text-secondary-foreground",
};

interface DayScheduleCardProps {
  slots: ScheduleSlot[];
  dateLabel: string;
  blocksLabel: string;
}

export function DayScheduleCard({ slots, dateLabel, blocksLabel }: DayScheduleCardProps) {
  if (slots.length === 0) {
    return (
      <div className="rounded-lg bg-card border border-border p-8 text-center">
        <p className="text-muted-foreground text-lg">No school today</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-semibold">{dateLabel}</h2>
        <span className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          {blocksLabel}
        </span>
      </div>

      <div className="space-y-1.5">
        {slots.map((slot, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-lg px-4 py-3 transition-all hover:shadow-md ${TYPE_STYLES[slot.type]}`}
          >
            <div className="flex items-center gap-3">
              {slot.block && (
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                  {slot.block}
                </span>
              )}
              <span className="font-medium">{slot.label}</span>
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">
              {slot.start} – {slot.end}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
