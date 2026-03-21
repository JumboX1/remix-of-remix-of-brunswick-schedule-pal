import { useState } from "react";
import { X, RotateCcw } from "lucide-react";
import { BLOCKS, Block, ClassType } from "@/lib/schedule";
import { UserScheduleData } from "@/hooks/useUserData";

interface EditScheduleSheetProps {
  open: boolean;
  onClose: () => void;
  data: UserScheduleData;
  onUpdateBlockName: (block: Block, name: string) => void;
  onSetClassType: (type: ClassType) => void;
  onReset: () => void;
}

export function EditScheduleSheet({
  open,
  onClose,
  data,
  onUpdateBlockName,
  onSetClassType,
  onReset,
}: EditScheduleSheetProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative mt-auto flex max-h-[88vh] flex-col rounded-t-3xl bg-card shadow-2xl safe-bottom animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-xl">My Schedule</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary active:bg-border"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 no-scrollbar">
          {/* Student Name */}
          <div className="mb-5">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Your Name
            </label>
            <input
              type="text"
              value={data.studentName}
              onChange={(e) => onSetStudentName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-accent"
            />
          </div>

          {/* Class Type Toggle */}
          <div className="mb-5">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Lunch Schedule
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
          </div>

          {/* Block Names */}
          <div className="mb-5">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Your Classes
            </label>
            <p className="mb-3 text-xs text-muted-foreground/70">
              Tap a block to add your class name
            </p>
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
                    className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-accent"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Reset */}
          <div className="pt-1">
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground transition-colors active:bg-secondary"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset All Data
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onReset();
                    setConfirmReset(false);
                    onClose();
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
