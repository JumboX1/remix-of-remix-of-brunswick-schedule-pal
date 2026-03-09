import { ExternalLink } from "lucide-react";
import wickcaresIcon from "@/assets/wickcares-icon.webp";

const LINKS = [
  {
    title: "WickCares",
    description: "A LinkedIn for connecting Wick students to local community service",
    href: "https://apps.apple.com/us/app/wickcares/id6744040740",
    cta: "Download on the App Store",
    icon: wickcaresIcon,
  },
];

export function MorePage() {
  return (
    <div className="flex flex-1 flex-col px-5 pt-6 pb-24">
      <h1 className="text-2xl font-semibold">More</h1>
      <p className="mt-1 text-sm text-muted-foreground">Helpful links & resources</p>

      <div className="mt-6 space-y-3">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl bg-card border border-border p-4 transition-colors active:bg-secondary"
          >
            {link.icon && (
              <img src={link.icon} alt={link.title} className="h-14 w-14 shrink-0 rounded-xl" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{link.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{link.description}</p>
              <p className="mt-1 text-xs font-medium text-accent">{link.cta}</p>
            </div>
            <ExternalLink className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
        App developed and managed by Jack Wendell '27.{" "}
        If there are any problems with the app please contact{" "}
        <a href="mailto:jwendell@brunswickschool.org" className="text-accent underline">
          jwendell@brunswickschool.org
        </a>
      </p>
    </div>
  );
}
