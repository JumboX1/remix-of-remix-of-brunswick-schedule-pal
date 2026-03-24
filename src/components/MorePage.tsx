import { ExternalLink, Settings, Pencil, Info } from "lucide-react";
import wickcaresIcon from "@/assets/wickcares-icon.webp";

interface MorePageProps {
  onOpenSettings?: () => void;
  onOpenEditSchedule?: () => void;
}

export function MorePage({ onOpenSettings, onOpenEditSchedule }: MorePageProps) {
  return (
    <div className="flex flex-1 flex-col px-5 pt-6 pb-24">
      <h1 className="text-2xl leading-tight">More</h1>
      <p className="mt-0.5 text-sm text-muted-foreground font-sans">Settings & resources</p>

      <div className="mt-5 space-y-1.5">
        {/* Settings */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-3 rounded-xl bg-card border border-border px-4 py-3 shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Settings</p>
              <p className="text-[11px] text-muted-foreground">Division, class names, reset</p>
            </div>
          </button>
        )}

        {/* Edit Schedule */}
        {onOpenEditSchedule && (
          <button
            onClick={onOpenEditSchedule}
            className="flex w-full items-center gap-3 rounded-xl bg-card border border-border px-4 py-3 shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <Pencil className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">Edit Schedule</p>
              <p className="text-[11px] text-muted-foreground">Class names & lunch overrides</p>
            </div>
          </button>
        )}
      </div>

      {/* Links */}
      <div className="mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Resources
        </p>
        <a
          href="https://apps.apple.com/us/app/wickcares/id6744040740"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl bg-card border border-border p-3 shadow-sm transition-all active:scale-[0.98]"
        >
          <img src={wickcaresIcon} alt="WickCares" className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">WickCares</p>
            <p className="text-[11px] text-muted-foreground">Community service for Wick students</p>
          </div>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        </a>
      </div>

      <p className="mt-auto pt-10 text-center text-[10px] leading-tight text-muted-foreground/60">
        App maintained by Jack Wendell '27.{" "}
        <a href="mailto:jwendell@brunswickschool.org" className="text-accent/60 underline">
          jwendell@brunswickschool.org
        </a>
      </p>
    </div>
  );
}
