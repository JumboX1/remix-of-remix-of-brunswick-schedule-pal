import { ClassType } from "@/lib/schedule";
import { BookOpen, GraduationCap } from "lucide-react";

interface OnboardingScreenProps {
  onSelect: (type: ClassType) => void;
}

export function OnboardingScreen({ onSelect }: OnboardingScreenProps) {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-background px-6 safe-top">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl leading-tight mb-2">Welcome to Brunswick</h1>
        <p className="text-sm text-muted-foreground mb-10">
          Choose your grade to get started
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onSelect("underclassman")}
            className="flex w-full flex-col items-center rounded-2xl bg-card border border-border px-6 py-5 transition-all active:scale-[0.98] active:bg-secondary"
          >
            <BookOpen aria-hidden="true" className="mb-2 h-6 w-6 text-accent" />
            <span className="text-base font-semibold">Underclassman</span>
            <span className="text-xs text-muted-foreground mt-1">Grades 9–10 · First lunch</span>
          </button>

          <button
            type="button"
            onClick={() => onSelect("upperclassman")}
            className="flex w-full flex-col items-center rounded-2xl bg-card border border-border px-6 py-5 transition-all active:scale-[0.98] active:bg-secondary"
          >
            <GraduationCap aria-hidden="true" className="mb-2 h-6 w-6 text-accent" />
            <span className="text-base font-semibold">Upperclassman</span>
            <span className="text-xs text-muted-foreground mt-1">Grades 11–12 · Second lunch</span>
          </button>
        </div>

        <p className="mt-8 text-[11px] text-muted-foreground/50">
          You can change this anytime in Edit Schedule
        </p>
      </div>
    </div>
  );
}
