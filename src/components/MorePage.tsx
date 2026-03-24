import { ExternalLink } from "lucide-react";
import wickcaresIcon from "@/assets/wickcares-icon.webp";

export function MorePage() {
  return (
    <div className="flex flex-1 flex-col px-5 pt-6 pb-24">
      <h1 className="text-2xl leading-tight">More</h1>
      <p className="mt-0.5 text-sm text-muted-foreground font-sans">Resources</p>

      {/* Links */}
      <div className="mt-5">
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
