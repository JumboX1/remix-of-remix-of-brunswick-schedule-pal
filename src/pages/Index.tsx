import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { DayScheduleView } from "@/components/DayScheduleView";
import { WeekBar } from "@/components/WeekBar";
import { EditScheduleSheet } from "@/components/EditScheduleSheet";
import { LunchMenu } from "@/components/LunchMenu";
import { MorePage } from "@/components/MorePage";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import { AlertBanner } from "@/components/AlertBanner";
import { WhatsNextTicker } from "@/components/WhatsNextTicker";
import { BottomTabs, AppTab } from "@/components/BottomTabs";
import { useUserData } from "@/hooks/useUserData";
import { getDaySchedule, getBlocksForDate, ClassType } from "@/lib/schedule";
import { getSchoolDayInfo, mergeDbCalendar } from "@/lib/schoolCalendar";
import { supabase } from "@/integrations/supabase/client";

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("schedule");
  const { data, updateBlockName, setClassType, setStudentName, setOnboarded, resetAll } = useUserData();

  // Fetch DB calendar overrides on mount
  useEffect(() => {
    supabase
      .from("school_calendar")
      .select("date, reason, day_type")
      .then(({ data: rows }) => {
        if (rows && rows.length > 0) {
          mergeDbCalendar(rows);
        }
      });
  }, []);

  const dayOfWeek = selectedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const slots = useMemo(
    () => getDaySchedule(selectedDate, data.classType),
    [selectedDate, data.classType]
  );
  const blocks = useMemo(() => getBlocksForDate(selectedDate), [selectedDate]);

  const navigate = useCallback((delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
  }, []);

  // Onboarding: if not yet onboarded, show selection screen
  if (!data.onboarded) {
    return (
      <OnboardingScreen
        onSelect={(type: ClassType) => {
          setClassType(type);
          setOnboarded(true);
        }}
      />
    );
  }

  const schoolInfo = getSchoolDayInfo(selectedDate);
  const today = new Date();
  const isToday = today.toDateString() === selectedDate.toDateString();

  const dayLabel = isWeekend
    ? "Weekend"
    : ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][dayOfWeek];

  const monthDay = selectedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const noSchoolInfo = schoolInfo && schoolInfo.type !== "early_dismissal" ? schoolInfo : null;

  const greeting = data.studentName
    ? `Hey, ${data.studentName}`
    : noSchoolInfo
    ? noSchoolInfo.reason
    : isToday
    ? "Today"
    : dayLabel;

  const subtitle = noSchoolInfo
    ? monthDay
    : isToday
    ? monthDay
    : `${dayLabel}, ${monthDay}`;

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-background safe-top">
      <div className="h-[env(safe-area-inset-top)]" />

      {activeTab === "schedule" ? (
        <>
          {/* Top Bar */}
          <header className="px-5 pb-1 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl leading-tight truncate">{greeting}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground font-sans">
                  {subtitle}
                  {blocks.length > 0 && (
                    <span className="ml-2 text-xs tracking-wider text-muted-foreground/70">
                      {blocks.join(" · ")}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary transition-colors active:bg-border ml-3"
                aria-label="Edit schedule"
              >
                <Pencil className="h-4 w-4 text-foreground" />
              </button>
            </div>
          </header>

          {/* Week Navigation */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate(-7)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:bg-secondary"
              >
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex-1">
                <WeekBar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              </div>
              <button
                onClick={() => navigate(7)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full active:bg-secondary"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {!isToday && (
              <div className="mt-1.5 flex justify-center">
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="text-xs font-medium text-accent active:opacity-70"
                >
                  Back to today
                </button>
              </div>
            )}
          </div>

          {/* Alert Banner (snow days, delays) */}
          <AlertBanner />

          {/* What's Next Ticker */}
          <WhatsNextTicker
            slots={slots}
            blockNames={data.blockNames}
            selectedDate={selectedDate}
          />

          {/* Schedule */}
          <main className="flex-1 overflow-y-auto px-4 pb-24 no-scrollbar">
            <DayScheduleView
              slots={slots}
              blockNames={data.blockNames}
              isWeekend={isWeekend}
              selectedDate={selectedDate}
            />
          </main>
        </>
      ) : activeTab === "lunch" ? (
        <LunchMenu />
      ) : (
        <MorePage />
      )}

      <BottomTabs active={activeTab} onChange={setActiveTab} />

      <EditScheduleSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        data={data}
        onUpdateBlockName={updateBlockName}
        onSetClassType={setClassType}
        onSetStudentName={setStudentName}
        onReset={resetAll}
      />
    </div>
  );
}
