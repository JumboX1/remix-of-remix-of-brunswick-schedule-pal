import { useState } from "react";
import { RotateCcw, ChevronRight } from "lucide-react";
import { ClassType, BLOCKS, Block } from "@/lib/schedule";
import { UserScheduleData } from "@/hooks/useUserData";

interface SettingsPageProps {
  data: UserScheduleData;
  onSetClassType: (type: ClassType) => void;
  onUpdateBlockName: (block: Block, name: string) => void;
  onReset: () => void;
}

export function SettingsPage({ data, onSetClassType, onUpdateBlockName, onReset }: SettingsPageProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <header className="px-5 pb-2 pt-4">
        <h1 className="text-2xl leading-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground font-sans">Customize your experience</p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-24 no-scrollbar space-y-5">
        {/* Division Toggle */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Division
          </label>
          <div className="flex rounded-2xl bg-secondary p-1">
            {(["underclassman", "upperclassman"] as ClassType[]).map((type) => (
              <button
                key={type}
                onClick={() => onSetClassType(type)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  data.classType === type
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                {type === "underclassman" ? "Underclassman" : "Upperclassman"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground/60">
            This affects your lunch schedule timing
          </p>
        </div>

        {/* Block Names */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Your Classes
          </label>
          <div className="space-y-2">
            {BLOCKS.map((block) => (
              <div key={block} className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  {block}
                </div>
                <input
                  type="text"
                  value={data.blockNames[block]}
                  onChange={(e) => onUpdateBlockName(block, e.target.value)}
                  placeholder={`Block ${block}`}
                  className="flex-1 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-accent"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Clear Data */}
        <div className="pt-2">
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 px-4 py-3 text-sm text-destructive transition-colors active:bg-destructive/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear All Data & Reset
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground">This will erase all your saved data</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                  }}
                  className="flex-1 rounded-xl bg-destructive px-4 py-3 text-sm font-medium text-destructive-foreground"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 rounded-xl border border-border px-4 py-3 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
