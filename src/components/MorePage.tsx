import { ExternalLink, CalendarDays, Mail, BookOpen, Globe } from "lucide-react";
import wickcaresIcon from "@/assets/wickcares-icon.webp";

const LINKS = [
  {
    href: "https://apps.apple.com/us/app/wickcares/id6744040740",
    icon: wickcaresIcon,
    isImage: true,
    title: "WickCares",
    desc: "Community service for Wick students",
  },
  {
    href: "https://mybackpack.brunswickschool.org",
    icon: Globe,
    isImage: false,
    title: "MyBrunswick Portal",
    desc: "Grades, assignments & announcements",
  },
  {
    href: "https://my.brunswickschool.org/calendars",
    icon: CalendarDays,
    isImage: false,
    title: "School Calendar",
    desc: "Events, holidays & important dates",
  },
];

interface MorePageProps {
  onOpenEditSchedule?: () => void;
}

export function MorePage({ onOpenEditSchedule }: MorePageProps) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pb-1 pt-4">
        <h1 className="text-2xl leading-tight font-serif">More</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-24 no-scrollbar">
        {/* Edit Schedule */}
        {onOpenEditSchedule && (
          <div className="mt-4">
            <button
              onClick={onOpenEditSchedule}
              className="flex w-full items-center gap-3.5 rounded-2xl bg-card border border-border/60 p-4 transition-all active:scale-[0.98] active:bg-secondary"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Edit Schedule</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Classes, division & lunch</p>
              </div>
            </button>
          </div>
        )}

        {/* Resources */}
        <div className="mt-5">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
            Resources
          </p>
          <div className="space-y-2">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3.5 rounded-2xl bg-card border border-border/60 p-3.5 transition-all active:scale-[0.98] hover:shadow-sm hover:border-border"
              >
                {link.isImage ? (
                  <img src={link.icon as string} alt={link.title} className="h-11 w-11 shrink-0 rounded-xl" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/8">
                    {(() => {
                      const Icon = link.icon as typeof Globe;
                      return <Icon className="h-5 w-5 text-primary" />;
                    })()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{link.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{link.desc}</p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-1.5">
          <p className="text-[11px] text-muted-foreground/60">
            Built & maintained by Jack Wendell '27
          </p>
          <a
            href="mailto:jwendell@brunswickschool.org"
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent/60 hover:text-accent transition-colors"
          >
            <Mail className="h-3 w-3" />
            jwendell@brunswickschool.org
          </a>
        </div>
      </div>
    </div>
  );
}
