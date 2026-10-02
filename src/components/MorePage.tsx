import { ChevronRight, CalendarDays, Mail, BookOpen, Globe, UtensilsCrossed, ArrowUpRight } from "lucide-react";
import wickcaresIcon from "@/assets/wickcares-icon.webp";

type LinkItem = {
  href: string;
  title: string;
  desc: string;
  icon: typeof Globe | string;
};

const SCHOOL_LINKS: LinkItem[] = [
  {
    href: "https://mybackpack.brunswickschool.org",
    icon: Globe,
    title: "MyBackpack",
    desc: "Grades, assignments & announcements",
  },
  {
    href: "https://my.brunswickschool.org/calendars",
    icon: CalendarDays,
    title: "School Calendar",
    desc: "Events, holidays & important dates",
  },
  {
    href: "https://my.brunswickschool.org/calendars/dining",
    icon: UtensilsCrossed,
    title: "Dining Calendar",
    desc: "Full Flik menu for every division",
  },
];

const APP_LINKS: LinkItem[] = [
  {
    href: "https://apps.apple.com/us/app/wickcares/id6744040740",
    icon: wickcaresIcon,
    title: "WickCares",
    desc: "Community service for Wick students",
  },
];

interface MorePageProps {
  onOpenEditSchedule?: () => void;
}

function Row({ item, last }: { item: LinkItem; last: boolean }) {
  const isImage = typeof item.icon === "string";
  const Icon = item.icon as typeof Globe;
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex items-center gap-3.5 px-4 py-3 transition-colors active:bg-secondary"
    >
      {isImage ? (
        <img src={item.icon as string} alt="" className="h-9 w-9 shrink-0 rounded-lg shadow-sm" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-[18px] w-[18px] text-primary" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{item.title}</span>
        <span className="block truncate text-xs text-muted-foreground">{item.desc}</span>
      </span>
      <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground/50" />
      {!last && <span className="absolute bottom-0 left-[4.25rem] right-0 h-px bg-border/70" />}
    </a>
  );
}

function Group({ title, items }: { title: string; items: LinkItem[] }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h2>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        {items.map((item, i) => (
          <Row key={item.href} item={item} last={i === items.length - 1} />
        ))}
      </div>
    </section>
  );
}

export function MorePage({ onOpenEditSchedule }: MorePageProps) {
  return (
    <div className="flex flex-1 flex-col animate-page-in">
      <header className="px-5 pb-1 pt-4">
        <h1 className="text-[28px] leading-tight">More</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Your schedule & school links</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-28 no-scrollbar">
        {onOpenEditSchedule && (
          <button
            type="button"
            onClick={onOpenEditSchedule}
            className="mt-4 flex w-full items-center gap-3.5 rounded-xl bg-primary p-4 text-left text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">Edit Schedule</span>
              <span className="block text-xs text-primary-foreground/70">Class names, grade & lunch timing</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-primary-foreground/60" />
          </button>
        )}

        <Group title="School" items={SCHOOL_LINKS} />
        <Group title="Apps" items={APP_LINKS} />

        <p className="mt-4 px-1 text-[11px] leading-relaxed text-muted-foreground">
          Everything you enter stays on this device. No account, no names.
        </p>

        <footer className="mt-12 flex flex-col items-center text-center">
          <div className="flex w-40 items-center gap-3 opacity-60" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
            Built &amp; maintained by
          </p>
          <p className="mt-1 font-serif text-[17px] leading-none text-foreground/80">
            Jack Wendell <span className="text-muted-foreground/80">'27</span>
          </p>
          <a
            href="mailto:jwendell@brunswickschool.org"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground transition-all hover:text-accent active:scale-[0.98] active:bg-secondary"
          >
            <Mail className="h-3 w-3 opacity-60" />
            jwendell@brunswickschool.org
          </a>
        </footer>
      </div>
    </div>
  );
}
